# WhatsApp AI Chatbot

A comprehensive AI-powered WhatsApp chatbot built with Node.js, PostgreSQL, and OpenAI APIs. The bot supports text chat, image analysis with OCR, voice note transcription, and maintains complete chat history.

## Features

- **Text Chat**: Natural language conversations using GPT-4
- **Image Analysis**: OCR and image description using GPT-4 Vision
- **Voice Notes**: Speech-to-text conversion using OpenAI Whisper
- **Chat History**: Complete conversation storage in PostgreSQL
- **File Management**: Automatic upload and storage of images and audio files
- **Webhook Integration**: Real-time message processing via WhatsApp Business API

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- WhatsApp Business API account
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

   # WhatsApp Business Cloud API
   WHATSAPP_TOKEN=your_whatsapp_business_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Media Processing Configuration
   MAX_FILE_SIZE=10485760
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create user and database
   See PostgreSQL commands.
   
   # Initialize database tables
   npm run init-db
   ```

5. **Test the setup**
   ```bash
   npm run test-setup
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Optional: Set up media cleanup (recommended for production)**
   ```bash
   # Clean up old media files (older than 30 days)
   npm run cleanup
   ```

## WhatsApp Business API Setup

1. **Create a Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app or use existing one

2. **Set up WhatsApp Business API**
   - Add WhatsApp product to your app
   - Configure phone number
   - Get your access token and phone number ID

3. **Configure Webhook**
   - Set webhook URL: `https://your-domain.com/whatsapp/webhook`
   - Set verify token (same as in .env file)
   - Subscribe to messages events

## API Endpoints

### WhatsApp Webhook
- `GET /whatsapp/webhook` - Webhook verification
- `POST /whatsapp/webhook` - Receive messages

### Health Check
- `GET /health` - Server health status

## Usage Examples

*The WhatsApp AI chatbot automatically processes media files received through WhatsApp messages. No manual file uploads are needed.*

## File Structure

```
whatsapp_bot/
├── config/
│   └── database.js          # Database configuration
├── routes/
│   └── whatsapp.js          # WhatsApp webhook routes
├── services/
│   ├── database.js          # Database operations
│   ├── openai.js            # OpenAI API integration
│   └── whatsapp.js          # WhatsApp API integration
├── scripts/
│   └── init-database.js     # Database initialization
├── uploads/
│   ├── images/              # Uploaded images
│   └── audio/               # Uploaded audio files
├── server.js                # Main server file
├── package.json
├── env.example
└── README.md
```

## Database Schema

### Conversations Table
- `id` - Primary key
- `whatsapp_number` - User's WhatsApp number
- `conversation_id` - Unique conversation identifier
- `created_at` - Conversation creation timestamp
- `updated_at` - Last activity timestamp

### Messages Table
- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `message_id` - Unique message identifier
- `from_number` - Sender's number
- `to_number` - Recipient's number
- `message_type` - Type of message (text, image, audio)
- `content` - Message content
- `media_url` - WhatsApp media URL
- `local_file_path` - Local file path
- `timestamp` - Message timestamp
- `is_from_user` - Whether message is from user
- `ai_response` - AI-generated response

### Media Files Table
- `id` - Primary key
- `message_id` - Foreign key to messages
- `file_type` - Type of file (image, audio)
- `original_filename` - Original filename
- `local_file_path` - Local file path
- `file_size` - File size in bytes
- `mime_type` - File MIME type
- `created_at` - Upload timestamp

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | No (default: 5432) |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `WHATSAPP_TOKEN` | WhatsApp Business API token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Yes |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `MAX_FILE_SIZE` | Maximum media file size | No (default: 10MB) |

## Security Features

- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configuration
- Environment-based static file serving
- File size limits
- Input validation and sanitization

## Error Handling

The application includes comprehensive error handling:
- Database connection errors
- API rate limiting
- File upload errors
- Invalid message types
- Network timeouts

## Logging

All operations are logged to console with appropriate error levels:
- Info: Normal operations
- Error: Error conditions
- Debug: Detailed debugging information

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

2. **WhatsApp Webhook Not Working**
   - Verify webhook URL is accessible
   - Check verify token matches
   - Ensure SSL certificate is valid

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure proper model access

4. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure supported file types

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation 