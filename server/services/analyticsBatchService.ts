import { PrismaClient, Thread, ThreadAnalytics, ThreadMessage, ThreadParticipant } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsCacheService } from './analyticsCacheService';

interface BatchProcessingConfig {
  batchSize: number;
  maxConcurrentBatches: number;
  processingInterval: number;
}

interface ThreadWithRelations extends Thread {
  analytics: ThreadAnalytics | null;
  messages: ThreadMessage[];
  participants: ThreadParticipant[];
}

export type ThreadAnalyticsSummary = {
  engagementScore: number;
  viewCount: number;
  replyCount: number;
  reactionCount: number;
  lastActivity: Date;
  participantCount: number;
};

export class AnalyticsBatchService {
  private prisma: PrismaClient;
  private cache: AnalyticsCacheService;
  private config: BatchProcessingConfig;
  private processingQueue: Set<string> = new Set();
  private isProcessing: boolean = false;

  constructor(
    prisma: PrismaClient = new PrismaClient(),
    config: BatchProcessingConfig = {
      batchSize: 100,
      maxConcurrentBatches: 3,
      processingInterval: 5 * 60 * 1000 // 5 minutes
    }
  ) {
    this.prisma = prisma;
    this.cache = AnalyticsCacheService.getInstance({
      ttl: 3600, // 1 hour
      prefix: 'batch:'
    });
    this.config = config;
  }

  public async queueThreadForProcessing(threadId: string): Promise<void> {
    this.processingQueue.add(threadId);
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing || this.processingQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    try {
      const batchIds = Array.from(this.processingQueue).slice(0, this.config.batchSize);
      await this.processBatch(batchIds);
      
      // Remove processed threads from queue
      batchIds.forEach(id => this.processingQueue.delete(id));
      
      // Schedule next batch if queue is not empty
      if (this.processingQueue.size > 0) {
        setTimeout(() => this.startProcessing(), this.config.processingInterval);
      } else {
        this.isProcessing = false;
      }
    } catch (error) {
      logger.error('Error in batch processing:', error);
      this.isProcessing = false;
    }
  }

  private async processBatch(threadIds: string[]): Promise<void> {
    try {
      const threads = await this.prisma.thread.findMany({
        where: { id: { in: threadIds } },
        include: {
          analytics: true,
          messages: true,
          participants: true
        }
      }) as ThreadWithRelations[];

      const updatePromises = threads.map(thread => 
        this.updateThreadAnalytics(thread)
      );

      await Promise.all(updatePromises);
    } catch (error) {
      logger.error('Error processing batch:', error);
      throw error;
    }
  }

  private async updateThreadAnalytics(thread: ThreadWithRelations): Promise<void> {
    try {
      const engagementScore = this.calculateEngagementScore(thread);
      const activityMetrics = this.calculateActivityMetrics(thread);
      const participantMetrics = this.calculateParticipantMetrics(thread);

      await this.prisma.threadAnalytics.upsert({
        where: { threadId: thread.id },
        create: {
          threadId: thread.id,
          engagementScore: engagementScore,
          messageCount: thread.messages.length,
          viewCount: activityMetrics.viewCount,
          reactionCount: activityMetrics.reactionCount,
          participantCount: participantMetrics.participantCount,
          lastActivity: activityMetrics.lastActivity
        },
        update: {
          engagementScore: engagementScore,
          messageCount: thread.messages.length,
          viewCount: activityMetrics.viewCount,
          reactionCount: activityMetrics.reactionCount,
          participantCount: participantMetrics.participantCount,
          lastActivity: activityMetrics.lastActivity
        }
      });

      // Update cache
      const cacheKey = `thread:${thread.id}`;
      await this.cache.set(cacheKey, {
        engagementScore,
        ...activityMetrics,
        ...participantMetrics
      });
    } catch (error) {
      logger.error(`Error updating analytics for thread ${thread.id}:`, error);
      throw error;
    }
  }

  private calculateEngagementScore(thread: ThreadWithRelations): number {
    const viewWeight = 0.2;
    const replyWeight = 0.3;
    const participantWeight = 0.3;
    const reactionWeight = 0.2;

    const viewScore = thread.analytics?.viewCount || 0;
    const replyScore = thread.messages.length;
    const participantScore = thread.participants.length;
    const reactionScore = thread.analytics?.reactionCount || 0;

    return (
      viewScore * viewWeight +
      replyScore * replyWeight +
      participantScore * participantWeight +
      reactionScore * reactionWeight
    );
  }

  private calculateActivityMetrics(thread: ThreadWithRelations) {
    return {
      viewCount: thread.analytics?.viewCount || 0,
      replyCount: thread.messages.length,
      reactionCount: thread.analytics?.reactionCount || 0,
      lastActivity: thread.messages.length > 0 
        ? thread.messages[thread.messages.length - 1].createdAt 
        : thread.createdAt
    };
  }

  private calculateParticipantMetrics(thread: ThreadWithRelations) {
    return {
      participantCount: thread.participants.length,
    };
  }

  public async getThreadAnalytics(threadId: string): Promise<ThreadAnalyticsSummary> {
    const cacheKey = `thread:${threadId}`;
    const cachedData = await this.cache.get<ThreadAnalyticsSummary>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // If not in cache, queue for processing
    await this.queueThreadForProcessing(threadId);
    
    // Return current data while processing
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        analytics: true,
        messages: true,
        participants: true
      }
    }) as ThreadWithRelations;

    return {
      engagementScore: this.calculateEngagementScore(thread),
      ...this.calculateActivityMetrics(thread),
      ...this.calculateParticipantMetrics(thread)
    };
  }
} 