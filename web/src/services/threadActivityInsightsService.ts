import { PrismaClient } from '@prisma/client';
import { ThreadActivity, ActivityTimeline } from '../types/analytics';
import { handleApiError } from '../utils/error-handler';

interface ContributorStats {
  userId: string;
  totalActivities: number;
  activityTypes: {
    view: number;
    comment: number;
    like: number;
    share: number;
  };
}

interface ActivityTrend {
  period: string;
  count: number;
  type: ThreadActivity['type'];
}

interface PeriodStats {
  totalActivities: number;
  uniqueUsers: number;
  activityTypes: Record<ThreadActivity['type'], number>;
  averageTimeBetweenActivities: number;
}

export class ThreadActivityInsightsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getActivityInsights(threadId: string) {
    try {
      const activities = await this.prisma.threadActivity.findMany({
        where: { threadId },
        orderBy: { timestamp: 'desc' }
      });

      // Cast activities to ThreadActivity[] after validating types
      const typedActivities = activities.map(activity => ({
        ...activity,
        type: activity.type as ThreadActivity['type'],
        metadata: activity.metadata as Record<string, unknown> | undefined
      }));

      const topContributors = this.getTopContributors(typedActivities);
      const activityTrends = this.getActivityTrends(typedActivities);
      const insights = this.generateInsights(typedActivities);
      const periodStats = this.calculatePeriodStats(typedActivities);

      return {
        topContributors,
        activityTrends,
        insights,
        periodStats
      };
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to get activity insights'
      });
    }
  }

  private getTopContributors(activities: ThreadActivity[]): ContributorStats[] {
    const contributorMap = new Map<string, ContributorStats>();

    for (const activity of activities) {
      const existing = contributorMap.get(activity.userId) || {
        userId: activity.userId,
        totalActivities: 0,
        activityTypes: {
          view: 0,
          comment: 0,
          like: 0,
          share: 0
        }
      };

      existing.totalActivities++;
      existing.activityTypes[activity.type]++;

      contributorMap.set(activity.userId, existing);
    }

    return Array.from(contributorMap.values())
      .sort((a, b) => b.totalActivities - a.totalActivities)
      .slice(0, 10);
  }

  private getActivityTrends(activities: ThreadActivity[]): ActivityTrend[] {
    const trends: ActivityTrend[] = [];
    const periodMap = new Map<string, Map<ThreadActivity['type'], number>>();

    for (const activity of activities) {
      const period = activity.timestamp.toISOString().split('T')[0];
      const periodData = periodMap.get(period) || new Map();
      const count = periodData.get(activity.type) || 0;
      periodData.set(activity.type, count + 1);
      periodMap.set(period, periodData);
    }

    // Convert Map to Array for iteration
    const periodEntries = Array.from(periodMap.entries());
    for (const [period, typeMap] of periodEntries) {
      const typeEntries = Array.from(typeMap.entries());
      for (const [type, count] of typeEntries) {
        trends.push({ period, type, count });
      }
    }

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private generateInsights(activities: ThreadActivity[]): string[] {
    const insights: string[] = [];
    const totalActivities = activities.length;
    const uniqueUsers = new Set(activities.map(a => a.userId)).size;

    if (totalActivities > 0) {
      insights.push(`Total activities: ${totalActivities}`);
      insights.push(`Unique participants: ${uniqueUsers}`);
      
      const activityTypes = activities.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {} as Record<ThreadActivity['type'], number>);

      for (const [type, count] of Object.entries(activityTypes)) {
        const percentage = ((count / totalActivities) * 100).toFixed(1);
        insights.push(`${type}: ${count} (${percentage}%)`);
      }
    }

    return insights;
  }

  private calculatePeriodStats(activities: ThreadActivity[]): PeriodStats {
    const stats: PeriodStats = {
      totalActivities: activities.length,
      uniqueUsers: new Set(activities.map(a => a.userId)).size,
      activityTypes: {
        view: 0,
        comment: 0,
        like: 0,
        share: 0
      },
      averageTimeBetweenActivities: 0
    };

    // Calculate activity type counts
    for (const activity of activities) {
      stats.activityTypes[activity.type]++;
    }

    // Calculate average time between activities
    if (activities.length > 1) {
      let totalTimeDiff = 0;
      for (let i = 1; i < activities.length; i++) {
        totalTimeDiff += activities[i].timestamp.getTime() - activities[i - 1].timestamp.getTime();
      }
      stats.averageTimeBetweenActivities = totalTimeDiff / (activities.length - 1);
    }

    return stats;
  }

  private compareStats(stats1: PeriodStats, stats2: PeriodStats): Record<string, number> {
    return {
      activityChange: stats2.totalActivities - stats1.totalActivities,
      userChange: stats2.uniqueUsers - stats1.uniqueUsers,
      timeChange: stats2.averageTimeBetweenActivities - stats1.averageTimeBetweenActivities
    };
  }
} 