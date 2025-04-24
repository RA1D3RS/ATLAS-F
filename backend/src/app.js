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
const adminRoutes = require('./routes/admin.routes');

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

// Setup API versioning
app.use('/api/v1', (req, res, next) => {
  // You can add version-specific logic here if needed
  next();
});
// Setup API documentation
app.use('/api/docs', express.static(path.join(__dirname, 'docs')));

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
app.use('/api/users', require('./routes/user.routes')); // User routes
app.use('/api/projects', require('./routes/project.routes')); // Utilisation des routes de projet
app.use('/api/investors', require('./routes/investor.routes')); // Investor routes
app.use('/api/companies', require('./routes/company.routes')); // Company routes
app.use('/api/notifications', require('./routes/notification.routes')); // Notification routes
app.use('/api/transactions', require('./routes/transaction.routes')); // Transaction routes
app.use('/api/faq', require('./routes/faq.routes')); // FAQ routes
app.use('/api/admin', adminRoutes); // Admin routes


// TODO: Uncomment these routes as they are implemented
//
// app.use('/api/faq-categories', require('./routes/faqCategory.routes')); // FAQ Category routes
// app.use('/api/faq-questions', require('./routes/faqQuestion.routes')); // FAQ Question routes
// app.use('/api/faq-answers', require('./routes/faqAnswer.routes')); // FAQ Answer routes
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