import express from 'express';
import http from 'http';
import { setupWebSocket } from './setupWebSocket';
import { logger } from './utils/logger';
import { AnalyticsCoordinator } from './services/analyticsCoordinator';
import { DatabaseEventListener } from './services/databaseEventListener';

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
setupWebSocket(server);

// Initialize analytics coordinator
const analyticsCoordinator = AnalyticsCoordinator.getInstance();
analyticsCoordinator.initialize().catch((error) => {
  logger.error('Failed to initialize analytics coordinator:', error);
  process.exit(1);
});

// Initialize database event listener
const databaseEventListener = DatabaseEventListener.getInstance();
databaseEventListener.start().catch((error) => {
  logger.error('Failed to start database event listener:', error);
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  
  try {
    await analyticsCoordinator.cleanup();
    await databaseEventListener.stop();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}); 