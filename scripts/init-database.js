const pool = require('../config/database');

const createTables = async () => {
  try {
    // Create businesses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create WhatsApp configurations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_configs (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        phone_number_id VARCHAR(100) NOT NULL,
        access_token TEXT NOT NULL,
        verify_token VARCHAR(255),
        webhook_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        UNIQUE(business_id, phone_number_id)
      )
    `);

    // Create business tones table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_tones (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        tone_instructions TEXT NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    // Create conversations table (updated to include business_id)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        whatsapp_number VARCHAR(20) NOT NULL,
        conversation_id VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    // Create messages table (updated to include business_id)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        conversation_id VARCHAR(100) NOT NULL,
        message_id VARCHAR(100) UNIQUE NOT NULL,
        from_number VARCHAR(20) NOT NULL,
        to_number VARCHAR(20) NOT NULL,
        message_type VARCHAR(20) NOT NULL,
        content TEXT,
        media_url VARCHAR(500),
        local_file_path VARCHAR(500),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_from_user BOOLEAN DEFAULT true,
        ai_response TEXT,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      )
    `);

    // Create media_files table (updated to include business_id)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        message_id VARCHAR(100) NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        original_filename VARCHAR(255),
        local_file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_status 
      ON businesses(status)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_business_id 
      ON whatsapp_configs(business_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_business_tones_business_id 
      ON business_tones(business_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_business_id 
      ON conversations(business_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_number 
      ON conversations(whatsapp_number)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_business_id 
      ON messages(business_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
      ON messages(conversation_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
      ON messages(timestamp)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_media_files_business_id 
      ON media_files(business_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_media_files_message_id 
      ON media_files(message_id)
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    await createTables();
    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { createTables }; 