require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  constructor() {
    this.model = 'gpt-4';
    this.visionModel = 'gpt-4-vision-preview';
  }

  async chatCompletion(messages, conversationHistory = []) {
    try {
      const systemMessage = {
        role: 'system',
        content: `You are a helpful AI assistant integrated with WhatsApp. 
        Be conversational, friendly, and helpful. Keep responses concise but informative.
        If you're analyzing images, describe what you see clearly and provide relevant insights.`
      };

      const allMessages = [systemMessage, ...conversationHistory, ...messages];

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: allMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeImage(imagePath, userMessage = '') {
    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage || 'Please analyze this image and describe what you see. If there is any text in the image, please read it out clearly. Provide a detailed description including any text, objects, people, or important details you can identify.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ];

      const response = await openai.chat.completions.create({
        model: this.visionModel,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI image analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async transcribeAudio(audioPath) {
    try {
      // Check if file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }

      const audioFile = fs.createReadStream(audioPath);
      
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text',
        language: 'en',
        temperature: 0.2, // Lower temperature for more accurate transcription
      });

      return response;
    } catch (error) {
      console.error('OpenAI transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async processMessage(messageType, content, filePath = null, conversationHistory = []) {
    try {
      let aiResponse = '';

      switch (messageType) {
        case 'text':
          aiResponse = await this.chatCompletion([
            { role: 'user', content: content }
          ], conversationHistory);
          break;

        case 'image':
          if (!filePath) {
            throw new Error('Image file path is required for image analysis');
          }
          const imageAnalysis = await this.analyzeImage(filePath, content);
          // Combine image analysis with conversation history for better context
          aiResponse = await this.chatCompletion([
            { role: 'user', content: `Image analysis: ${imageAnalysis}. User message: ${content || 'Please respond to this image.'}` }
          ], conversationHistory);
          break;

        case 'audio':
          if (!filePath) {
            throw new Error('Audio file path is required for transcription');
          }
          const transcription = await this.transcribeAudio(filePath);
          aiResponse = await this.chatCompletion([
            { role: 'user', content: `Transcribed audio: "${transcription}". Please respond to this message naturally and conversationally.` }
          ], conversationHistory);
          break;

        default:
          throw new Error(`Unsupported message type: ${messageType}`);
      }

      return aiResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService(); 