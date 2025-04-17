// backend/src/middleware/error.middleware.js
// Error handling middleware for Express.js

/**
 * Global error handling middleware
 */

const logger = require('../utils/logger');
const { formatError } = require('../utils/errors');

/**
 * 404 Not Found middleware for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  if (err.statusCode === 500) {
    logger.error(`${err.message}`, { 
      error: err, 
      path: req.path, 
      method: req.method,
      query: req.query,
      body: req.body,
      stack: err.stack
    });
  } else {
    logger.warn(`${err.message}`, { 
      statusCode: err.statusCode, 
      path: req.path, 
      method: req.method 
    });
  }

  // Format and send error response
  const formattedError = formatError(err);
  res.status(formattedError.statusCode).json(formattedError);
};

module.exports = {
  notFoundHandler,
  errorHandler
};