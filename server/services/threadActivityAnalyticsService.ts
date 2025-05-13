import { prisma } from '../prismaClient';
import { ThreadActivityType } from '@prisma/client';
import { logger } from '../utils/logger';
import { subDays, subMonths, format, startOfDay, endOfDay } from 'date-fns';

export class ThreadActivityAnalyticsService {
  async getEngagementMetrics(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate,
            lte: now
          }
        }
      });

      const totalActivities = activities.length;
      const uniqueParticipants = new Set(activities.map(a => a.userId)).size;
      const messageCount = activities.filter(a => a.type === ThreadActivityType.MESSAGE_CREATED).length;
      const reactionCount = activities.filter(a => a.type === ThreadActivityType.REACTION_ADDED).length;
      const editCount = activities.filter(a => a.type === ThreadActivityType.CONTENT_EDITED).length;

      return {
        totalActivities,
        uniqueParticipants,
        messageCount,
        reactionCount,
        editCount,
        averageActivityPerParticipant: totalActivities / uniqueParticipants,
        engagementRate: (uniqueParticipants / totalActivities) * 100
      };
    } catch (error) {
      logger.error('Error getting engagement metrics:', error);
      throw error;
    }
  }

  async getActivityPatterns(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Calculate peak activity hours
      const hourlyActivity = new Array(24).fill(0);
      activities.forEach(activity => {
        const hour = new Date(activity.timestamp).getHours();
        hourlyActivity[hour]++;
      });

      const peakHours = hourlyActivity
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Calculate activity patterns by day of week
      const dailyActivity = new Array(7).fill(0);
      activities.forEach(activity => {
        const day = new Date(activity.timestamp).getDay();
        dailyActivity[day]++;
      });

      return {
        peakHours,
        dailyActivity,
        averageActivityPerHour: activities.length / 24,
        busiestDay: dailyActivity.indexOf(Math.max(...dailyActivity))
      };
    } catch (error) {
      logger.error('Error getting activity patterns:', error);
      throw error;
    }
  }

  async getParticipantMetrics(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate,
            lte: now
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      });

      // Group activities by user
      const userActivities = activities.reduce((acc, activity) => {
        if (!acc[activity.userId]) {
          acc[activity.userId] = {
            user: activity.user,
            totalActivities: 0,
            activityTypes: {},
            lastActivity: activity.timestamp
          };
        }
        acc[activity.userId].totalActivities++;
        acc[activity.userId].activityTypes[activity.type] = 
          (acc[activity.userId].activityTypes[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(userActivities).map((data: any) => ({
        user: data.user,
        totalActivities: data.totalActivities,
        activityTypes: data.activityTypes,
        lastActivity: data.lastActivity,
        activityRate: data.totalActivities / (timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30)
      }));
    } catch (error) {
      logger.error('Error getting participant metrics:', error);
      throw error;
    }
  }

  async getThreadHealthMetrics(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate,
            lte: now
          }
        }
      });

      const messageActivities = activities.filter(a => a.type === ThreadActivityType.MESSAGE_CREATED);
      const reactionActivities = activities.filter(a => a.type === ThreadActivityType.REACTION_ADDED);
      const editActivities = activities.filter(a => a.type === ThreadActivityType.CONTENT_EDITED);

      const uniqueParticipants = new Set(activities.map(a => a.userId)).size;
      const activeDays = new Set(activities.map(a => format(new Date(a.timestamp), 'yyyy-MM-dd'))).size;

      return {
        activityScore: this.calculateActivityScore(activities.length, timeRange),
        engagementScore: this.calculateEngagementScore(uniqueParticipants, activities.length),
        contentQualityScore: this.calculateContentQualityScore(
          messageActivities.length,
          reactionActivities.length,
          editActivities.length
        ),
        consistencyScore: this.calculateConsistencyScore(activeDays, timeRange),
        healthStatus: this.determineHealthStatus(
          activities.length,
          uniqueParticipants,
          messageActivities.length,
          reactionActivities.length
        )
      };
    } catch (error) {
      logger.error('Error getting thread health metrics:', error);
      throw error;
    }
  }

  private calculateActivityScore(totalActivities: number, timeRange: string): number {
    const baseScores = {
      day: 50,
      week: 350,
      month: 1500
    };
    const baseScore = baseScores[timeRange as keyof typeof baseScores] || 350;
    return Math.min(100, (totalActivities / baseScore) * 100);
  }

  private calculateEngagementScore(uniqueParticipants: number, totalActivities: number): number {
    const participationRate = uniqueParticipants / totalActivities;
    return Math.min(100, participationRate * 100);
  }

  private calculateContentQualityScore(
    messageCount: number,
    reactionCount: number,
    editCount: number
  ): number {
    const reactionRatio = reactionCount / messageCount;
    const editRatio = editCount / messageCount;
    return Math.min(100, ((reactionRatio + editRatio) / 2) * 100);
  }

  private calculateConsistencyScore(activeDays: number, timeRange: string): number {
    const expectedDays = {
      day: 1,
      week: 7,
      month: 30
    };
    const expected = expectedDays[timeRange as keyof typeof expectedDays] || 7;
    return Math.min(100, (activeDays / expected) * 100);
  }

  private determineHealthStatus(
    totalActivities: number,
    uniqueParticipants: number,
    messageCount: number,
    reactionCount: number
  ): 'healthy' | 'moderate' | 'needs_attention' | 'inactive' {
    if (totalActivities === 0) return 'inactive';
    
    const activityPerParticipant = totalActivities / uniqueParticipants;
    const reactionRatio = reactionCount / messageCount;

    if (activityPerParticipant >= 5 && reactionRatio >= 0.5) {
      return 'healthy';
    } else if (activityPerParticipant >= 2 && reactionRatio >= 0.2) {
      return 'moderate';
    } else if (activityPerParticipant >= 1) {
      return 'needs_attention';
    } else {
      return 'inactive';
    }
  }
} 