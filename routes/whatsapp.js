const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/whatsapp');
const OpenAIService = require('../services/openai');
const DatabaseService = require('../services/database');
const BusinessService = require('../services/business');
const path = require('path');
const fs = require('fs-extra');

// Webhook verification endpoint
router.get('/webhook', (req, res) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    if (!mode || !token) {
      console.log('Webhook verification failed: Missing required parameters');
      return res.status(403).send('Forbidden');
    }

    // For webhook verification, we need to identify which business this is for
    // We'll use a default business for now, but in production you might want to
    // identify this from the webhook URL or other parameters
    const verificationResult = WhatsAppService.verifyWebhook(mode, token, challenge);
    console.log('Webhook verification successful:', { mode, token: token.substring(0, 10) + '...' });
    
    res.status(200).send(verificationResult);
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint for receiving messages
router.post('/webhook', async (req, res) => {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================');

    // Process the incoming message
    const messageData = await WhatsAppService.processIncomingMessage(req.body);
    
    if (!messageData) {
      console.log('No message data to process');
      return res.status(200).send('OK');
    }

    console.log('Processed message data:', {
      messageId: messageData.messageId,
      from: messageData.from,
      to: messageData.to,
      type: messageData.messageType,
      hasContent: !!messageData.content,
      hasMedia: !!messageData.mediaId
    });

    // Identify the business from the phone number ID
    const whatsappConfig = await BusinessService.getWhatsAppConfigByPhoneNumber(messageData.to);
    if (!whatsappConfig) {
      console.error('No WhatsApp configuration found for phone number:', messageData.to);
      return res.status(200).send('OK');
    }

    const businessId = whatsappConfig.business_id;
    console.log(`Processing message for business ID: ${businessId}`);

    // Set WhatsApp service configuration for this business
    WhatsAppService.setBusinessConfig(whatsappConfig);

    // Get business tone for AI responses
    const businessTone = await BusinessService.getBusinessTone(businessId);
    console.log(`Using business tone: ${businessTone ? businessTone.name : 'default'}`);

    // Create or get conversation
    const conversation = await DatabaseService.createOrGetConversation(businessId, messageData.from);

    // Save the incoming message
    const savedMessage = await DatabaseService.saveMessage({
      businessId: businessId,
      conversationId: conversation.conversation_id,
      messageId: messageData.messageId,
      fromNumber: messageData.from,
      toNumber: messageData.to,
      messageType: messageData.messageType,
      content: messageData.content,
      mediaUrl: messageData.mediaUrl,
      localFilePath: null,
      isFromUser: true
    });

    let localFilePath = null;
    let aiResponse = '';

    // Handle different message types
    if (messageData.messageType === 'image' || messageData.messageType === 'audio') {
      try {
        console.log(`Processing ${messageData.messageType} message...`);
        
        // Download media file
        const mediaStream = await WhatsAppService.downloadMedia(messageData.mediaId);
        
        // Determine file extension and path
        const timestamp = Date.now();
        const fileExtension = messageData.messageType === 'image' ? '.jpg' : '.ogg';
        const fileName = `${businessId}_${messageData.messageId}_${timestamp}${fileExtension}`;
        const uploadDir = messageData.messageType === 'image' ? 'uploads/images' : 'uploads/audio';
        localFilePath = path.join(uploadDir, fileName);

        // Ensure directory exists before saving file
        await fs.ensureDir(path.dirname(localFilePath));

        // Save file with proper error handling
        const writeStream = fs.createWriteStream(localFilePath);
        mediaStream.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', (error) => {
            console.error('Error writing file:', error);
            reject(error);
          });
          mediaStream.on('error', (error) => {
            console.error('Error reading media stream:', error);
            reject(error);
          });
        });

        // Save media file info to database
        const fileStats = fs.statSync(localFilePath);
        await DatabaseService.saveMediaFile({
          businessId: businessId,
          messageId: messageData.messageId,
          fileType: messageData.messageType,
          originalFilename: fileName,
          localFilePath: localFilePath,
          fileSize: fileStats.size,
          mimeType: messageData.messageType === 'image' ? 'image/jpeg' : 'audio/ogg'
        });

        // Update message with local file path
        await DatabaseService.updateMessageLocalFilePath(messageData.messageId, localFilePath);

        console.log(`Media file saved successfully: ${localFilePath} (${fileStats.size} bytes)`);
      } catch (error) {
        console.error('Error downloading media:', error);
        aiResponse = 'Sorry, I encountered an error processing your media file. Please try sending it again.';
      }
    }

    // Get conversation history for context
    const conversationHistory = await DatabaseService.getConversationHistoryForAI(businessId, messageData.from, 10);
    console.log(`Retrieved ${conversationHistory.length} previous messages for context`);

    // Process message with AI (including business tone)
    try {
      console.log(`Processing ${messageData.messageType} message with AI...`);
      aiResponse = await OpenAIService.processMessage(
        messageData.messageType,
        messageData.content,
        localFilePath,
        conversationHistory,
        businessTone
      );
      console.log('AI response generated successfully');
    } catch (error) {
      console.error('Error processing message with AI:', error);
      aiResponse = 'Sorry, I encountered an error processing your message. Please try again in a moment.';
    }

    // Save AI response
    const aiMessageId = `ai_${messageData.messageId}_${Date.now()}`;
    await DatabaseService.saveMessage({
      businessId: businessId,
      conversationId: conversation.conversation_id,
      messageId: aiMessageId,
      fromNumber: messageData.to,
      toNumber: messageData.from,
      messageType: 'text',
      content: aiResponse,
      mediaUrl: null,
      localFilePath: null,
      isFromUser: false,
      aiResponse: aiResponse
    });

    // Send response back to WhatsApp
    try {
      await WhatsAppService.sendTextMessage(messageData.from, aiResponse);
      console.log('AI response sent to WhatsApp successfully');
    } catch (error) {
      console.error('Error sending response to WhatsApp:', error);
      // Don't fail the webhook, just log the error
    }

    console.log('=== WEBHOOK PROCESSING COMPLETED ===');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router; 