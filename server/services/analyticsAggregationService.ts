import { PrismaClient, Thread, ThreadAnalytics, ThreadActivity, ThreadMessage, ThreadParticipant, ThreadReaction } from '@prisma/client';
import { logger } from '../utils/logger';
import { AnalyticsCacheService } from './analyticsCacheService';

interface AggregatedMetrics {
  totalThreads: number;
  totalMessages: number;
  totalParticipants: number;
  totalReactions: number;
  averageEngagement: number;
  peakActivityHours: Array<{ hour: number; count: number }>;
  topThreads: Array<{ threadId: string; engagement: number }>;
  userActivity: Array<{ userId: string; activity: number }>;
}

interface ThreadWithRelations extends Thread {
  analytics: ThreadAnalytics | null;
  messages: (ThreadMessage & {
    reactions: ThreadReaction[];
  })[];
  participants: ThreadParticipant[];
}

export class AnalyticsAggregationService {
  private prisma: PrismaClient;
  private cache: AnalyticsCacheService;
  private readonly AGGREGATION_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private readonly TOP_THREADS_LIMIT = 10;
  private readonly TOP_USERS_LIMIT = 10;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
    this.cache = AnalyticsCacheService.getInstance({
      ttl: 1800, // 30 minutes
      prefix: 'aggregation:'
    });
  }

  public async getAggregatedMetrics(): Promise<AggregatedMetrics> {
    const cacheKey = 'aggregated_metrics';
    return this.cache.getOrSet(cacheKey, async () => {
      try {
        const [
          totalThreads,
          totalMessages,
          totalParticipants,
          totalReactions,
          activities,
          threads
        ] = await Promise.all([
          this.prisma.thread.count(),
          this.prisma.threadMessage.count(),
          this.prisma.threadParticipant.count(),
          this.prisma.threadReaction.count(),
          this.prisma.threadActivity.findMany({
            select: {
              id: true,
              threadId: true,
              userId: true,
              type: true,
              metadata: true,
              timestamp: true
            },
            orderBy: { timestamp: 'desc' },
            take: 1000
          }),
          this.prisma.thread.findMany({
            include: {
              analytics: true,
              messages: {
                include: {
                  reactions: true
                }
              },
              participants: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 100
          }) as Promise<ThreadWithRelations[]>
        ]);

        const peakActivityHours = this.calculatePeakActivityHours(activities);
        const topThreads = this.calculateTopThreads(threads);
        const userActivity = this.calculateUserActivity(activities);
        const averageEngagement = this.calculateAverageEngagement(threads);

        return {
          totalThreads,
          totalMessages,
          totalParticipants,
          totalReactions,
          averageEngagement,
          peakActivityHours,
          topThreads,
          userActivity
        };
      } catch (error) {
        logger.error('Error aggregating metrics:', error);
        throw error;
      }
    });
  }

  private calculatePeakActivityHours(activities: ThreadActivity[]): Array<{ hour: number; count: number }> {
    const hourCounts = new Array(24).fill(0);
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour]++;
    });

    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateTopThreads(threads: ThreadWithRelations[]): Array<{ threadId: string; engagement: number }> {
    return threads
      .map(thread => ({
        threadId: thread.id,
        engagement: this.calculateThreadEngagement(thread)
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, this.TOP_THREADS_LIMIT);
  }

  private calculateUserActivity(activities: ThreadActivity[]): Array<{ userId: string; activity: number }> {
    const userActivity = new Map<string, number>();
    activities.forEach(activity => {
      const count = userActivity.get(activity.userId) || 0;
      userActivity.set(activity.userId, count + 1);
    });

    return Array.from(userActivity.entries())
      .map(([userId, activity]) => ({ userId, activity }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, this.TOP_USERS_LIMIT);
  }

  private calculateThreadEngagement(thread: ThreadWithRelations): number {
    const viewWeight = 0.2;
    const replyWeight = 0.3;
    const reactionWeight = 0.2;
    const participantWeight = 0.3;

    const viewScore = thread.analytics?.viewCount || 0;
    const replyScore = thread.messages.length;
    const reactionScore = thread.messages.reduce((sum, message) => sum + message.reactions.length, 0);
    const participantScore = thread.participants.length;

    return (
      viewScore * viewWeight +
      replyScore * replyWeight +
      reactionScore * reactionWeight +
      participantScore * participantWeight
    );
  }

  private calculateAverageEngagement(threads: ThreadWithRelations[]): number {
    if (threads.length === 0) return 0;
    const totalEngagement = threads.reduce((sum, thread) => 
      sum + this.calculateThreadEngagement(thread), 0);
    return totalEngagement / threads.length;
  }

  public async startAggregationJob(): Promise<void> {
    try {
      await this.getAggregatedMetrics();
      setTimeout(() => this.startAggregationJob(), this.AGGREGATION_INTERVAL);
    } catch (error) {
      logger.error('Error in aggregation job:', error);
      setTimeout(() => this.startAggregationJob(), this.AGGREGATION_INTERVAL);
    }
  }
} 