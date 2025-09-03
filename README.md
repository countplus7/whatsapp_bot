# WhatsApp AI Chatbot - Multi-Tenant Edition

A comprehensive AI-powered WhatsApp chatbot built with Node.js, PostgreSQL, and OpenAI APIs. The bot supports **multi-tenant architecture** where each company can have its own WhatsApp number and AI personality. The bot supports text chat, image analysis with OCR, voice note transcription, and maintains complete chat history per business.

## Features

- **Multi-Tenant Architecture**: Each company has its own WhatsApp number and configuration
- **Business Management**: Add, edit, and delete businesses through a web interface
- **WhatsApp Configuration**: Store WhatsApp Business API credentials per business in database
- **Custom AI Tones**: Each business can have multiple AI response tones (professional, casual, friendly, etc.)
- **Text Chat**: Natural language conversations using GPT-4 with business-specific tone
- **Image Analysis**: OCR and image description using GPT-4 Vision
- **Voice Notes**: Speech-to-text conversion using OpenAI Whisper
- **Chat History**: Complete conversation storage in PostgreSQL per business
- **File Management**: Automatic upload and storage of images and audio files
- **Webhook Integration**: Real-time message processing via WhatsApp Business API
- **Web Interface**: Simple frontend to manage businesses, configurations, and tones

## Multi-Tenant Features

### Business Management
- Create multiple businesses/companies
- Each business can have its own WhatsApp number
- Business status management (active/inactive)

### WhatsApp Configuration
- Store WhatsApp Business API credentials per business
- Phone Number ID, Access Token, Verify Token, and Webhook URL
- No need to store sensitive data in environment files

### Business Tones
- Define custom AI response personalities for each business
- Multiple tones per business (e.g., Professional, Casual, Friendly)
- Set default tone for automatic responses
- Tone instructions guide AI behavior (e.g., "Be professional and formal", "Use casual language")

### Data Isolation
- All conversations, messages, and media files are isolated by business
- Each business has its own chat history and context
- Secure multi-tenant data architecture

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- WhatsApp Business API account(s)
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=8000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Media Processing Configuration
   MAX_FILE_SIZE=10485760
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create user and database
   See PostgreSQL commands.
   
   # Initialize database tables (includes multi-tenant tables)
   npm run init-db
   ```

5. **Add sample data (optional but recommended for testing)**
   ```bash
   npm run add-sample-data
   ```

6. **Test the setup**
   ```bash
   npm run test-setup
   ```

7. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

8. **Access the web interface**
   - Open your browser and go to `http://localhost:8000`
   - Use the web interface to manage businesses, WhatsApp configs, and tones

## Database Schema

The multi-tenant system includes these new tables:

- **businesses**: Company information and status
- **whatsapp_configs**: WhatsApp API configuration per business
- **business_tones**: AI response tones and instructions per business
- **conversations**: Updated to include business_id
- **messages**: Updated to include business_id
- **media_files**: Updated to include business_id

## Usage

### 1. Business Setup
1. Access the web interface at `http://localhost:8000`
2. Go to the "Businesses" tab
3. Click "Add Business" and enter company details
4. Set business status to "active"

### 2. WhatsApp Configuration
1. Go to the "WhatsApp Configs" tab
2. Select a business from the dropdown
3. Enter WhatsApp Business API credentials:
   - Phone Number ID
   - Access Token
   - Verify Token (optional)
   - Webhook URL (optional)

### 3. Business Tones
1. Go to the "Business Tones" tab
2. Select a business from the dropdown
3. Create tone with:
   - Name (e.g., "Professional", "Casual")
   - Description
   - Tone Instructions (e.g., "Respond in a professional manner")
   - Set as default (optional)

### 4. Webhook Setup
For each business, set up webhook in Meta Developer Console:
- Webhook URL: `https://yourdomain.com/webhook`
- Verify Token: Use the token from your WhatsApp config
- Subscribe to messages and message_deliveries

## API Endpoints

### Business Management
- `GET /api/businesses` - List all businesses
- `POST /api/businesses` - Create new business
- `GET /api/businesses/:id` - Get business details
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

### WhatsApp Configuration
- `POST /api/businesses/:businessId/whatsapp-config` - Create WhatsApp config
- `PUT /api/whatsapp-config/:id` - Update WhatsApp config
- `DELETE /api/whatsapp-config/:id` - Delete WhatsApp config

### Business Tones
- `GET /api/businesses/:businessId/tones` - List business tones
- `POST /api/businesses/:businessId/tones` - Create tone
- `PUT /api/tones/:id` - Update tone
- `DELETE /api/tones/:id` - Delete tone

## Sample Data

The system includes sample data for testing:
- 3 sample businesses (TechCorp, Green Earth, HealthCare)
- WhatsApp configurations for each business
- Custom tones for each business (Professional, Eco-Friendly, Caring)

Run `npm run add-sample-data` to populate the database with sample data.

## WhatsApp Business API Setup

1. **Create a Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use existing one

2. **Set up WhatsApp Business API**
   - Add WhatsApp product to your app
   - Configure webhook endpoints
   - Generate access tokens

3. **For Multi-Tenant Setup**
   - Each business needs its own WhatsApp Business Account
   - Configure webhook for each business
   - Store credentials in the database (not in environment files)

## Security Features

- **Multi-tenant data isolation**: Each business's data is completely separated
- **Database-level security**: Foreign key constraints ensure data integrity
- **No sensitive data in code**: All WhatsApp credentials stored in database
- **Input validation**: All API endpoints validate input data
- **Rate limiting**: Built-in rate limiting for API endpoints

## Production Considerations

- **Database backups**: Regular backups of business data
- **SSL/TLS**: Use HTTPS in production
- **Environment variables**: Secure database credentials
- **Monitoring**: Monitor webhook delivery and API usage
- **Scaling**: Consider database connection pooling for multiple businesses

## Troubleshooting

### Common Issues

1. **Webhook verification fails**
   - Check verify token in WhatsApp config
   - Ensure webhook URL is accessible

2. **Messages not processed**
   - Verify WhatsApp config is active
   - Check business status is "active"
   - Verify OpenAI API key is valid

3. **Database connection issues**
   - Check PostgreSQL connection settings
   - Ensure database tables are created
   - Run `npm run init-db` to recreate tables

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 