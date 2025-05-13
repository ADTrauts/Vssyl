import { PrismaClient } from '@prisma/client';
import { 
  ThreadAnalytics, 
  EngagementMetrics, 
  ActivityTimeline, 
  ParticipantStats 
} from '../types/analytics';
import { handleApiError } from '../utils/error-handler';

export class ThreadAnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getThreadAnalytics(threadId: string): Promise<ThreadAnalytics> {
    try {
      const analytics = await this.prisma.threadAnalytics.findUnique({
        where: { threadId }
      });

      if (!analytics) {
        throw new Error('Thread analytics not found');
      }

      // Map database fields to ThreadAnalytics interface
      return {
        id: analytics.id,
        threadId: analytics.threadId,
        viewCount: analytics.viewCount,
        commentCount: analytics.replyCount, // Map replyCount to commentCount
        likeCount: analytics.reactionCount, // Map reactionCount to likeCount
        shareCount: 0, // Default to 0 if not tracked
        lastActivityAt: analytics.lastActivity,
        createdAt: analytics.createdAt,
        updatedAt: analytics.updatedAt
      };
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get thread analytics'
      });
    }
  }

  async getEngagementMetrics(threadId: string): Promise<EngagementMetrics> {
    try {
      const [views, comments, likes, shares, uniqueUsers] = await Promise.all([
        this.prisma.threadActivity.count({
          where: { threadId, type: 'view' }
        }),
        this.prisma.threadActivity.count({
          where: { threadId, type: 'comment' }
        }),
        this.prisma.threadActivity.count({
          where: { threadId, type: 'like' }
        }),
        this.prisma.threadActivity.count({
          where: { threadId, type: 'share' }
        }),
        this.prisma.threadActivity.groupBy({
          by: ['userId'],
          where: { threadId }
        })
      ]);

      const averageTimeSpent = await this.calculateAverageTimeSpent(threadId);

      return {
        threadId,
        views,
        comments,
        likes,
        shares,
        uniqueUsers: uniqueUsers.length,
        averageTimeSpent
      };
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get engagement metrics'
      });
    }
  }

  async getActivityTimeline(threadId: string): Promise<ActivityTimeline[]> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { threadId },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      return activities.map(activity => ({
        timestamp: activity.timestamp,
        type: activity.type as 'view' | 'comment' | 'like' | 'share',
        userId: activity.userId,
        metadata: activity.metadata as Record<string, unknown>
      }));
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get activity timeline'
      });
    }
  }

  async getParticipantStats(threadId: string): Promise<ParticipantStats[]> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { threadId },
        include: { user: true }
      });

      const stats = new Map<string, ParticipantStats>();

      for (const activity of activities) {
        const existing = stats.get(activity.userId) || {
          userId: activity.userId,
          viewCount: 0,
          commentCount: 0,
          likeCount: 0,
          shareCount: 0,
          lastActiveAt: activity.timestamp
        };

        switch (activity.type) {
          case 'view':
            existing.viewCount++;
            break;
          case 'comment':
            existing.commentCount++;
            break;
          case 'like':
            existing.likeCount++;
            break;
          case 'share':
            existing.shareCount++;
            break;
        }

        stats.set(activity.userId, existing);
      }

      return Array.from(stats.values());
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get participant stats'
      });
    }
  }

  private async calculateAverageTimeSpent(threadId: string): Promise<number> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { threadId },
        orderBy: { timestamp: 'asc' }
      });

      if (activities.length < 2) {
        return 0;
      }

      let totalTime = 0;
      let count = 0;

      for (let i = 1; i < activities.length; i++) {
        const timeDiff = activities[i].timestamp.getTime() - activities[i - 1].timestamp.getTime();
        if (timeDiff < 3600000) { // Only count if less than 1 hour
          totalTime += timeDiff;
          count++;
        }
      }

      return count > 0 ? totalTime / count / 1000 : 0; // Convert to seconds
    } catch (error) {
      throw handleApiError(error, {
        showToast: false,
        logToConsole: true,
        fallbackMessage: 'Failed to calculate average time spent'
      });
    }
  }
} 