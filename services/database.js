const pool = require('../config/database');

class DatabaseService {
  async createOrGetConversation(whatsappNumber) {
    try {
      const conversationId = `conv_${whatsappNumber}_${Date.now()}`;
      
      // Check if conversation exists
      const existingConversation = await pool.query(
        'SELECT * FROM conversations WHERE whatsapp_number = $1 ORDER BY updated_at DESC LIMIT 1',
        [whatsappNumber]
      );

      if (existingConversation.rows.length > 0) {
        // Update the existing conversation
        await pool.query(
          'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [existingConversation.rows[0].id]
        );
        return existingConversation.rows[0];
      } else {
        // Create new conversation
        const newConversation = await pool.query(
          'INSERT INTO conversations (whatsapp_number, conversation_id) VALUES ($1, $2) RETURNING *',
          [whatsappNumber, conversationId]
        );
        return newConversation.rows[0];
      }
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  }

  async saveMessage(messageData) {
    try {
      const {
        conversationId,
        messageId,
        fromNumber,
        toNumber,
        messageType,
        content,
        mediaUrl,
        localFilePath,
        isFromUser = true,
        aiResponse = null
      } = messageData;

      const result = await pool.query(
        `INSERT INTO messages 
        (conversation_id, message_id, from_number, to_number, message_type, content, media_url, local_file_path, is_from_user, ai_response)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [conversationId, messageId, fromNumber, toNumber, messageType, content, mediaUrl, localFilePath, isFromUser, aiResponse]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async saveMediaFile(mediaData) {
    try {
      const {
        messageId,
        fileType,
        originalFilename,
        localFilePath,
        fileSize,
        mimeType
      } = mediaData;

      const result = await pool.query(
        `INSERT INTO media_files 
        (message_id, file_type, original_filename, local_file_path, file_size, mime_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [messageId, fileType, originalFilename, localFilePath, fileSize, mimeType]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving media file:', error);
      throw error;
    }
  }



  async getConversationHistoryForAI(whatsappNumber, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT 
          CASE 
            WHEN m.is_from_user THEN 'user'
            ELSE 'assistant'
          END as role,
          CASE 
            WHEN m.message_type = 'audio' THEN CONCAT('Audio message: ', COALESCE(m.ai_response, 'Transcribed audio'))
            WHEN m.message_type = 'image' THEN CONCAT('Image: ', COALESCE(m.content, ''), ' - ', COALESCE(m.ai_response, 'Image analyzed'))
            ELSE m.content
          END as content
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.conversation_id
         WHERE c.whatsapp_number = $1
         ORDER BY m.timestamp DESC
         LIMIT $2`,
        [whatsappNumber, limit]
      );

      return result.rows.reverse().map(row => ({
        role: row.role,
        content: row.content
      }));
    } catch (error) {
      console.error('Error getting conversation history for AI:', error);
      throw error;
    }
  }


}

module.exports = new DatabaseService(); 