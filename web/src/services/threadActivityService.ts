import { PrismaClient, Prisma } from '@prisma/client';
import { ThreadActivity } from '../types/analytics';
import { handleApiError } from '../utils/error-handler';

type ActivityMetadata = Prisma.JsonValue;

export class ThreadActivityService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async recordActivity(threadId: string, userId: string, type: ThreadActivity['type'], metadata?: ActivityMetadata): Promise<ThreadActivity> {
    try {
      const activity = await this.prisma.threadActivity.create({
        data: {
          threadId,
          userId,
          type,
          metadata: metadata || {}
        }
      });

      return {
        id: activity.id,
        threadId: activity.threadId,
        userId: activity.userId,
        type: activity.type as ThreadActivity['type'],
        timestamp: activity.timestamp,
        metadata: activity.metadata as Record<string, unknown>
      };
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to record activity'
      });
    }
  }

  async getThreadActivities(threadId: string, limit = 100): Promise<ThreadActivity[]> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { threadId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return activities.map(activity => ({
        id: activity.id,
        threadId: activity.threadId,
        userId: activity.userId,
        type: activity.type as ThreadActivity['type'],
        timestamp: activity.timestamp,
        metadata: activity.metadata as Record<string, unknown>
      }));
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get thread activities'
      });
    }
  }

  async getUserActivities(userId: string, limit = 100): Promise<ThreadActivity[]> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return activities.map(activity => ({
        id: activity.id,
        threadId: activity.threadId,
        userId: activity.userId,
        type: activity.type as ThreadActivity['type'],
        timestamp: activity.timestamp,
        metadata: activity.metadata as Record<string, unknown>
      }));
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get user activities'
      });
    }
  }

  async deleteActivities(threadId: string): Promise<void> {
    try {
      await this.prisma.threadActivity.deleteMany({
        where: { threadId }
      });
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to delete activities'
      });
    }
  }

  async getActivityStats(threadId: string): Promise<Record<ThreadActivity['type'], number>> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { threadId }
      });

      const stats: Record<ThreadActivity['type'], number> = {
        view: 0,
        comment: 0,
        like: 0,
        share: 0
      };

      for (const activity of activities) {
        stats[activity.type as ThreadActivity['type']]++;
      }

      return stats;
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get activity stats'
      });
    }
  }

  async getRecentActivities(limit = 50): Promise<ThreadActivity[]> {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return activities.map(activity => ({
        id: activity.id,
        threadId: activity.threadId,
        userId: activity.userId,
        type: activity.type as ThreadActivity['type'],
        timestamp: activity.timestamp,
        metadata: activity.metadata as Record<string, unknown>
      }));
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get recent activities'
      });
    }
  }
} 