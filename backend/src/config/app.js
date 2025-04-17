// backend/src/config/app.js

/**
 * Application configuration settings
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  
  // CORS settings
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.APP_URL] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '1h'
  },
  
  // File upload settings
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) // 5MB default
  },
  
  // Application URLs
  urls: {
    app: process.env.APP_URL || 'http://localhost:3001',
    api: process.env.API_URL || 'http://localhost:3000'
  },
  
  // Email settings
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@atlas-f.ma'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
};