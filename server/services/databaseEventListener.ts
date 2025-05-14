import { PrismaClient, Thread, ThreadMessage, User, ThreadReaction } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsCoordinator } from './analyticsCoordinator';

export class DatabaseEventListener {
  private static instance: DatabaseEventListener;
  private prisma: PrismaClient;
  private analyticsCoordinator: AnalyticsCoordinator;

  private constructor() {
    this.prisma = new PrismaClient();
    this.analyticsCoordinator = AnalyticsCoordinator.getInstance();
    this.setupMiddleware();
  }

  public static getInstance(): DatabaseEventListener {
    if (!DatabaseEventListener.instance) {
      DatabaseEventListener.instance = new DatabaseEventListener();
    }
    return DatabaseEventListener.instance;
  }

  // Replaces unsupported $on model-level events with Prisma middleware
  private setupMiddleware(): void {
    this.prisma.$use(async (params, next) => {
      const result = await next(params);
      try {
        // Thread events
        if (params.model === 'Thread') {
          if (params.action === 'create') {
            await this.analyticsCoordinator.handleThreadCreated(result as Thread);
            logger.info(`Thread created event handled: ${(result as Thread).id}`);
          } else if (params.action === 'update') {
            await this.analyticsCoordinator.handleThreadUpdated(result as Thread);
            logger.info(`Thread updated event handled: ${(result as Thread).id}`);
          } else if (params.action === 'delete') {
            await this.analyticsCoordinator.handleThreadDeleted(result as Thread);
            logger.info(`Thread deleted event handled: ${(result as Thread).id}`);
          }
        }
        // ThreadMessage events
        else if (params.model === 'ThreadMessage') {
          if (params.action === 'create') {
            await this.analyticsCoordinator.handleMessageCreated(result as ThreadMessage);
            logger.info(`Message created event handled: ${(result as ThreadMessage).id}`);
          } else if (params.action === 'update') {
            await this.analyticsCoordinator.handleMessageUpdated(result as ThreadMessage);
            logger.info(`Message updated event handled: ${(result as ThreadMessage).id}`);
          } else if (params.action === 'delete') {
            await this.analyticsCoordinator.handleMessageDeleted(result as ThreadMessage);
            logger.info(`Message deleted event handled: ${(result as ThreadMessage).id}`);
          }
        }
        // User events
        else if (params.model === 'User') {
          if (params.action === 'update') {
            await this.analyticsCoordinator.handleUserUpdated(result as User);
            logger.info(`User updated event handled: ${(result as User).id}`);
          }
        }
        // ThreadReaction events
        else if (params.model === 'ThreadReaction') {
          if (params.action === 'create') {
            await this.analyticsCoordinator.handleReactionCreated(result as ThreadReaction);
            logger.info(`Reaction created event handled: ${(result as ThreadReaction).id}`);
          } else if (params.action === 'delete') {
            await this.analyticsCoordinator.handleReactionDeleted(result as ThreadReaction);
            logger.info(`Reaction deleted event handled: ${(result as ThreadReaction).id}`);
          }
        }
      } catch (error) {
        logger.error('Error handling analytics event:', error);
      }
      return result;
    });
  }

  public async start(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database event listener started successfully');
    } catch (error) {
      logger.error('Error starting database event listener:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database event listener stopped successfully');
    } catch (error) {
      logger.error('Error stopping database event listener:', error);
      throw error;
    }
  }
} 