import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface ContentPerformanceMetrics {
  threadId: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  lastUpdated: Date;
  totalViews: number;
  uniqueViews: number;
  averageTimeSpent: number;
  engagementRate: number;
  completionRate: number;
  bounceRate: number;
  topReferrers: { source: string; count: number }[];
  userSegments: { segment: string; count: number }[];
  deviceTypes: { type: string; count: number }[];
  geographicData: { country: string; count: number }[];
  timeSeries: { date: Date; views: number; engagement: number }[];
}

// Minimal interfaces for local use
interface View {
  userId: string;
  timeSpent?: number;
  completed?: boolean;
  referrer?: string;
  user?: { segment?: string };
  device?: { type?: string };
  location?: { country?: string };
  createdAt: Date;
}

interface Engagement {
  createdAt: Date;
  score: number;
}

export class ContentPerformanceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getThreadPerformance(threadId: string): Promise<ContentPerformanceMetrics> {
    try {
      const thread = await this.prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          creator: true,
          messages: true,
          analytics: true,
          participants: true
        }
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      // TODO: Replace with actual views/engagements when available in schema
      const views: View[] = [];
      const engagement: Engagement[] = [];

      const uniqueViews = new Set(views.map(v => v.userId)).size;
      const totalTimeSpent = views.reduce((acc, view) => acc + (view.timeSpent || 0), 0);
      const averageTimeSpent = views.length > 0 ? totalTimeSpent / views.length : 0;

      const engagementRate = this.calculateEngagementRate(engagement);
      const completionRate = this.calculateCompletionRate(views);
      const bounceRate = this.calculateBounceRate(views);

      const topReferrers = this.getTopReferrers(views);
      const userSegments = this.getUserSegments(views);
      const deviceTypes = this.getDeviceTypes(views);
      const geographicData = this.getGeographicData(views);
      const timeSeries = this.getTimeSeries(views, engagement);

      return {
        threadId: thread.id,
        title: thread.title,
        authorId: thread.creatorId,
        authorName: thread.creator?.name ?? "Unknown",
        createdAt: thread.createdAt,
        lastUpdated: thread.updatedAt,
        totalViews: views.length,
        uniqueViews,
        averageTimeSpent,
        engagementRate,
        completionRate,
        bounceRate,
        topReferrers,
        userSegments,
        deviceTypes,
        geographicData,
        timeSeries
      };
    } catch (error) {
      logger.error('Error getting thread performance:', error);
      throw error;
    }
  }

  async getTopPerformingThreads(limit: number = 10): Promise<ContentPerformanceMetrics[]> {
    try {
      const threads = await this.prisma.thread.findMany({
        include: {
          creator: true,
          messages: true,
          analytics: true,
          participants: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      // TODO: Add proper Thread type for threads if needed
      return Promise.all(threads.map(thread => this.getThreadPerformance(thread.id)));
    } catch (error) {
      logger.error('Error getting top performing threads:', error);
      throw error;
    }
  }

  private calculateEngagementRate(engagement: Engagement[]): number {
    if (!engagement.length) return 0;
    const totalEngagement = engagement.reduce((acc, e) => acc + e.score, 0);
    return totalEngagement / engagement.length;
  }

  private calculateCompletionRate(views: View[]): number {
    if (!views.length) return 0;
    const completedViews = views.filter(v => v.completed).length;
    return completedViews / views.length;
  }

  private calculateBounceRate(views: View[]): number {
    if (!views.length) return 0;
    const bouncedViews = views.filter(v => (v.timeSpent ?? 0) < 10).length;
    return bouncedViews / views.length;
  }

  private getTopReferrers(views: View[]): { source: string; count: number }[] {
    const referrerCounts = new Map<string, number>();
    views.forEach(view => {
      const source = view.referrer || 'Direct';
      referrerCounts.set(source, (referrerCounts.get(source) || 0) + 1);
    });
    return Array.from(referrerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
  }

  private getUserSegments(views: View[]): { segment: string; count: number }[] {
    const segmentCounts = new Map<string, number>();
    views.forEach(view => {
      const segment = view.user?.segment || 'Unknown';
      segmentCounts.set(segment, (segmentCounts.get(segment) || 0) + 1);
    });
    return Array.from(segmentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([segment, count]) => ({ segment, count }));
  }

  private getDeviceTypes(views: View[]): { type: string; count: number }[] {
    const deviceCounts = new Map<string, number>();
    views.forEach(view => {
      const type = view.device?.type || 'Unknown';
      deviceCounts.set(type, (deviceCounts.get(type) || 0) + 1);
    });
    return Array.from(deviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  }

  private getGeographicData(views: View[]): { country: string; count: number }[] {
    const countryCounts = new Map<string, number>();
    views.forEach(view => {
      const country = view.location?.country || 'Unknown';
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    });
    return Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  }

  private getTimeSeries(views: View[], engagement: Engagement[]): { date: Date; views: number; engagement: number }[] {
    const dateMap = new Map<string, { views: number; engagement: number }>();
    
    views.forEach(view => {
      const date = view.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(date) || { views: 0, engagement: 0 };
      dateMap.set(date, { ...current, views: current.views + 1 });
    });

    engagement.forEach(e => {
      const date = e.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(date) || { views: 0, engagement: 0 };
      dateMap.set(date, { ...current, engagement: current.engagement + e.score });
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date),
        views: data.views,
        engagement: data.engagement
      }));
  }
} 