import { prisma } from '../prismaClient';
import { Thread, User, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors';

// Define ThreadActivity type
type ThreadActivity = {
  id: string;
  threadId: string;
  userId: string;
  type: string;
  metadata: Prisma.JsonValue | null;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

// Define activity types
export type ActivityType = 
  | 'view'
  | 'edit'
  | 'comment'
  | 'like'
  | 'share'
  | 'pin'
  | 'star'
  | 'mention'
  | 'assignment'
  | 'status_change';

// Define activity metadata structure
export interface ActivityMetadata {
  commentId?: string;
  status?: string;
  assigneeId?: string;
  mentionedUsers?: string[];
  [key: string]: any; // Allow for additional metadata fields
}

// Define activity response type
export interface ActivityResponse {
  id: string;
  type: ActivityType;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  metadata: ActivityMetadata;
}

// Define activity summary type
export interface ActivitySummary {
  totalActivities: number;
  activityByType: Record<ActivityType, number>;
  activityByUser: Array<{
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    count: number;
  }>;
}

// Define activity metrics type
export interface ActivityMetrics {
  totalActivities: number;
  activityTypes: Record<ActivityType, number>;
  uniqueUsers: number;
  averageActivitiesPerDay: number;
}

type ThreadActivityWithUser = {
  id: string;
  threadId: string;
  userId: string;
  type: string;
  metadata: Prisma.JsonValue | null;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export class ThreadActivityService {
  // Record a new thread activity
  async recordActivity(
    threadId: string,
    userId: string,
    type: ActivityType,
    metadata?: ActivityMetadata
  ): Promise<ThreadActivityWithUser> {
    try {
      // Validate thread exists
      const thread = await prisma.thread.findUnique({
        where: { id: threadId }
      });

      if (!thread) {
        throw new NotFoundError(`Thread with ID ${threadId} not found`);
      }

      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      const activity = await prisma.threadActivity.create({
        data: {
          threadId,
          userId,
          type,
          metadata: metadata || {},
          timestamp: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      return {
        id: activity.id,
        threadId: activity.threadId,
        userId: activity.userId,
        type: activity.type,
        metadata: activity.metadata,
        timestamp: activity.timestamp,
        user: activity.user
      };
    } catch (error) {
      logger.error('Error recording thread activity:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to record thread activity');
    }
  }

  // Get recent activities for a thread
  async getRecentActivities(
    threadId: string,
    limit: number = 20
  ): Promise<ActivityResponse[]> {
    try {
      // Validate thread exists
      const thread = await prisma.thread.findUnique({
        where: { id: threadId }
      });

      if (!thread) {
        throw new NotFoundError(`Thread with ID ${threadId} not found`);
      }

      const activities = await prisma.threadActivity.findMany({
        where: { threadId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      return activities.map((activity) => ({
        id: activity.id,
        type: activity.type as ActivityType,
        timestamp: activity.timestamp,
        user: activity.user,
        metadata: (activity.metadata as ActivityMetadata) || {}
      }));
    } catch (error) {
      logger.error('Error getting recent activities:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get recent activities');
    }
  }

  // Get activity summary for a thread
  async getActivitySummary(
    threadId: string,
    days: number = 7
  ): Promise<ActivitySummary> {
    try {
      // Validate thread exists
      const thread = await prisma.thread.findUnique({
        where: { id: threadId }
      });

      if (!thread) {
        throw new NotFoundError(`Thread with ID ${threadId} not found`);
      }

      // Validate days parameter
      if (days < 1 || days > 365) {
        throw new ValidationError('Days parameter must be between 1 and 365');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      // Count activities by type
      const activityByType = activities.reduce((acc: Record<ActivityType, number>, activity) => {
        const type = activity.type as ActivityType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<ActivityType, number>);

      // Count activities by user
      const activityByUser = activities.reduce((acc: Record<string, { user: { id: string; name: string; avatarUrl: string | null }; count: number }>, activity) => {
        const userId = activity.userId;
        if (!acc[userId]) {
          acc[userId] = {
            user: activity.user,
            count: 0
          };
        }
        acc[userId].count++;
        return acc;
      }, {});

      return {
        totalActivities: activities.length,
        activityByType,
        activityByUser: Object.values(activityByUser)
      };
    } catch (error) {
      logger.error('Error getting activity summary:', error);
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to get activity summary');
    }
  }

  // Clean up old activities
  async cleanupOldActivities(days: number = 30): Promise<void> {
    try {
      // Validate days parameter
      if (days < 1 || days > 365) {
        throw new ValidationError('Days parameter must be between 1 and 365');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await prisma.threadActivity.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });
    } catch (error) {
      logger.error('Error cleaning up old activities:', error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to clean up old activities');
    }
  }

  async getActivityTimeline(threadId: string, timeRange: string) {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Group activities by time period
      const timeline = activities.reduce((acc, activity) => {
        const timeKey = this.getTimeKey(activity.timestamp, timeRange);
        if (!acc[timeKey]) {
          acc[timeKey] = {
            count: 0,
            activities: []
          };
        }
        acc[timeKey].count++;
        acc[timeKey].activities.push(activity);
        return acc;
      }, {} as Record<string, { count: number; activities: ThreadActivity[] }>);

      return timeline;
    } catch (error) {
      logger.error('Error getting activity timeline:', error);
      throw error;
    }
  }

  async getActivityHeatmap(threadId: string, timeRange: string) {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      // Create heatmap data structure
      const heatmap = activities.reduce((acc, activity) => {
        const timeKey = this.getTimeKey(activity.timestamp, timeRange);
        const userId = activity.userId;
        
        if (!acc[timeKey]) {
          acc[timeKey] = {};
        }
        if (!acc[timeKey][userId]) {
          acc[timeKey][userId] = {
            count: 0,
            user: activity.user
          };
        }
        acc[timeKey][userId].count++;
        return acc;
      }, {} as Record<string, Record<string, { count: number; user: { id: string; name: string; avatarUrl: string | null } }>>);

      return heatmap;
    } catch (error) {
      logger.error('Error getting activity heatmap:', error);
      throw error;
    }
  }

  async getActivityMetrics(threadId: string, timeRange: string) {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate
          }
        }
      });

      // Calculate metrics
      const metrics = {
        totalActivities: activities.length,
        activityTypes: activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        uniqueUsers: new Set(activities.map(a => a.userId)).size,
        averageActivitiesPerDay: this.calculateAveragePerDay(activities, timeRange)
      };

      return metrics;
    } catch (error) {
      logger.error('Error getting activity metrics:', error);
      throw error;
    }
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 7)); // Default to week
    }
  }

  private getTimeKey(timestamp: Date, timeRange: string): string {
    const date = new Date(timestamp);
    switch (timeRange) {
      case 'day':
        return date.toISOString().slice(0, 13); // Hourly
      case 'week':
        return date.toISOString().slice(0, 10); // Daily
      case 'month':
        return date.toISOString().slice(0, 7); // Monthly
      default:
        return date.toISOString().slice(0, 10); // Default to daily
    }
  }

  private calculateAveragePerDay(activities: ThreadActivity[], timeRange: string): number {
    const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
    return activities.length / days;
  }
} 