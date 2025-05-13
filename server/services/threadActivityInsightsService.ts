import { prisma } from '../prismaClient';
import { Prisma, ThreadActivity } from '@prisma/client';
import { logger } from '../utils/logger';
import { subDays, subMonths, format, startOfDay, endOfDay } from 'date-fns';

type ActivityWithUser = ThreadActivity & {
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

interface Contributor {
  userId: string;
  totalActivities: number;
  activityTypes: Record<string, number>;
}

interface ActivityTrend {
  period: string;
  count: number;
  type: string;
}

interface PeriodStats {
  total: number;
  byType: Record<string, number>;
  byUser: Record<string, number>;
}

export class ThreadActivityInsightsService {
  async getActivityInsights(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
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

      return {
        topContributors: this.getTopContributors(activities),
        activityTrends: this.getActivityTrends(activities),
        insights: this.generateInsights(activities)
      };
    } catch (error) {
      logger.error('Error getting activity insights:', error);
      throw error;
    }
  }

  async compareActivityPeriods(threadId: string, period1Start: Date, period1End: Date, period2Start: Date, period2End: Date) {
    try {
      const [activities1, activities2] = await Promise.all([
        prisma.threadActivity.findMany({
          where: {
            threadId,
            timestamp: {
              gte: period1Start,
              lte: period1End
            }
          }
        }),
        prisma.threadActivity.findMany({
          where: {
            threadId,
            timestamp: {
              gte: period2Start,
              lte: period2End
            }
          }
        })
      ]);

      if (!activities1 || !activities2) {
        throw new Error('Failed to fetch activities for comparison');
      }

      const period1Stats = this.calculatePeriodStats(activities1);
      const period2Stats = this.calculatePeriodStats(activities2);

      return {
        period1: {
          start: period1Start,
          end: period1End,
          stats: period1Stats
        },
        period2: {
          start: period2Start,
          end: period2End,
          stats: period2Stats
        },
        comparison: this.compareStats(period1Stats, period2Stats)
      };
    } catch (error) {
      logger.error('Error comparing activity periods:', error);
      throw error;
    }
  }

  private getPeriodKey(timestamp: Date): string {
    return format(timestamp, 'yyyy-MM-dd');
  }

  private getMostActiveType(activities: ActivityWithUser[]): string {
    const typeCounts = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
  }

  private getTopContributors(activities: ActivityWithUser[]): Contributor[] {
    const userActivities = activities.reduce((acc, activity) => {
      if (!acc[activity.userId]) {
        acc[activity.userId] = {
          userId: activity.userId,
          totalActivities: 0,
          activityTypes: {}
        };
      }
      acc[activity.userId].totalActivities++;
      acc[activity.userId].activityTypes[activity.type] = (acc[activity.userId].activityTypes[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, Contributor>);

    return Object.values(userActivities)
      .sort((a, b) => b.totalActivities - a.totalActivities)
      .slice(0, 10);
  }

  private getActivityTrends(activities: ActivityWithUser[]): ActivityTrend[] {
    const trends = activities.reduce((acc, activity) => {
      const period = this.getPeriodKey(activity.timestamp);
      if (!acc[period]) {
        acc[period] = { period, count: 0, type: activity.type };
      }
      acc[period].count++;
      return acc;
    }, {} as Record<string, ActivityTrend>);

    return Object.values(trends).sort((a, b) => a.period.localeCompare(b.period));
  }

  private generateInsights(activities: ActivityWithUser[]): Record<string, unknown> {
    try {
      const topContributors = this.getTopContributors(activities);
      const activityTrends = this.getActivityTrends(activities);
      const periodStats = this.calculatePeriodStats(activities);

      return {
        topContributors,
        activityTrends,
        periodStats,
        totalActivities: activities.length,
        uniqueUsers: new Set(activities.map(a => a.userId)).size,
        mostActiveType: this.getMostActiveType(activities)
      };
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw new Error('Failed to generate activity insights');
    }
  }

  private calculatePeriodStats(activities: ActivityWithUser[]): PeriodStats {
    const stats: PeriodStats = {
      total: activities.length,
      byType: {},
      byUser: {}
    };

    activities.forEach(activity => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      stats.byUser[activity.userId] = (stats.byUser[activity.userId] || 0) + 1;
    });

    return stats;
  }

  private compareStats(stats1: PeriodStats, stats2: PeriodStats): Record<string, number> {
    const changes: Record<string, number> = {};
    
    try {
      // Compare total activities
      changes.total = ((stats2.total - stats1.total) / stats1.total) * 100;
      
      // Compare by type
      Object.keys(stats2.byType).forEach(type => {
        const prev = stats1.byType[type] || 0;
        const curr = stats2.byType[type];
        changes[`type_${type}`] = ((curr - prev) / prev) * 100;
      });
      
      // Compare by user
      Object.keys(stats2.byUser).forEach(userId => {
        const prev = stats1.byUser[userId] || 0;
        const curr = stats2.byUser[userId];
        changes[`user_${userId}`] = ((curr - prev) / prev) * 100;
      });
      
      return changes;
    } catch (error) {
      logger.error('Error comparing stats:', error);
      throw new Error('Failed to compare activity statistics');
    }
  }
} 