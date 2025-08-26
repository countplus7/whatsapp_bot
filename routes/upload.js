const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const DatabaseService = require('../services/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio/';
    } else {
      uploadPath += 'documents/';
    }
    
    // Ensure directory exists before saving file
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, audio, and common document types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/mp4',
    'application/pdf',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload single file
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadDate: new Date()
    };

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// Upload multiple files
router.post('/files', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const fileInfos = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date()
    }));

    res.json({
      success: true,
      data: fileInfos
    });
  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// Get uploaded files list
router.get('/files', async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const files = [];

    if (type === 'images') {
      const imagesDir = path.join(uploadsDir, 'images');
      // Ensure directory exists
      await fs.ensureDir(imagesDir);
      const imageFiles = await fs.readdir(imagesDir);
      for (const file of imageFiles.slice(offset, offset + parseInt(limit))) {
        const filePath = path.join(imagesDir, file);
        const stats = await fs.stat(filePath);
        files.push({
          name: file,
          path: filePath,
          size: stats.size,
          type: 'image',
          uploadDate: stats.mtime
        });
      }
    } else if (type === 'audio') {
      const audioDir = path.join(uploadsDir, 'audio');
      // Ensure directory exists
      await fs.ensureDir(audioDir);
      const audioFiles = await fs.readdir(audioDir);
      for (const file of audioFiles.slice(offset, offset + parseInt(limit))) {
        const filePath = path.join(audioDir, file);
        const stats = await fs.stat(filePath);
        files.push({
          name: file,
          path: filePath,
          size: stats.size,
          type: 'audio',
          uploadDate: stats.mtime
        });
      }
    } else {
      // Get all files
      const imagesDir = path.join(uploadsDir, 'images');
      const audioDir = path.join(uploadsDir, 'audio');
      const documentsDir = path.join(uploadsDir, 'documents');
      
      // Ensure all directories exist
      await fs.ensureDir(imagesDir);
      await fs.ensureDir(audioDir);
      await fs.ensureDir(documentsDir);
      
      const imageFiles = await fs.readdir(imagesDir);
      for (const file of imageFiles) {
        const filePath = path.join(imagesDir, file);
        const stats = await fs.stat(filePath);
        files.push({
          name: file,
          path: filePath,
          size: stats.size,
          type: 'image',
          uploadDate: stats.mtime
        });
      }
      
      const audioFiles = await fs.readdir(audioDir);
      for (const file of audioFiles) {
        const filePath = path.join(audioDir, file);
        const stats = await fs.stat(filePath);
        files.push({
          name: file,
          path: filePath,
          size: stats.size,
          type: 'audio',
          uploadDate: stats.mtime
        });
      }
      
      const documentFiles = await fs.readdir(documentsDir);
      for (const file of documentFiles) {
        const filePath = path.join(documentsDir, file);
        const stats = await fs.stat(filePath);
        files.push({
          name: file,
          path: filePath,
          size: stats.size,
          type: 'document',
          uploadDate: stats.mtime
        });
      }
      
      // Sort by upload date and apply pagination
      files.sort((a, b) => b.uploadDate - a.uploadDate);
      files.splice(offset, parseInt(limit));
    }

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error getting files list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files list'
    });
  }
});

// Delete uploaded file
router.delete('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.query;
    
    let filePath;
    if (type === 'images') {
      filePath = path.join(__dirname, '..', 'uploads', 'images', filename);
    } else if (type === 'audio') {
      filePath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    } else if (type === 'documents') {
      filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
    } else {
      // Try to find the file in any directory
      const imagesPath = path.join(__dirname, '..', 'uploads', 'images', filename);
      const audioPath = path.join(__dirname, '..', 'uploads', 'audio', filename);
      const documentsPath = path.join(__dirname, '..', 'uploads', 'documents', filename);
      
      if (await fs.pathExists(imagesPath)) {
        filePath = imagesPath;
      } else if (await fs.pathExists(audioPath)) {
        filePath = audioPath;
      } else if (await fs.pathExists(documentsPath)) {
        filePath = documentsPath;
      } else {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
    }

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// Get file info
router.get('/files/:filename/info', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.query;
    
    let filePath;
    if (type === 'images') {
      filePath = path.join(__dirname, '..', 'uploads', 'images', filename);
    } else if (type === 'audio') {
      filePath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    } else if (type === 'documents') {
      filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
    } else {
      // Try to find the file in any directory
      const imagesPath = path.join(__dirname, '..', 'uploads', 'images', filename);
      const audioPath = path.join(__dirname, '..', 'uploads', 'audio', filename);
      const documentsPath = path.join(__dirname, '..', 'uploads', 'documents', filename);
      
      if (await fs.pathExists(imagesPath)) {
        filePath = imagesPath;
      } else if (await fs.pathExists(audioPath)) {
        filePath = audioPath;
      } else if (await fs.pathExists(documentsPath)) {
        filePath = documentsPath;
      } else {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
    }

    if (await fs.pathExists(filePath)) {
      const stats = await fs.stat(filePath);
             const fileInfo = {
         name: filename,
         path: filePath,
         size: stats.size,
         type: type || (filePath.includes('images') ? 'image' : filePath.includes('audio') ? 'audio' : 'document'),
         uploadDate: stats.mtime,
         lastModified: stats.mtime
       };

      res.json({
        success: true,
        data: fileInfo
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file info'
    });
  }
});

module.exports = router; 