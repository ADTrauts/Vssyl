import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from './utils/logger';
import { AnalyticsWebSocketService } from './services/analyticsWebSocketService';

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server });
  const analyticsService = AnalyticsWebSocketService.getInstance();

  wss.on('connection', (ws) => {
    logger.info('New WebSocket connection established');
    analyticsService.handleConnection(ws);
  });

  wss.on('error', (error) => {
    logger.error('WebSocket server error:', error);
  });

  // Handle server shutdown
  process.on('SIGTERM', () => {
    logger.info('Shutting down WebSocket server...');
    analyticsService.cleanup();
    wss.close(() => {
      logger.info('WebSocket server closed');
    });
  });
} 