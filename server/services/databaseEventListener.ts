import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsCoordinator } from './analyticsCoordinator';

export class DatabaseEventListener {
  private static instance: DatabaseEventListener;
  private prisma: PrismaClient;
  private analyticsCoordinator: AnalyticsCoordinator;

  private constructor() {
    this.prisma = new PrismaClient();
    this.analyticsCoordinator = AnalyticsCoordinator.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): DatabaseEventListener {
    if (!DatabaseEventListener.instance) {
      DatabaseEventListener.instance = new DatabaseEventListener();
    }
    return DatabaseEventListener.instance;
  }

  private setupEventListeners(): void {
    // Thread events
    this.prisma.$on('thread', {
      create: async (event) => {
        try {
          const thread = event.target;
          await this.analyticsCoordinator.handleThreadCreated(thread);
          logger.info(`Thread created event handled: ${thread.id}`);
        } catch (error) {
          logger.error('Error handling thread created event:', error);
        }
      },
      update: async (event) => {
        try {
          const thread = event.target;
          await this.analyticsCoordinator.handleThreadUpdated(thread);
          logger.info(`Thread updated event handled: ${thread.id}`);
        } catch (error) {
          logger.error('Error handling thread updated event:', error);
        }
      },
      delete: async (event) => {
        try {
          const thread = event.target;
          await this.analyticsCoordinator.handleThreadDeleted(thread);
          logger.info(`Thread deleted event handled: ${thread.id}`);
        } catch (error) {
          logger.error('Error handling thread deleted event:', error);
        }
      }
    });

    // Message events
    this.prisma.$on('threadMessage', {
      create: async (event) => {
        try {
          const message = event.target;
          await this.analyticsCoordinator.handleMessageCreated(message);
          logger.info(`Message created event handled: ${message.id}`);
        } catch (error) {
          logger.error('Error handling message created event:', error);
        }
      },
      update: async (event) => {
        try {
          const message = event.target;
          await this.analyticsCoordinator.handleMessageUpdated(message);
          logger.info(`Message updated event handled: ${message.id}`);
        } catch (error) {
          logger.error('Error handling message updated event:', error);
        }
      },
      delete: async (event) => {
        try {
          const message = event.target;
          await this.analyticsCoordinator.handleMessageDeleted(message);
          logger.info(`Message deleted event handled: ${message.id}`);
        } catch (error) {
          logger.error('Error handling message deleted event:', error);
        }
      }
    });

    // User events
    this.prisma.$on('user', {
      update: async (event) => {
        try {
          const user = event.target;
          await this.analyticsCoordinator.handleUserUpdated(user);
          logger.info(`User updated event handled: ${user.id}`);
        } catch (error) {
          logger.error('Error handling user updated event:', error);
        }
      }
    });

    // Reaction events
    this.prisma.$on('threadReaction', {
      create: async (event) => {
        try {
          const reaction = event.target;
          await this.analyticsCoordinator.handleReactionCreated(reaction);
          logger.info(`Reaction created event handled: ${reaction.id}`);
        } catch (error) {
          logger.error('Error handling reaction created event:', error);
        }
      },
      delete: async (event) => {
        try {
          const reaction = event.target;
          await this.analyticsCoordinator.handleReactionDeleted(reaction);
          logger.info(`Reaction deleted event handled: ${reaction.id}`);
        } catch (error) {
          logger.error('Error handling reaction deleted event:', error);
        }
      }
    });

    // View events
    this.prisma.$on('threadView', {
      create: async (event) => {
        try {
          const view = event.target;
          await this.analyticsCoordinator.handleViewCreated(view);
          logger.info(`View created event handled: ${view.id}`);
        } catch (error) {
          logger.error('Error handling view created event:', error);
        }
      }
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