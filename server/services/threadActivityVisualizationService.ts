import { prisma } from '../prismaClient';
import { ThreadActivity, ActivityType } from '@prisma/client';
import { logger } from '../utils/logger';
import { subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval, startOfDay, endOfDay } from 'date-fns';

export class ThreadActivityVisualizationService {
  async getUserActivitySummary(
    userId: string,
    days: number = 30
  ): Promise<{
    dailyActivity: Array<{ date: string; count: number }>;
    activityTypes: Array<{ type: string; count: number }>;
    topThreads: Array<{ threadId: string; title: string; count: number }>;
    participationRate: number;
  }> {
    try {
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get all activities for the user in the date range
      const activities = await prisma.threadActivity.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          thread: true
        }
      });

      // Calculate daily activity
      const dailyActivity = this.calculateDailyActivity(activities, startDate, endDate);

      // Calculate activity types distribution
      const activityTypes = this.calculateActivityTypes(activities);

      // Calculate top threads
      const topThreads = this.calculateTopThreads(activities);

      // Calculate participation rate
      const participationRate = this.calculateParticipationRate(activities, days);

      return {
        dailyActivity,
        activityTypes,
        topThreads,
        participationRate
      };
    } catch (error) {
      logger.error('Error getting user activity summary:', error);
      throw error;
    }
  }

  async getThreadActivitySummary(
    threadId: string,
    days: number = 30
  ): Promise<{
    dailyActivity: Array<{ date: string; count: number }>;
    activityTypes: Array<{ type: string; count: number }>;
    topUsers: Array<{ userId: string; name: string; count: number }>;
    engagementRate: number;
  }> {
    try {
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get all activities for the thread in the date range
      const activities = await prisma.threadActivity.findMany({
        where: {
          threadId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Calculate daily activity
      const dailyActivity = this.calculateDailyActivity(activities, startDate, endDate);

      // Calculate activity types distribution
      const activityTypes = this.calculateActivityTypes(activities);

      // Calculate top users
      const topUsers = this.calculateTopUsers(activities);

      // Calculate engagement rate
      const engagementRate = this.calculateEngagementRate(activities, days);

      return {
        dailyActivity,
        activityTypes,
        topUsers,
        engagementRate
      };
    } catch (error) {
      logger.error('Error getting thread activity summary:', error);
      throw error;
    }
  }

  private calculateDailyActivity(
    activities: ThreadActivity[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; count: number }> {
    const dailyCounts = new Map<string, number>();
    let currentDate = startDate;

    while (currentDate <= endDate) {
      dailyCounts.set(currentDate.toISOString().split('T')[0], 0);
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    activities.forEach(activity => {
      const date = activity.timestamp.toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    return Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count
    }));
  }

  private calculateActivityTypes(activities: ThreadActivity[]): Array<{ type: string; count: number }> {
    const typeCounts = new Map<string, number>();

    activities.forEach(activity => {
      typeCounts.set(activity.type, (typeCounts.get(activity.type) || 0) + 1);
    });

    return Array.from(typeCounts.entries()).map(([type, count]) => ({
      type,
      count
    }));
  }

  private calculateTopThreads(
    activities: (ThreadActivity & { thread: { title: string } })[]
  ): Array<{ threadId: string; title: string; count: number }> {
    const threadCounts = new Map<string, { title: string; count: number }>();

    activities.forEach(activity => {
      const existing = threadCounts.get(activity.threadId) || { title: activity.thread.title, count: 0 };
      threadCounts.set(activity.threadId, {
        title: existing.title,
        count: existing.count + 1
      });
    });

    return Array.from(threadCounts.entries())
      .map(([threadId, { title, count }]) => ({
        threadId,
        title,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateTopUsers(
    activities: (ThreadActivity & { user: { id: string; name: string } })[]
  ): Array<{ userId: string; name: string; count: number }> {
    const userCounts = new Map<string, { name: string; count: number }>();

    activities.forEach(activity => {
      const existing = userCounts.get(activity.userId) || { name: activity.user.name, count: 0 };
      userCounts.set(activity.userId, {
        name: existing.name,
        count: existing.count + 1
      });
    });

    return Array.from(userCounts.entries())
      .map(([userId, { name, count }]) => ({
        userId,
        name,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateParticipationRate(activities: ThreadActivity[], days: number): number {
    const uniqueDays = new Set(
      activities.map(activity => activity.timestamp.toISOString().split('T')[0])
    );
    return (uniqueDays.size / days) * 100;
  }

  private calculateEngagementRate(activities: ThreadActivity[], days: number): number {
    const uniqueUsers = new Set(activities.map(activity => activity.userId));
    const totalUsers = activities.length;
    return (uniqueUsers.size / totalUsers) * 100;
  }

  async getActivityTimeline(
    threadId: string,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    timeline: Array<{
      timestamp: string;
      activities: Array<{
        type: ActivityType;
        userId: string;
        userName: string;
        userAvatar: string;
      }>;
      count: number;
    }>;
    activityTypes: Array<{
      type: ActivityType;
      count: number;
      percentage: number;
    }>;
    userParticipation: Array<{
      userId: string;
      userName: string;
      userAvatar: string;
      activityCount: number;
      activityTypes: Record<ActivityType, number>;
    }>;
  }> {
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
              avatar: true
            }
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      const timeline = this.generateTimelineData(activities, timeRange);
      const activityTypes = this.getActivityTypeDistribution(activities);
      const userParticipation = this.getUserParticipationData(activities);

      return {
        timeline,
        activityTypes,
        userParticipation
      };
    } catch (error) {
      logger.error('Error getting activity timeline:', error);
      throw error;
    }
  }

  async getActivityHeatmap(
    threadId: string,
    timeRange: 'week' | 'month' = 'week'
  ): Promise<{
    heatmap: number[][];
    days: string[];
    hours: string[];
  }> {
    try {
      const now = new Date();
      const startDate = timeRange === 'week' ? subDays(now, 7) : subMonths(now, 1);

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

      return this.generateHeatmapData(activities, timeRange);
    } catch (error) {
      logger.error('Error getting activity heatmap:', error);
      throw error;
    }
  }

  async getActivityMetrics(
    threadId: string,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalActivities: number;
    uniqueParticipants: number;
    activityRate: number;
    engagementScore: number;
    activityTrend: 'increasing' | 'decreasing' | 'stable';
  }> {
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

      return {
        totalActivities: activities.length,
        uniqueParticipants: this.getUniqueParticipants(activities),
        activityRate: this.calculateActivityRate(activities, timeRange),
        engagementScore: this.calculateEngagementScore(activities),
        activityTrend: this.calculateActivityTrend(activities)
      };
    } catch (error) {
      logger.error('Error getting activity metrics:', error);
      throw error;
    }
  }

  private generateTimelineData(activities: any[], timeRange: string) {
    const timeline: Record<string, any> = {};
    const timeFormat = timeRange === 'day' ? 'HH:mm' : 'yyyy-MM-dd';

    activities.forEach(activity => {
      const timestamp = format(activity.timestamp, timeFormat);
      if (!timeline[timestamp]) {
        timeline[timestamp] = {
          timestamp,
          activities: [],
          count: 0
        };
      }
      timeline[timestamp].activities.push({
        type: activity.type,
        userId: activity.user.id,
        userName: activity.user.name,
        userAvatar: activity.user.avatar
      });
      timeline[timestamp].count++;
    });

    return Object.values(timeline);
  }

  private getActivityTypeDistribution(activities: any[]) {
    const distribution: Record<string, number> = {};

    activities.forEach(activity => {
      distribution[activity.type] = (distribution[activity.type] || 0) + 1;
    });

    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: (count / activities.length) * 100
    }));
  }

  private getUserParticipationData(activities: any[]) {
    const userData: Record<string, any> = {};

    activities.forEach(activity => {
      if (!userData[activity.user.id]) {
        userData[activity.user.id] = {
          userId: activity.user.id,
          userName: activity.user.name,
          userAvatar: activity.user.avatar,
          activityCount: 0,
          activityTypes: {}
        };
      }
      userData[activity.user.id].activityCount++;
      userData[activity.user.id].activityTypes[activity.type] = 
        (userData[activity.user.id].activityTypes[activity.type] || 0) + 1;
    });

    return Object.values(userData).sort((a, b) => b.activityCount - a.activityCount);
  }

  private generateHeatmapData(activities: any[], timeRange: string) {
    const days = timeRange === 'week' ? 7 : 30;
    const hours = 24;
    const heatmap: number[][] = Array(days).fill(0).map(() => Array(hours).fill(0));

    activities.forEach(activity => {
      const day = Math.floor(
        (activity.timestamp.getTime() - subDays(new Date(), days).getTime()) / (24 * 60 * 60 * 1000)
      );
      const hour = activity.timestamp.getHours();

      if (day >= 0 && day < days) {
        heatmap[day][hour]++;
      }
    });

    const dayLabels = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - i - 1);
      return format(date, 'EEE');
    });

    const hourLabels = Array.from({ length: hours }, (_, i) => {
      return format(new Date().setHours(i, 0, 0, 0), 'HH:mm');
    });

    return {
      heatmap,
      days: dayLabels,
      hours: hourLabels
    };
  }

  private getUniqueParticipants(activities: any[]) {
    return new Set(activities.map(a => a.userId)).size;
  }

  private calculateActivityRate(activities: any[], timeRange: string) {
    const hours = timeRange === 'day' ? 24 : timeRange === 'week' ? 168 : 720;
    return activities.length / hours;
  }

  private calculateEngagementScore(activities: any[]) {
    const uniqueParticipants = this.getUniqueParticipants(activities);
    const activityCount = activities.length;
    const activityTypes = new Set(activities.map(a => a.type)).size;

    return (uniqueParticipants * 0.4) + (activityCount * 0.4) + (activityTypes * 0.2);
  }

  private calculateActivityTrend(activities: any[]) {
    if (activities.length < 2) return 'stable';

    const firstHalf = activities.slice(0, Math.floor(activities.length / 2));
    const secondHalf = activities.slice(Math.floor(activities.length / 2));

    const firstHalfRate = firstHalf.length / (firstHalf.length + secondHalf.length);
    const secondHalfRate = secondHalf.length / (firstHalf.length + secondHalf.length);

    const difference = secondHalfRate - firstHalfRate;
    const threshold = 0.1;

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  async getActivityDistribution(threadId: string) {
    try {
      const activities = await prisma.threadActivity.groupBy({
        by: ['type'],
        where: { threadId },
        _count: {
          type: true
        }
      });

      return activities.map(activity => ({
        type: activity.type,
        count: activity._count.type
      }));
    } catch (error) {
      logger.error('Error getting activity distribution:', error);
      throw error;
    }
  }

  async getTopParticipants(threadId: string, limit: number = 5) {
    try {
      const participants = await prisma.threadActivity.groupBy({
        by: ['userId'],
        where: { threadId },
        _count: {
          userId: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: limit
      });

      const users = await prisma.user.findMany({
        where: {
          id: {
            in: participants.map(p => p.userId)
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      });

      return participants.map(participant => {
        const user = users.find(u => u.id === participant.userId);
        return {
          user,
          activityCount: participant._count.userId
        };
      });
    } catch (error) {
      logger.error('Error getting top participants:', error);
      throw error;
    }
  }

  async getActivityHeatmap(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
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
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Create a heatmap data structure
      const heatmap = activities.reduce((acc, activity) => {
        const date = new Date(activity.createdAt);
        const day = format(date, 'yyyy-MM-dd');
        const hour = format(date, 'HH:00');

        if (!acc[day]) {
          acc[day] = {};
        }
        if (!acc[day][hour]) {
          acc[day][hour] = 0;
        }
        acc[day][hour]++;

        return acc;
      }, {} as Record<string, Record<string, number>>);

      return heatmap;
    } catch (error) {
      logger.error('Error getting activity heatmap:', error);
      throw error;
    }
  }

  async getActivityTrends(threadId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
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
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Calculate trends for each activity type
      const trends = activities.reduce((acc, activity) => {
        const date = format(new Date(activity.createdAt), 'yyyy-MM-dd');
        
        if (!acc[activity.type]) {
          acc[activity.type] = {};
        }
        if (!acc[activity.type][date]) {
          acc[activity.type][date] = 0;
        }
        acc[activity.type][date]++;

        return acc;
      }, {} as Record<string, Record<string, number>>);

      return trends;
    } catch (error) {
      logger.error('Error getting activity trends:', error);
      throw error;
    }
  }

  async getActivityInsights(
    userId: string,
    threadId: string,
    timeRange: 'day' | 'week' | 'month' | 'year' = 'week'
  ) {
    try {
      const startDate = this.getStartDate(timeRange);
      const activities = await this.getActivities(userId, threadId, startDate);

      return {
        activityCount: activities.length,
        activityTypes: this.getActivityTypeDistribution(activities),
        activityTimeline: this.getActivityTimeline(activities, timeRange),
        topParticipants: await this.getTopParticipants(activities),
        peakActivityTimes: this.getPeakActivityTimes(activities),
        engagementMetrics: this.calculateEngagementMetrics(activities)
      };
    } catch (error) {
      logger.error('Error getting activity insights:', error);
      throw error;
    }
  }

  async getUserActivityInsights(
    userId: string,
    timeRange: 'day' | 'week' | 'month' | 'year' = 'week'
  ) {
    try {
      const startDate = this.getStartDate(timeRange);
      const activities = await this.getUserActivities(userId, startDate);

      return {
        totalActivity: activities.length,
        threadDistribution: await this.getThreadDistribution(activities),
        activityTypes: this.getActivityTypeDistribution(activities),
        activityTimeline: this.getActivityTimeline(activities, timeRange),
        engagementMetrics: this.calculateEngagementMetrics(activities)
      };
    } catch (error) {
      logger.error('Error getting user activity insights:', error);
      throw error;
    }
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return subDays(now, 1);
      case 'week':
        return subDays(now, 7);
      case 'month':
        return subMonths(now, 1);
      case 'year':
        return subMonths(now, 12);
      default:
        return subDays(now, 7);
    }
  }

  private async getActivities(
    userId: string,
    threadId: string,
    startDate: Date
  ): Promise<ThreadActivity[]> {
    return prisma.threadActivity.findMany({
      where: {
        threadId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  private async getUserActivities(
    userId: string,
    startDate: Date
  ): Promise<ThreadActivity[]> {
    return prisma.threadActivity.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        thread: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  private getActivityTypeDistribution(activities: ThreadActivity[]) {
    const distribution: Record<string, number> = {};
    activities.forEach(activity => {
      distribution[activity.type] = (distribution[activity.type] || 0) + 1;
    });
    return distribution;
  }

  private getActivityTimeline(
    activities: ThreadActivity[],
    timeRange: string
  ) {
    const timeline: Record<string, number> = {};
    activities.forEach(activity => {
      const date = format(activity.createdAt, this.getDateFormat(timeRange));
      timeline[date] = (timeline[date] || 0) + 1;
    });
    return timeline;
  }

  private getDateFormat(timeRange: string): string {
    switch (timeRange) {
      case 'day':
        return 'HH:mm';
      case 'week':
        return 'yyyy-MM-dd';
      case 'month':
        return 'yyyy-MM-dd';
      case 'year':
        return 'yyyy-MM';
      default:
        return 'yyyy-MM-dd';
    }
  }

  private async getTopParticipants(activities: ThreadActivity[]) {
    const participantCount: Record<string, number> = {};
    activities.forEach(activity => {
      const userId = activity.userId;
      participantCount[userId] = (participantCount[userId] || 0) + 1;
    });

    const topParticipants = Object.entries(participantCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return Promise.all(
      topParticipants.map(async ([userId, count]) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true
          }
        });
        return {
          user,
          activityCount: count
        };
      })
    );
  }

  private getPeakActivityTimes(activities: ThreadActivity[]) {
    const hourDistribution: Record<number, number> = {};
    activities.forEach(activity => {
      const hour = activity.createdAt.getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });

    return Object.entries(hourDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      }));
  }

  private calculateEngagementMetrics(activities: ThreadActivity[]) {
    const messageCount = activities.filter(
      a => a.type === ActivityType.MESSAGE_CREATED
    ).length;
    const reactionCount = activities.filter(
      a => a.type === ActivityType.REACTION_ADDED
    ).length;
    const editCount = activities.filter(
      a => a.type === ActivityType.CONTENT_EDITED
    ).length;

    return {
      messageCount,
      reactionCount,
      editCount,
      totalEngagement: messageCount + reactionCount + editCount
    };
  }

  private async getThreadDistribution(activities: ThreadActivity[]) {
    const threadDistribution: Record<string, number> = {};
    activities.forEach(activity => {
      const threadId = activity.threadId;
      threadDistribution[threadId] = (threadDistribution[threadId] || 0) + 1;
    });

    const topThreads = Object.entries(threadDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return Promise.all(
      topThreads.map(async ([threadId, count]) => {
        const thread = await prisma.thread.findUnique({
          where: { id: threadId },
          select: {
            id: true,
            title: true
          }
        });
        return {
          thread,
          activityCount: count
        };
      })
    );
  }

  async getActivityVisualization(userId: string, timeRange: string) {
    try {
      const [timeline, heatmap, metrics] = await Promise.all([
        this.getActivityTimeline(userId, timeRange),
        this.getActivityHeatmap(userId, timeRange),
        this.getActivityMetrics(userId, timeRange)
      ]);

      return {
        timeline,
        heatmap,
        metrics
      };
    } catch (error) {
      logger.error('Error getting activity visualization:', error);
      throw error;
    }
  }

  async getActivityTimeline(userId: string, timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      const activities = await prisma.activity.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const timelineData = this.groupActivitiesByTime(activities, timeRange);
      return this.formatTimelineData(timelineData);
    } catch (error) {
      logger.error('Error getting activity timeline:', error);
      throw error;
    }
  }

  async getActivityHeatmap(userId: string, timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      const activities = await prisma.activity.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const heatmapData = this.groupActivitiesByDayAndHour(activities);
      return this.formatHeatmapData(heatmapData);
    } catch (error) {
      logger.error('Error getting activity heatmap:', error);
      throw error;
    }
  }

  async getActivityMetrics(userId: string, timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      const [totalMessages, activeParticipants, averageResponseTime] = await Promise.all([
        this.getTotalMessages(userId, startDate, endDate),
        this.getActiveParticipants(userId, startDate, endDate),
        this.getAverageResponseTime(userId, startDate, endDate)
      ]);

      const previousPeriod = this.getPreviousPeriod(startDate, endDate);
      const [previousMessages, previousParticipants] = await Promise.all([
        this.getTotalMessages(userId, previousPeriod.startDate, previousPeriod.endDate),
        this.getActiveParticipants(userId, previousPeriod.startDate, previousPeriod.endDate)
      ]);

      const messageGrowth = this.calculateGrowth(totalMessages, previousMessages);
      const participantGrowth = this.calculateGrowth(activeParticipants, previousParticipants);

      return {
        totalMessages,
        activeParticipants,
        averageResponseTime,
        messageGrowth,
        participantGrowth
      };
    } catch (error) {
      logger.error('Error getting activity metrics:', error);
      throw error;
    }
  }

  private getDateRange(timeRange: string) {
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
        startDate = subDays(now, 30);
        break;
      default:
        startDate = subDays(now, 7);
    }

    return {
      startDate: startOfDay(startDate),
      endDate: endOfDay(now)
    };
  }

  private groupActivitiesByTime(activities: any[], timeRange: string) {
    const grouped: Record<string, number> = {};

    activities.forEach(activity => {
      const date = new Date(activity.createdAt);
      let key: string;

      switch (timeRange) {
        case 'day':
          key = format(date, 'HH:mm');
          break;
        case 'week':
          key = format(date, 'EEE');
          break;
        case 'month':
          key = format(date, 'MMM dd');
          break;
        default:
          key = format(date, 'HH:mm');
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }

  private formatTimelineData(data: Record<string, number>) {
    return {
      labels: Object.keys(data),
      datasets: [{
        label: 'Activity',
        data: Object.values(data),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)'
      }]
    };
  }

  private groupActivitiesByDayAndHour(activities: any[]) {
    const grouped: Record<string, Record<string, number>> = {};

    activities.forEach(activity => {
      const date = new Date(activity.createdAt);
      const day = format(date, 'EEE');
      const hour = format(date, 'HH:00');

      if (!grouped[day]) {
        grouped[day] = {};
      }

      grouped[day][hour] = (grouped[day][hour] || 0) + 1;
    });

    return grouped;
  }

  private formatHeatmapData(data: Record<string, Record<string, number>>) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    const heatmapData = days.map(day => 
      hours.map(hour => data[day]?.[hour] || 0)
    );

    return {
      xLabels: hours,
      yLabels: days,
      data: heatmapData
    };
  }

  private async getTotalMessages(userId: string, startDate: Date, endDate: Date) {
    return prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  private async getActiveParticipants(userId: string, startDate: Date, endDate: Date) {
    const threads = await prisma.thread.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      select: {
        id: true
      }
    });

    const threadIds = threads.map(thread => thread.id);

    return prisma.threadParticipant.count({
      where: {
        threadId: {
          in: threadIds
        },
        lastActiveAt: {
          gte: startDate,
          lte: endDate
        }
      },
      distinct: ['userId']
    });
  }

  private async getAverageResponseTime(userId: string, startDate: Date, endDate: Date) {
    const messages = await prisma.message.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (messages.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = messages[i].createdAt.getTime() - messages[i-1].createdAt.getTime();
      totalTime += timeDiff;
    }

    return Math.round(totalTime / (messages.length - 1) / 60000); // Convert to minutes
  }

  private getPreviousPeriod(startDate: Date, endDate: Date) {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: startDate
    };
  }

  private calculateGrowth(current: number, previous: number) {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }
} 