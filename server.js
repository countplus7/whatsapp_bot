require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

// Import routes
const whatsappRoutes = require('./routes/whatsapp');
const businessRoutes = require('./routes/business');

const app = express();
const PORT = process.env.PORT || 8000;

// Create media directories for WhatsApp messages
const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const audioDir = path.join(uploadsDir, 'audio');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(imagesDir);
fs.ensureDirSync(audioDir);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for media files (optional, for debugging)
if (process.env.NODE_ENV === 'development') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  const fs = require('fs-extra');
  const path = require('path');
  
  // Check media directories
  const uploadsDir = path.join(__dirname, 'uploads');
  const imagesDir = path.join(uploadsDir, 'images');
  const audioDir = path.join(uploadsDir, 'audio');
  
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    directories: {
      uploads: fs.existsSync(uploadsDir),
      images: fs.existsSync(imagesDir),
      audio: fs.existsSync(audioDir)
    },
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthStatus);
});

// API routes
app.use('/', whatsappRoutes);
app.use('/api', businessRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp AI Bot server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 