// backend/src/utils/errors.js
// Error handling utility for the application

/**
 * Custom error classes and error handling utilities
 */

/**
 * Base error class for custom API errors
 */
class APIError extends Error {
    constructor(message, statusCode, errors = []) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Error for bad client requests (400)
   */
  class BadRequestError extends APIError {
    constructor(message = 'Bad Request', errors = []) {
      super(message, 400, errors);
    }
  }
  
  /**
   * Error for unauthorized access (401)
   */
  class UnauthorizedError extends APIError {
    constructor(message = 'Unauthorized', errors = []) {
      super(message, 401, errors);
    }
  }
  
  /**
   * Error for forbidden actions (403)
   */
  class ForbiddenError extends APIError {
    constructor(message = 'Forbidden', errors = []) {
      super(message, 403, errors);
    }
  }
  
  /**
   * Error for not found resources (404)
   */
  class NotFoundError extends APIError {
    constructor(message = 'Resource not found', errors = []) {
      super(message, 404, errors);
    }
  }
  
  /**
   * Error for validation issues (422)
   */
  class ValidationError extends APIError {
    constructor(message = 'Validation Error', errors = []) {
      super(message, 422, errors);
    }
  }
  
  /**
   * Format error response for consistent API error handling
   * @param {Error} err - Error object
   * @returns {Object} Formatted error response
   */
  const formatError = (err) => {
    // Default error object
    const error = {
      status: 'error',
      message: err.message || 'Internal Server Error',
      statusCode: err.statusCode || 500
    };
  
    // Add validation errors if any
    if (err.errors && err.errors.length > 0) {
      error.errors = err.errors;
    }
  
    // Add stack trace in development environment
    if (process.env.NODE_ENV === 'development') {
      error.stack = err.stack;
    }
  
    return error;
  };
  
  module.exports = {
    APIError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    formatError
  };