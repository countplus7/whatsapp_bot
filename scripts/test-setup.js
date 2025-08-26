require('dotenv').config();
const pool = require('../config/database');
const OpenAIService = require('../services/openai');

async function testSetup() {
  console.log('Testing WhatsApp AI Bot Setup...\n');

  // Test 1: Environment Variables
  console.log('1. Checking Environment Variables...');
  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'WHATSAPP_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN',
    'OPENAI_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('   ❌ Missing environment variables:', missingVars.join(', '));
    console.log('   Please check your .env file');
  } else {
    console.log('   ✅ All required environment variables are set');
  }

  // Test 2: Database Connection
  console.log('\n2. Testing Database Connection...');
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('   ✅ Database connection successful');
    console.log(`   Current database time: ${result.rows[0].current_time}`);
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
  }

  // Test 3: Database Tables
  console.log('\n3. Checking Database Tables...');
  try {
    const tables = ['conversations', 'messages', 'media_files'];
    for (const table of tables) {
      const result = await pool.query(`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`, [table]);
      
      if (result.rows[0].exists) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' does not exist`);
      }
    }
  } catch (error) {
    console.log('   ❌ Error checking database tables:', error.message);
  }

  // Test 4: OpenAI API
  console.log('\n4. Testing OpenAI API...');
  try {
    const response = await OpenAIService.chatCompletion([
      { role: 'user', content: 'Hello, this is a test message.' }
    ]);
    console.log('   ✅ OpenAI API connection successful');
    console.log(`   Test response: ${response.substring(0, 50)}...`);
  } catch (error) {
    console.log('   ❌ OpenAI API connection failed:', error.message);
  }

  // Test 5: Upload Directories
  console.log('\n5. Checking Upload Directories...');
  const fs = require('fs-extra');
  const path = require('path');
  
  const uploadDirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'images'),
    path.join(__dirname, '..', 'uploads', 'audio'),
    path.join(__dirname, '..', 'uploads', 'documents')
  ];

  for (const dir of uploadDirs) {
    if (fs.existsSync(dir)) {
      console.log(`   ✅ Directory exists: ${path.relative(process.cwd(), dir)}`);
    } else {
      console.log(`   ❌ Directory missing: ${path.relative(process.cwd(), dir)}`);
    }
  }

  // Test 6: Port Availability
  console.log('\n6. Checking Port Availability...');
  const net = require('net');
  const port = process.env.PORT || 8000;
  
  const server = net.createServer();
  server.listen(port, () => {
    console.log(`   ✅ Port ${port} is available`);
    server.close();
  });
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`   ❌ Port ${port} is already in use`);
    } else {
      console.log(`   ❌ Error checking port ${port}:`, error.message);
    }
  });

  console.log('\nSetup test completed!');
  console.log('\nNext steps:');
  console.log('1. If any tests failed, fix the issues above');
  console.log('2. Run: npm run init-db (if database tables are missing)');
  console.log('3. Start the server: npm run dev');
  console.log('4. Configure your WhatsApp Business API webhook');
  console.log('5. Test the bot by sending a message to your WhatsApp number');

  process.exit(0);
}

// Run the test
testSetup().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 