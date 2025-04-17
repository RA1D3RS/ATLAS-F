// backend/src/server.js
// Import required modules

/**
 * Application entry point - HTTP server setup
 */

const app = require('./app');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
const appConfig = require('./config/app');

// Get port from environment variables
const PORT = appConfig.port;

// Function to start the server
const startServer = async () => {
  try {
    // Test database connection before starting the server
    const isConnected = await testConnection();
    
    if (!isConnected) {
      logger.error('Failed to connect to the database. Server will not start.');
      process.exit(1);
    }
    
    // Start the HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${appConfig.environment} mode on port ${PORT}`);
      logger.info(`API available at: ${appConfig.urls.api}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please use a different port.`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();