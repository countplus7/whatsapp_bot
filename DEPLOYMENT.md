# Deployment Guide

This guide covers deploying the WhatsApp AI Bot to production environments.

## Production Setup

### 1. Environment Configuration

Create a production `.env` file:

```env
# Production Configuration
NODE_ENV=production
PORT=8000

# Database Configuration (Use production database)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=whatsapp_bot_prod
DB_USER=your_production_user
DB_PASSWORD=your_secure_password

# WhatsApp Business Cloud API
WHATSAPP_TOKEN=your_production_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_production_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_secure_webhook_token

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 2. Database Setup

#### PostgreSQL Production Database

1. **Create Production Database**
   ```sql
   CREATE DATABASE whatsapp_bot_prod;
   CREATE USER whatsapp_bot_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE whatsapp_bot_prod TO whatsapp_bot_user;
   ```

2. **Initialize Tables**
   ```bash
   npm run init-db
   ```

#### Database Optimization

1. **Add Indexes for Performance**
   ```sql
   -- These are already created by init-database.js
   -- Additional indexes for specific queries
   CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
   CREATE INDEX IF NOT EXISTS idx_messages_timestamp_desc ON messages(timestamp DESC);
   ```

2. **Configure Connection Pool**
   ```javascript
   // In config/database.js, adjust for production
   const pool = new Pool({
     // ... existing config
     max: 20, // Adjust based on your load
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### 3. Server Deployment

#### Using PM2 (Recommended)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 Ecosystem File**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'whatsapp-bot',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 8000
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 8000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

3. **Start Application**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

#### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .

   RUN mkdir -p uploads/images uploads/audio

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "8000:8000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env
       volumes:
         - ./uploads:/app/uploads
       depends_on:
         - db
       restart: unless-stopped

     db:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: whatsapp_bot_prod
         POSTGRES_USER: whatsapp_bot_user
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose up -d
   ```

### 4. Reverse Proxy Setup

#### Using Nginx

1. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/whatsapp-bot
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # Increase upload size for media files
       client_max_body_size 10M;
   }
   ```

3. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### Using Apache

1. **Configure Virtual Host**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       
       ProxyPreserveHost On
       ProxyPass / http://localhost:8000/
       ProxyPassReverse / http://localhost:8000/
       
       # Increase upload size
       LimitRequestBody 10485760
   </VirtualHost>
   ```

### 5. SSL Certificate

#### Using Let's Encrypt

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### 6. WhatsApp Webhook Configuration

1. **Set Webhook URL**
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```

2. **Verify Token**
   - Use the same token as in your `.env` file
   - Make it secure and unique

3. **Subscribe to Events**
   - messages
   - message_deliveries
   - message_reads

### 7. Monitoring and Logging

#### Application Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs whatsapp-bot
   ```

2. **Health Check Endpoint**
   ```bash
   curl https://your-domain.com/health
   ```

#### Database Monitoring

1. **Enable PostgreSQL Logging**
   ```sql
   ALTER SYSTEM SET log_statement = 'all';
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   ```

2. **Monitor Slow Queries**
   ```sql
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

### 8. Backup Strategy

#### Database Backups

1. **Automated Backups**
   ```bash
   # /etc/cron.daily/backup-whatsapp-bot
   #!/bin/bash
   BACKUP_DIR="/backups/whatsapp-bot"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   mkdir -p $BACKUP_DIR
   
   # Database backup
   pg_dump whatsapp_bot_prod > $BACKUP_DIR/db_backup_$DATE.sql
   
   # File backup
   tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz uploads/
   
   # Keep only last 7 days
   find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
   find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
   ```

#### File Backups

1. **Upload Directory Backup**
   ```bash
   rsync -av uploads/ /backup/uploads/
   ```

### 9. Security Considerations

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Rate Limiting**
   - Already configured in the application
   - Consider additional Nginx rate limiting

3. **File Upload Security**
   - File type validation (already implemented)
   - Virus scanning for uploaded files
   - Regular cleanup of old files

### 10. Performance Optimization

1. **Node.js Optimization**
   ```bash
   # Set Node.js flags
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

2. **Database Optimization**
   ```sql
   -- Regular maintenance
   VACUUM ANALYZE;
   REINDEX DATABASE whatsapp_bot_prod;
   ```

3. **Caching**
   - Consider Redis for session storage
   - Implement response caching for static content

### 11. Troubleshooting

#### Common Issues

1. **Webhook Not Receiving Messages**
   - Check SSL certificate
   - Verify webhook URL accessibility
   - Check server logs

2. **Database Connection Issues**
   - Verify connection pool settings
   - Check database server status
   - Monitor connection limits

3. **File Upload Failures**
   - Check disk space
   - Verify directory permissions
   - Check file size limits

#### Log Analysis

```bash
# Application logs
pm2 logs whatsapp-bot --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 12. Scaling Considerations

1. **Horizontal Scaling**
   - Use load balancer
   - Implement session sharing
   - Database read replicas

2. **Vertical Scaling**
   - Increase server resources
   - Optimize database queries
   - Implement caching layers

3. **CDN for Media Files**
   - Use CDN for uploaded images/audio
   - Implement file compression
   - Set appropriate cache headers 