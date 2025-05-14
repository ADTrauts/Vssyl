import { PrismaClient, Thread, ThreadMessage, User, ThreadReaction } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsService } from './analyticsService';
import { AnalyticsAggregationService } from './analyticsAggregationService';
import { AnalyticsBatchService } from './analyticsBatchService';
import { AnalyticsCacheService } from './analyticsCacheService';
import { AnalyticsWebSocketService } from './analyticsWebSocketService';
import { AdvancedAnalyticsService } from './advancedAnalyticsService';

interface AnalyticsCoordinatorConfig {
  aggregationInterval: number;
  batchProcessingInterval: number;
  cacheTTL: number;
}

export class AnalyticsCoordinator {
  private static instance: AnalyticsCoordinator;
  private prisma: PrismaClient;
  private analyticsService!: AnalyticsService;
  private aggregationService!: AnalyticsAggregationService;
  private batchService!: AnalyticsBatchService;
  private cache: AnalyticsCacheService;
  private config: AnalyticsCoordinatorConfig;
  private isInitialized: boolean = false;
  private webSocketService: AnalyticsWebSocketService;
  private advancedAnalyticsService: AdvancedAnalyticsService;

  private constructor(
    prisma: PrismaClient = new PrismaClient(),
    config: AnalyticsCoordinatorConfig = {
      aggregationInterval: 15 * 60 * 1000, // 15 minutes
      batchProcessingInterval: 5 * 60 * 1000, // 5 minutes
      cacheTTL: 3600 // 1 hour
    }
  ) {
    this.prisma = prisma;
    this.config = config;
    this.cache = AnalyticsCacheService.getInstance({
      ttl: config.cacheTTL,
      prefix: 'coordinator:'
    });
    this.webSocketService = AnalyticsWebSocketService.getInstance();
    this.advancedAnalyticsService = AdvancedAnalyticsService.getInstance();
  }

  public static getInstance(prisma?: PrismaClient, config?: AnalyticsCoordinatorConfig): AnalyticsCoordinator {
    if (!AnalyticsCoordinator.instance) {
      AnalyticsCoordinator.instance = new AnalyticsCoordinator(prisma, config);
    }
    return AnalyticsCoordinator.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.analyticsService = new AnalyticsService(this.prisma);
      this.aggregationService = new AnalyticsAggregationService(this.prisma);
      this.batchService = new AnalyticsBatchService(this.prisma);

      // Start background jobs
      await this.startAggregationJob();
      await this.startBatchProcessingJob();
      await this.webSocketService.initialize(undefined); // TODO: Pass actual server instance in production

      this.isInitialized = true;
      logger.info('AnalyticsCoordinator initialized successfully');
    } catch (error) {
      logger.error('Error initializing AnalyticsCoordinator:', error);
      throw error;
    }
  }

  private async startAggregationJob(): Promise<void> {
    try {
      await this.aggregationService.getAggregatedMetrics();
      setTimeout(() => this.startAggregationJob(), this.config.aggregationInterval);
    } catch (error) {
      logger.error('Error in aggregation job:', error);
      setTimeout(() => this.startAggregationJob(), this.config.aggregationInterval);
    }
  }

  private async startBatchProcessingJob(): Promise<void> {
    try {
      // Get threads that need processing
      const threads = await this.prisma.thread.findMany({
        where: {
          OR: [
            { analytics: null },
            { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
          ]
        },
        select: { id: true }
      });

      // Queue threads for batch processing
      for (const thread of threads) {
        await this.batchService.queueThreadForProcessing(thread.id);
      }
    } catch (error) {
      logger.error('Error in batch processing job:', error);
    } finally {
      setTimeout(() => this.startBatchProcessingJob(), this.config.batchProcessingInterval);
    }
  }

  public async getThreadAnalytics(threadId: string): Promise<unknown> {
    const cacheKey = `thread:${threadId}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get analytics from batch service
      const analytics = await this.batchService.getThreadAnalytics(threadId);
      
      // Cache the results
      await this.cache.set(cacheKey, analytics);
      
      return analytics;
    } catch (error) {
      logger.error(`Error getting analytics for thread ${threadId}:`, error);
      throw error;
    }
  }

  public async getUserAnalytics(userId: string): Promise<unknown> {
    const cacheKey = `user:${userId}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get analytics from main service
      const analytics = await this.analyticsService.getUserAnalytics(userId);
      
      // Cache the results
      await this.cache.set(cacheKey, analytics);
      
      return analytics;
    } catch (error) {
      logger.error(`Error getting analytics for user ${userId}:`, error);
      throw error;
    }
  }

  public async getAggregatedMetrics(): Promise<unknown> {
    const cacheKey = 'aggregated_metrics';
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get aggregated metrics
      const metrics = await this.aggregationService.getAggregatedMetrics();
      
      // Cache the results
      await this.cache.set(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      throw error;
    }
  }

  public async clearCache(prefix?: string): Promise<void> {
    try {
      await this.cache.clear(prefix);
      logger.info(`Cache cleared${prefix ? ` for prefix: ${prefix}` : ''}`);
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }

  public async onThreadUpdate(threadId: string): Promise<void> {
    try {
      // Queue thread for batch processing
      await this.batchService.queueThreadForProcessing(threadId);
      
      // Clear relevant cache entries
      await this.clearCache(`thread:${threadId}`);
    } catch (error) {
      logger.error(`Error handling thread update for ${threadId}:`, error);
      throw error;
    }
  }

  public async onUserActivity(userId: string): Promise<void> {
    try {
      // Clear user analytics cache
      await this.clearCache(`user:${userId}`);
    } catch (error) {
      logger.error(`Error handling user activity for ${userId}:`, error);
      throw error;
    }
  }

  // Thread event handlers
  public async handleThreadCreated(thread: Thread): Promise<void> {
    try {
      const basicAnalytics = await this.analyticsService.getThreadAnalytics(thread.id);
      const advancedAnalytics = await this.advancedAnalyticsService.calculateThreadPerformanceMetrics(thread.id);
      
      await this.cache.set(`thread:${thread.id}`, basicAnalytics);
      await this.cache.set(`advanced_thread:${thread.id}`, advancedAnalytics);
      
      await this.webSocketService.broadcastThreadAnalytics(thread.id, {
        ...basicAnalytics,
        advanced: advancedAnalytics
      });
    } catch (error) {
      logger.error(`Error handling thread created event for thread ${thread.id}:`, error);
    }
  }

  public async handleThreadUpdated(thread: Thread): Promise<void> {
    try {
      const analytics = await this.analyticsService.getThreadAnalytics(thread.id);
      await this.cache.set(`thread:${thread.id}`, analytics);
      await this.webSocketService.broadcastThreadAnalytics(thread.id, analytics);
    } catch (error) {
      logger.error(`Error handling thread updated event for thread ${thread.id}:`, error);
    }
  }

  public async handleThreadDeleted(thread: Thread): Promise<void> {
    try {
      await this.cache.clear(`thread:${thread.id}`);
      await this.webSocketService.broadcastThreadDeleted(thread.id);
    } catch (error) {
      logger.error(`Error handling thread deleted event for thread ${thread.id}:`, error);
    }
  }

  // Message event handlers
  public async handleMessageCreated(message: ThreadMessage): Promise<void> {
    try {
      const threadAnalytics = await this.analyticsService.getThreadAnalytics(message.threadId);
      await this.cache.set(`thread:${message.threadId}`, threadAnalytics);
      await this.webSocketService.broadcastThreadAnalytics(message.threadId, threadAnalytics);

      const userAnalytics = await this.analyticsService.getUserAnalytics(message.userId);
      await this.cache.set(`user:${message.userId}`, userAnalytics);
      await this.webSocketService.broadcastUserAnalytics(message.userId, userAnalytics);
    } catch (error) {
      logger.error(`Error handling message created event for message ${message.id}:`, error);
    }
  }

  public async handleMessageUpdated(message: ThreadMessage): Promise<void> {
    try {
      const threadAnalytics = await this.analyticsService.getThreadAnalytics(message.threadId);
      await this.cache.set(`thread:${message.threadId}`, threadAnalytics);
      await this.webSocketService.broadcastThreadAnalytics(message.threadId, threadAnalytics);
    } catch (error) {
      logger.error(`Error handling message updated event for message ${message.id}:`, error);
    }
  }

  public async handleMessageDeleted(message: ThreadMessage): Promise<void> {
    try {
      const threadAnalytics = await this.analyticsService.getThreadAnalytics(message.threadId);
      await this.cache.set(`thread:${message.threadId}`, threadAnalytics);
      await this.webSocketService.broadcastThreadAnalytics(message.threadId, threadAnalytics);

      const userAnalytics = await this.analyticsService.getUserAnalytics(message.userId);
      await this.cache.set(`user:${message.userId}`, userAnalytics);
      await this.webSocketService.broadcastUserAnalytics(message.userId, userAnalytics);
    } catch (error) {
      logger.error(`Error handling message deleted event for message ${message.id}:`, error);
    }
  }

  // User event handlers
  public async handleUserUpdated(user: User): Promise<void> {
    try {
      const basicAnalytics = await this.analyticsService.getUserAnalytics(user.id);
      const advancedAnalytics = await this.advancedAnalyticsService.calculateUserEngagementMetrics(user.id);
      
      await this.cache.set(`user:${user.id}`, basicAnalytics);
      await this.cache.set(`advanced_user:${user.id}`, advancedAnalytics);
      
      await this.webSocketService.broadcastUserAnalytics(user.id, {
        ...basicAnalytics,
        advanced: advancedAnalytics
      });
    } catch (error) {
      logger.error(`Error handling user updated event for user ${user.id}:`, error);
    }
  }

  // Reaction event handlers
  public async handleReactionCreated(reaction: ThreadReaction): Promise<void> {
    try {
      const threadAnalytics = await this.analyticsService.getThreadAnalytics(reaction.threadId);
      await this.cache.set(`thread:${reaction.threadId}`, threadAnalytics);
      await this.webSocketService.broadcastThreadAnalytics(reaction.threadId, threadAnalytics);
    } catch (error) {
      logger.error(`Error handling reaction created event for reaction ${reaction.id}:`, error);
    }
  }

  public async handleReactionDeleted(reaction: ThreadReaction): Promise<void> {
    try {
      const threadAnalytics = await this.analyticsService.getThreadAnalytics(reaction.threadId);
      await this.cache.set(`thread:${reaction.threadId}`, threadAnalytics);
      await this.webSocketService.broadcastThreadAnalytics(reaction.threadId, threadAnalytics);
    } catch (error) {
      logger.error(`Error handling reaction deleted event for reaction ${reaction.id}:`, error);
    }
  }

  // View event handlers
  public async handleViewCreated(view: { threadId: string; id: string }): Promise<void> {
    try {
      const threadAnalytics = await this.analyticsService.getThreadAnalytics(view.threadId);
      await this.cache.set(`thread:${view.threadId}`, threadAnalytics);
      await this.webSocketService.broadcastThreadAnalytics(view.threadId, threadAnalytics);
    } catch (error) {
      logger.error(`Error handling view created event for view ${view.id}:`, error);
    }
  }

  public async getAdvancedUserAnalytics(userId: string): Promise<unknown> {
    const cacheKey = `advanced_user:${userId}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const analytics = await this.advancedAnalyticsService.calculateUserEngagementMetrics(userId);
      await this.cache.set(cacheKey, analytics);
      return analytics;
    } catch (error) {
      logger.error(`Error getting advanced analytics for user ${userId}:`, error);
      throw error;
    }
  }

  public async getAdvancedThreadAnalytics(threadId: string): Promise<unknown> {
    const cacheKey = `advanced_thread:${threadId}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const analytics = await this.advancedAnalyticsService.calculateThreadPerformanceMetrics(threadId);
      await this.cache.set(cacheKey, analytics);
      return analytics;
    } catch (error) {
      logger.error(`Error getting advanced analytics for thread ${threadId}:`, error);
      throw error;
    }
  }

  public async getAdvancedTagAnalytics(tagId: string): Promise<unknown> {
    const cacheKey = `advanced_tag:${tagId}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const analytics = await this.advancedAnalyticsService.calculateTagAnalytics(tagId);
      await this.cache.set(cacheKey, analytics);
      return analytics;
    } catch (error) {
      logger.error(`Error getting advanced analytics for tag ${tagId}:`, error);
      throw error;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      await this.cache.clear();
      await this.webSocketService.cleanup();
      logger.info('Analytics coordinator cleaned up successfully');
    } catch (error) {
      logger.error('Error cleaning up analytics coordinator:', error);
      throw error;
    }
  }
} 