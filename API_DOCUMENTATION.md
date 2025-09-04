# WhatsApp AI Bot API Documentation

## Overview

This API provides a multi-tenant WhatsApp AI Bot service with business management capabilities. Each business can have its own WhatsApp configuration and AI response tones.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API doesn't require authentication. In production, you should implement proper authentication mechanisms.

## CORS Configuration

The API is configured to accept requests from:
- Development: `http://localhost:3000` (configurable via `FRONTEND_URL` environment variable)
- Production: Configure via environment variables

## API Endpoints

### Health Check

#### GET /health
Check API health and status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-03T20:00:00.000Z",
  "uptime": 1234.567,
  "directories": {
    "uploads": true,
    "images": true,
    "audio": true
  },
  "environment": "development",
  "version": "1.0.0"
}
```

### Business Management

#### GET /api/businesses
Get all businesses.

**Response:**
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

#### GET /api/businesses/:id
Get a specific business with its configuration and tones.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Your Business",
    "description": "Your business description",
    "status": "active",
    "whatsapp_config": {
      "id": 1,
      "phone_number_id": "123456789",
      "access_token": "token_here",
      "verify_token": "verify_token",
      "webhook_url": "https://example.com/webhook",
      "status": "active"
    },
    "tones": [
      {
        "id": 1,
        "name": "Professional",
        "description": "Professional and formal tone",
        "tone_instructions": "Respond in a professional and formal manner",
        "is_default": true
      }
    ]
  }
}
```

#### POST /api/businesses
Create a new business.

**Request Body:**
```json
{
  "name": "New Business",
  "description": "A new business description",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "New Business",
    "description": "A new business description",
    "status": "active",
    "created_at": "2025-09-03T20:00:00.000Z",
    "updated_at": "2025-09-03T20:00:00.000Z"
  },
  "message": "Business created successfully"
}
```

#### PUT /api/businesses/:id
Update an existing business.

**Request Body:**
```json
{
  "name": "Updated Business Name",
  "description": "Updated description",
  "status": "inactive"
}
```

#### DELETE /api/businesses/:id
Delete a business.

### WhatsApp Configuration

#### GET /api/businesses/:businessId/whatsapp-config
Get WhatsApp configuration for a specific business.

#### POST /api/businesses/:businessId/whatsapp-config
Create WhatsApp configuration for a business.

**Request Body:**
```json
{
  "phone_number_id": "123456789",
  "access_token": "your_access_token",
  "verify_token": "your_verify_token",
  "webhook_url": "https://yourdomain.com/webhook",
  "status": "active"
}
```

#### PUT /api/whatsapp-config/:id
Update WhatsApp configuration.

#### DELETE /api/whatsapp-config/:id
Delete WhatsApp configuration.

### Business Tones

#### GET /api/businesses/:businessId/tones
Get all tones for a specific business.

#### POST /api/businesses/:businessId/tones
Create a new tone for a business.

**Request Body:**
```json
{
  "name": "Friendly",
  "description": "A friendly and casual tone",
  "tone_instructions": "Respond in a friendly, casual manner with emojis",
  "is_default": false
}
```

#### PUT /api/tones/:id
Update an existing tone.

#### DELETE /api/tones/:id
Delete a tone.

### WhatsApp Webhook

#### GET /webhook
Webhook verification endpoint for WhatsApp Business API.

**Query Parameters:**
- `hub.mode`: Verification mode
- `hub.verify_token`: Verification token
- `hub.challenge`: Challenge string

#### POST /webhook
Receive incoming WhatsApp messages.

**Note:** This endpoint is called by WhatsApp, not by your frontend.

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **Window:** 15 minutes
- **Max Requests:** 100 per IP address
- **Response:** 429 Too Many Requests with error message

## Media Files

Media files are accessible via:
```
/uploads/images/{filename}
/uploads/audio/{filename}
```

## Frontend Integration Example

### JavaScript/TypeScript

```javascript
const API_BASE = 'http://localhost:8000/api';

// Get all businesses
const getBusinesses = async () => {
  try {
    const response = await fetch(`${API_BASE}/businesses`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
};

// Create a new business
const createBusiness = async (businessData) => {
  try {
    const response = await fetch(`${API_BASE}/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
};

// Update business
const updateBusiness = async (id, businessData) => {
  try {
    const response = await fetch(`${API_BASE}/businesses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error updating business:', error);
    throw error;
  }
};

// Delete business
const deleteBusiness = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/businesses/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.message;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error deleting business:', error);
    throw error;
  }
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const data = await getBusinesses();
      setBusinesses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  return { businesses, loading, error, refetch: fetchBusinesses };
};
```

## Environment Variables

Make sure your backend has these environment variables set:

```bash
# Server Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_bot
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## Testing the API

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Test API endpoints:**
   ```bash
   curl http://localhost:8000/api/businesses
   ```

## Support

For API support or questions, check the backend logs or refer to the main README.md file. 