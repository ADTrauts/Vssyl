import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import redis from '../middleware/cache';

interface SocketData {
  userId?: string;
  threadId?: string;
  conversationId?: string;
}

interface ClientToServerEvents {
  authenticate: (token: string) => void;
  'subscribe:thread': (threadId: string) => void;
  'unsubscribe:thread': (threadId: string) => void;
  'subscribe:user': (userId: string) => void;
  'unsubscribe:user': (userId: string) => void;
}

interface ServerToClientEvents {
  error: (error: { message: string }) => void;
  'thread:activity': (activity: ThreadActivity) => void;
  'user:activity': (activity: UserActivity) => void;
  'recommendations:update': (recommendations: Recommendation[]) => void;
  'cache:cleared': (data: { key: string }) => void;
}

interface ThreadActivity {
  id: string;
  type: string;
  threadId: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

interface UserActivity {
  id: string;
  type: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

interface Recommendation {
  id: string;
  type: string;
  userId: string;
  score: number;
  data: Record<string, unknown>;
}

export class WebSocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private static instance: WebSocketService;
  private readonly presenceTimeout = 30000; // 30 seconds

  private constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.setupEventHandlers();
  }

  public static getInstance(io?: Server<ClientToServerEvents, ServerToClientEvents>): WebSocketService {
    if (!WebSocketService.instance && io) {
      WebSocketService.instance = new WebSocketService(io);
    }
    return WebSocketService.instance;
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData>) => {
      logger.info(`Client connected: ${socket.id}`);

      // Set up presence timeout
      const presenceTimeout = setTimeout(() => {
        if (!socket.data.userId) {
          socket.disconnect();
        }
      }, this.presenceTimeout);

      // Handle authentication
      socket.on('authenticate', (token: string) => {
        try {
          // TODO: Implement token verification
          const userId = 'verified-user-id'; // Replace with actual verification
          socket.data.userId = userId;
          clearTimeout(presenceTimeout);
          logger.info(`Client authenticated: ${socket.id} (User: ${userId})`);
        } catch (error) {
          logger.error('Authentication error:', error);
          socket.disconnect();
        }
      });

      // Handle thread activity subscriptions
      socket.on('subscribe:thread', (threadId: string) => {
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        socket.join(`thread:${threadId}`);
        socket.data.threadId = threadId;
        logger.info(`Client ${socket.id} subscribed to thread ${threadId}`);
      });

      // Handle thread activity unsubscriptions
      socket.on('unsubscribe:thread', (threadId: string) => {
        socket.leave(`thread:${threadId}`);
        if (socket.data.threadId === threadId) {
          delete socket.data.threadId;
        }
        logger.info(`Client ${socket.id} unsubscribed from thread ${threadId}`);
      });

      // Handle user activity subscriptions
      socket.on('subscribe:user', (userId: string) => {
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        socket.join(`user:${userId}`);
        logger.info(`Client ${socket.id} subscribed to user ${userId}`);
      });

      // Handle user activity unsubscriptions
      socket.on('unsubscribe:user', (userId: string) => {
        socket.leave(`user:${userId}`);
        logger.info(`Client ${socket.id} unsubscribed from user ${userId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        clearTimeout(presenceTimeout);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Emit thread activity updates
  public emitThreadActivity(threadId: string, activity: ThreadActivity): void {
    this.io.to(`thread:${threadId}`).emit('thread:activity', activity);
    logger.info(`Emitted thread activity for thread ${threadId}`);
  }

  // Emit user activity updates
  public emitUserActivity(userId: string, activity: UserActivity): void {
    this.io.to(`user:${userId}`).emit('user:activity', activity);
    logger.info(`Emitted user activity for user ${userId}`);
  }

  // Emit recommendation updates
  public emitRecommendations(userId: string, recommendations: Recommendation[]): void {
    this.io.to(`user:${userId}`).emit('recommendations:update', recommendations);
    logger.info(`Emitted recommendations for user ${userId}`);
  }

  // Clear cache and notify clients
  public async clearCacheAndNotify(key: string): Promise<void> {
    try {
      await redis.del(key);
      const [type, id] = key.split(':');
      if (type === 'thread') {
        this.io.to(`thread:${id}`).emit('cache:cleared', { key });
      } else if (type === 'user') {
        this.io.to(`user:${id}`).emit('cache:cleared', { key });
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }
} 