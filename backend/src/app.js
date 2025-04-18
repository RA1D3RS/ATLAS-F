// backend/src/app.js 
// Main application file for the backend
// This file sets up the Express application, middleware, and routes.
/**
 * Main Express application setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const appConfig = require('./config/app');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const userRoutes = require('./routes/user.route');
const authRoutes = require('./routes/auth.routes');

// Create Express application
const app = express();

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), appConfig.upload.directory);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup access logs
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

// Apply middlewares
app.use(helmet()); // Security headers
app.use(cors(appConfig.cors)); // CORS configuration
app.use(morgan('combined', { stream: accessLogStream })); // HTTP request logging
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded bodies


// Static file serving for uploads
app.use('/uploads', express.static(uploadDir));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'Atlas-f API',
    version: '1.0.0',
    status: 'running'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/users', userRoutes); // User routes

// TODO: Uncomment these routes as they are implemented
// app.use('/api/users', require('./routes/user.routes'));
// app.use('/api/projects', require('./routes/project.routes'));
// etc.

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});
// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;