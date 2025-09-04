const pool = require('../config/database');

class DatabaseService {
  async createOrGetConversation(businessId, whatsappNumber) {
    try {
      // Check if conversation exists
      const existingConversation = await pool.query(
        'SELECT * FROM conversations WHERE business_id = $1 AND phone_number = $2 ORDER BY updated_at DESC LIMIT 1',
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
          'INSERT INTO conversations (business_id, phone_number) VALUES ($1, $2) RETURNING *',
          [businessId, whatsappNumber]
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
      const result = await pool.query(
        `INSERT INTO messages (
          business_id, conversation_id, message_id, from_number, to_number, 
          message_type, content, media_url, direction, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          messageData.businessId,
          messageData.conversationId,
          messageData.messageId,
          messageData.fromNumber,
          messageData.toNumber,
          messageData.messageType,
          messageData.content,
          messageData.mediaUrl,
          messageData.isFromUser ? 'inbound' : 'outbound',
          'received'
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async saveMediaFile(mediaData) {
    try {
      const result = await pool.query(
        `INSERT INTO media_files (
          business_id, message_id, file_name, file_path, file_type, file_size
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          mediaData.businessId,
          mediaData.messageId,
          mediaData.fileName,
          mediaData.filePath,
          mediaData.fileType,
          mediaData.fileSize
        ]
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
            WHEN m.direction = 'inbound' THEN 'user'
            ELSE 'assistant'
          END as role,
          CASE 
            WHEN m.message_type = 'audio' THEN CONCAT('Audio message: ', COALESCE(m.content, 'Transcribed audio'))
            WHEN m.message_type = 'image' THEN CONCAT('Image: ', COALESCE(m.content, ''), ' - Image analyzed')
            ELSE m.content
          END as content
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.business_id = $1 AND c.phone_number = $2
         ORDER BY m.created_at DESC
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
      // Since messages table doesn't have local_file_path, we'll update the media_files table instead
      const result = await pool.query(
        'UPDATE media_files SET file_path = $1 WHERE message_id = (SELECT id FROM messages WHERE message_id = $2) RETURNING *',
        [localFilePath, messageId]
      );
      
      if (result.rows.length === 0) {
        console.warn(`No media file found for message ID ${messageId} to update`);
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