const pool = require('../config/database');

const addSampleData = async () => {
  try {
    console.log('Adding sample business data...');

    // Add sample businesses
    const business1 = await pool.query(
      'INSERT INTO businesses (name, description) VALUES ($1, $2) RETURNING *',
      ['TechCorp Solutions', 'A technology consulting company specializing in AI and automation']
    );
    console.log('Added business:', business1.rows[0].name);

    const business2 = await pool.query(
      'INSERT INTO businesses (name, description) VALUES ($1, $2) RETURNING *',
      ['Green Earth Retail', 'An eco-friendly retail store selling sustainable products']
    );
    console.log('Added business:', business2.rows[0].name);

    const business3 = await pool.query(
      'INSERT INTO businesses (name, description) VALUES ($1, $2) RETURNING *',
      ['HealthCare Plus', 'A healthcare provider offering telemedicine services']
    );
    console.log('Added business:', business3.rows[0].name);

    // Add sample WhatsApp configurations
    const config1 = await pool.query(
      `INSERT INTO whatsapp_configs 
      (business_id, phone_number_id, access_token, verify_token, webhook_url) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business1.rows[0].id,
        '123456789012345',
        'sample_access_token_1',
        'verify_token_1',
        'https://yourdomain.com/webhook'
      ]
    );
    console.log('Added WhatsApp config for:', business1.rows[0].name);

    const config2 = await pool.query(
      `INSERT INTO whatsapp_configs 
      (business_id, phone_number_id, access_token, verify_token, webhook_url) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business2.rows[0].id,
        '987654321098765',
        'sample_access_token_2',
        'verify_token_2',
        'https://yourdomain.com/webhook'
      ]
    );
    console.log('Added WhatsApp config for:', business2.rows[0].name);

    const config3 = await pool.query(
      `INSERT INTO whatsapp_configs 
      (business_id, phone_number_id, access_token, verify_token, webhook_url) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business3.rows[0].id,
        '555666777888999',
        'sample_access_token_3',
        'verify_token_3',
        'https://yourdomain.com/webhook'
      ]
    );
    console.log('Added WhatsApp config for:', business3.rows[0].name);

    // Add sample business tones
    const tone1 = await pool.query(
      `INSERT INTO business_tones 
      (business_id, name, description, tone_instructions, is_default) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business1.rows[0].id,
        'Professional Tech',
        'Professional and technical tone for technology consulting',
        'Respond in a professional, technical manner. Use industry terminology when appropriate. Be concise and solution-oriented. Maintain a helpful and knowledgeable tone.',
        true
      ]
    );
    console.log('Added tone for:', business1.rows[0].name);

    const tone2 = await pool.query(
      `INSERT INTO business_tones 
      (business_id, name, description, tone_instructions, is_default) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business2.rows[0].id,
        'Eco-Friendly',
        'Warm and environmentally conscious tone',
        'Respond with warmth and environmental awareness. Use eco-friendly language and emphasize sustainability. Be encouraging and informative about green practices.',
        true
      ]
    );
    console.log('Added tone for:', business2.rows[0].name);

    const tone3 = await pool.query(
      `INSERT INTO business_tones 
      (business_id, name, description, tone_instructions, is_default) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business3.rows[0].id,
        'Caring Healthcare',
        'Compassionate and professional healthcare tone',
        'Respond with empathy and professionalism. Use clear, simple language for medical information. Be reassuring and supportive while maintaining medical accuracy.',
        true
      ]
    );
    console.log('Added tone for:', business3.rows[0].name);

    // Add alternative tones
    const altTone1 = await pool.query(
      `INSERT INTO business_tones 
      (business_id, name, description, tone_instructions, is_default) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business1.rows[0].id,
        'Casual Tech',
        'More relaxed and approachable tech tone',
        'Respond in a friendly, approachable manner. Use simple language to explain technical concepts. Be encouraging and patient with technical questions.',
        false
      ]
    );
    console.log('Added alternative tone for:', business1.rows[0].name);

    const altTone2 = await pool.query(
      `INSERT INTO business_tones 
      (business_id, name, description, tone_instructions, is_default) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        business2.rows[0].id,
        'Educational',
        'Informative and educational tone',
        'Focus on educating customers about sustainability. Provide detailed explanations about eco-friendly practices. Be informative and inspiring.',
        false
      ]
    );
    console.log('Added alternative tone for:', business2.rows[0].name);

    console.log('\n✅ Sample data added successfully!');
    console.log('\nSample businesses created:');
    console.log(`- ${business1.rows[0].name} (ID: ${business1.rows[0].id})`);
    console.log(`- ${business2.rows[0].name} (ID: ${business2.rows[0].id})`);
    console.log(`- ${business3.rows[0].name} (ID: ${business3.rows[0].id})`);
    console.log('\nYou can now test the multi-tenant functionality with these sample businesses.');

  } catch (error) {
    console.error('Error adding sample data:', error);
    throw error;
  }
};

const initSampleData = async () => {
  try {
    await addSampleData();
    console.log('Sample data initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Sample data initialization failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initSampleData();
}

module.exports = { addSampleData }; 