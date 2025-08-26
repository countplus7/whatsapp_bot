const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/whatsapp');
const OpenAIService = require('../services/openai');
const DatabaseService = require('../services/database');
const path = require('path');
const fs = require('fs-extra');

// Webhook verification endpoint
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      const verificationResult = WhatsAppService.verifyWebhook(mode, token, challenge);
      res.status(200).send(verificationResult);
    } else {
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint for receiving messages
router.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));

    // Process the incoming message
    const messageData = await WhatsAppService.processIncomingMessage(req.body);
    
    if (!messageData) {
      return res.status(200).send('OK');
    }

    console.log('Processed message data:', messageData);

    // Create or get conversation
    const conversation = await DatabaseService.createOrGetConversation(messageData.from);

    // Save the incoming message
    const savedMessage = await DatabaseService.saveMessage({
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
        // Download media file
        const mediaStream = await WhatsAppService.downloadMedia(messageData.mediaId);
        
        // Determine file extension and path
        const timestamp = Date.now();
        const fileExtension = messageData.messageType === 'image' ? '.jpg' : '.ogg';
        const fileName = `${messageData.messageId}_${timestamp}${fileExtension}`;
        const uploadDir = messageData.messageType === 'image' ? 'uploads/images' : 'uploads/audio';
        localFilePath = path.join(uploadDir, fileName);

        // Ensure directory exists before saving file
        await fs.ensureDir(path.dirname(localFilePath));

        // Save file
        const writeStream = fs.createWriteStream(localFilePath);
        mediaStream.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Save media file info to database
        await DatabaseService.saveMediaFile({
          messageId: messageData.messageId,
          fileType: messageData.messageType,
          originalFilename: fileName,
          localFilePath: localFilePath,
          fileSize: fs.statSync(localFilePath).size,
          mimeType: messageData.messageType === 'image' ? 'image/jpeg' : 'audio/ogg'
        });

        // Update message with local file path
        await DatabaseService.saveMessage({
          conversationId: conversation.conversation_id,
          messageId: messageData.messageId,
          fromNumber: messageData.from,
          toNumber: messageData.to,
          messageType: messageData.messageType,
          content: messageData.content,
          mediaUrl: messageData.mediaUrl,
          localFilePath: localFilePath,
          isFromUser: true
        });

        console.log(`Media file saved: ${localFilePath}`);
      } catch (error) {
        console.error('Error downloading media:', error);
        aiResponse = 'Sorry, I encountered an error processing your media file.';
      }
    }

    // Get conversation history for context
    const conversationHistory = await DatabaseService.getConversationHistoryForAI(messageData.from, 10);

    // Process message with AI
    try {
      aiResponse = await OpenAIService.processMessage(
        messageData.messageType,
        messageData.content,
        localFilePath,
        conversationHistory
      );
    } catch (error) {
      console.error('Error processing message with AI:', error);
      aiResponse = 'Sorry, I encountered an error processing your message. Please try again.';
    }

    // Save AI response
    const aiMessageId = `ai_${messageData.messageId}_${Date.now()}`;
    await DatabaseService.saveMessage({
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
      console.log('AI response sent to WhatsApp');
    } catch (error) {
      console.error('Error sending response to WhatsApp:', error);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get conversation history
router.get('/conversations/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 50 } = req.query;

    const history = await DatabaseService.getConversationHistory(phoneNumber, parseInt(limit));
    const stats = await DatabaseService.getConversationStats(phoneNumber);

    res.json({
      success: true,
      data: {
        history,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    });
  }
});

// Send test message
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await WhatsAppService.sendTextMessage(to, message);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

module.exports = router; 