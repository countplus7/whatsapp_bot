require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs-extra");

// Import routes
const whatsappRoutes = require("./routes/whatsapp");
const businessRoutes = require("./routes/business");

const app = express();
const PORT = process.env.PORT || 8000;

// Create media directories for WhatsApp messages
const uploadsDir = path.join(__dirname, "uploads");
const imagesDir = path.join(uploadsDir, "images");
const audioDir = path.join(uploadsDir, "audio");

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(imagesDir);
fs.ensureDirSync(audioDir);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for API server
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

const allowedOrigins = [
  "http://localhost:8080", // development
  "https://labstarlabs.com", // production
];

// CORS configuration for frontend integration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving for media files (for API access)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  const healthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    directories: {
      uploads: fs.existsSync(uploadsDir),
      images: fs.existsSync(imagesDir),
      audio: fs.existsSync(audioDir),
    },
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  };

  res.status(200).json(healthStatus);
});

// API routes
app.use("/", whatsappRoutes);
app.use("/api", businessRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Log error details in development
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp AI Bot server running on port ${PORT}`);
});

module.exports = app;
