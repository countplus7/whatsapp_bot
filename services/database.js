const pool = require('../config/database');

class DatabaseService {
  async createOrGetConversation(businessId, whatsappNumber) {
    try {
      const conversationId = `conv_${businessId}_${whatsappNumber}_${Date.now()}`;
      
      // Check if conversation exists
      const existingConversation = await pool.query(
        'SELECT * FROM conversations WHERE business_id = $1 AND whatsapp_number = $2 ORDER BY updated_at DESC LIMIT 1',
        [businessId, whatsappNumber]
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
          'INSERT INTO conversations (business_id, whatsapp_number, conversation_id) VALUES ($1, $2, $3) RETURNING *',
          [businessId, whatsappNumber, conversationId]
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
        businessId,
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
        (business_id, conversation_id, message_id, from_number, to_number, message_type, content, media_url, local_file_path, is_from_user, ai_response)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [businessId, conversationId, messageId, fromNumber, toNumber, messageType, content, mediaUrl, localFilePath, isFromUser, aiResponse]
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
        businessId,
        messageId,
        fileType,
        originalFilename,
        localFilePath,
        fileSize,
        mimeType
      } = mediaData;

      const result = await pool.query(
        `INSERT INTO media_files 
        (business_id, message_id, file_type, original_filename, local_file_path, file_size, mime_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [businessId, messageId, fileType, originalFilename, localFilePath, fileSize, mimeType]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving media file:', error);
      throw error;
    }
  }

  async getConversationHistoryForAI(businessId, whatsappNumber, limit = 10) {
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
         WHERE c.business_id = $1 AND c.whatsapp_number = $2
         ORDER BY m.timestamp DESC
         LIMIT $3`,
        [businessId, whatsappNumber, limit]
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

  async updateMessageLocalFilePath(messageId, localFilePath) {
    try {
      const result = await pool.query(
        'UPDATE messages SET local_file_path = $1 WHERE message_id = $2 RETURNING *',
        [localFilePath, messageId]
      );
      
      if (result.rows.length === 0) {
        console.warn(`No message found with ID ${messageId} to update`);
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating message local file path:', error);
      throw error;
    }
  }

}

module.exports = new DatabaseService(); 