require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class WhatsAppService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_TOKEN;
  }

  async sendTextMessage(to, text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: text
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending text message:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  async sendImageMessage(to, imageUrl, caption = '') {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending image message:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp image');
    }
  }

  async sendAudioMessage(to, audioUrl) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'audio',
          audio: {
            link: audioUrl
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending audio message:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp audio');
    }
  }

  async downloadMedia(mediaId) {
    try {
      // First, get the media URL
      const mediaResponse = await axios.get(
        `${this.baseURL}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const mediaUrl = mediaResponse.data.url;

      // Download the media file
      const downloadResponse = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'stream'
      });

      return downloadResponse.data;
    } catch (error) {
      console.error('Error downloading media:', error.response?.data || error.message);
      throw new Error('Failed to download media from WhatsApp');
    }
  }

  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    console.log('Webhook verification failed');
    throw new Error('Invalid webhook verification');
  }

  async processIncomingMessage(body) {
    try {
      console.log('Processing webhook body:', JSON.stringify(body, null, 2));
      
      // Check if this is a valid WhatsApp Business Account webhook
      if (body.object !== 'whatsapp_business_account') {
        throw new Error('Invalid webhook structure: not a WhatsApp Business Account webhook');
      }

      const entry = body.entry?.[0];
      if (!entry) {
        throw new Error('No entry found in webhook body');
      }

      const changes = entry.changes?.[0];
      if (!changes || !changes.value) {
        throw new Error('Invalid webhook structure: no changes or value found');
      }

      const messages = changes.value.messages;
      if (!messages || messages.length === 0) {
        console.log('No messages found in webhook, this might be a status update');
        return null; // No messages to process
      }

      const message = messages[0];
      const from = message.from;
      const timestamp = message.timestamp;
      const messageId = message.id;

      let messageType = 'text';
      let content = '';
      let mediaUrl = null;
      let mediaId = null;

      // Determine message type and extract content
      if (message.text) {
        messageType = 'text';
        content = message.text.body;
      } else if (message.image) {
        messageType = 'image';
        content = message.image.caption || '';
        mediaId = message.image.id;
        // For images, we don't get a direct URL - we need to download using the media ID
        mediaUrl = null;
      } else if (message.audio) {
        messageType = 'audio';
        mediaId = message.audio.id;
        mediaUrl = message.audio.url;
      } else if (message.document) {
        messageType = 'document';
        content = message.document.caption || '';
        mediaId = message.document.id;
        mediaUrl = message.document.url;
      } else {
        messageType = 'unknown';
        content = 'Unsupported message type';
      }

      return {
        from,
        to: this.phoneNumberId,
        messageId,
        messageType,
        content,
        mediaId,
        mediaUrl,
        timestamp
      };
    } catch (error) {
      console.error('Error processing incoming message:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppService(); 