import { PrismaClient, Prisma } from '@prisma/client';
import { SearchAnalytics, SearchFilter, AnalyticsData, SearchTrend, UserBehavior } from '@shared/types/search';
import { logger } from '../utils/logger';
import { prisma } from '../prismaClient';

export class SearchAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async trackSearch(userId: string, query: string, filters: SearchFilter): Promise<void> {
    try {
      await this.prisma.searchAnalytics.create({
        data: {
          userId,
          query,
          filters: filters as unknown as Prisma.InputJsonValue,
          timestamp: new Date(),
          resultCount: 0 // Default value, will be updated when results are available
        }
      });
    } catch (error) {
      logger.error('Error tracking search:', error);
      throw error;
    }
  }

  async getAnalytics(userId: string): Promise<AnalyticsData> {
    try {
      const [popularSearches, searchTrends, userBehavior] = await Promise.all([
        this.getPopularSearches(userId),
        this.getSearchTrends(userId),
        this.getUserBehavior(userId)
      ]);

      return {
        popularSearches,
        searchTrends,
        userBehavior
      };
    } catch (error) {
      logger.error('Error getting search analytics:', error);
      throw error;
    }
  }

  private async getPopularSearches(userId: string): Promise<Array<{ query: string; count: number }>> {
    const searches = await this.prisma.searchAnalytics.groupBy({
      by: ['query'],
      where: { userId },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    });

    return searches.map(search => ({
      query: search.query,
      count: search._count.query
    }));
  }

  private async getSearchTrends(userId: string): Promise<SearchTrend[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searches = await this.prisma.searchAnalytics.findMany({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo }
      },
      select: {
        query: true,
        timestamp: true
      }
    });

    const timeRanges = [
      { name: 'Last 24 hours', hours: 24 },
      { name: 'Last 7 days', hours: 168 },
      { name: 'Last 30 days', hours: 720 }
    ];

    return timeRanges.map(range => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - range.hours);

      const relevantSearches = searches.filter(s => s.timestamp >= startTime);
      const queryCounts = new Map<string, number>();

      relevantSearches.forEach(search => {
        const count = queryCounts.get(search.query) || 0;
        queryCounts.set(search.query, count + 1);
      });

      return {
        timeRange: range.name,
        topQueries: Array.from(queryCounts.entries())
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      };
    });
  }

  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    const searches = await this.prisma.searchAnalytics.findMany({
      where: { userId },
      select: {
        query: true,
        filters: true,
        timestamp: true,
        resultCount: true
      }
    });

    const totalResults = searches.reduce((acc, search) => acc + search.resultCount, 0);
    const averageResultsPerQuery = totalResults / searches.length;

    const filterCounts = new Map<string, number>();
    searches.forEach(search => {
      const filters = search.filters as unknown as SearchFilter;
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          filterCounts.set(key, (filterCounts.get(key) || 0) + 1);
        }
      });
    });

    const timeOfDayCounts = new Map<number, number>();
    searches.forEach(search => {
      const hour = search.timestamp.getHours();
      timeOfDayCounts.set(hour, (timeOfDayCounts.get(hour) || 0) + 1);
    });

    return {
      averageResultsPerQuery,
      commonFilters: Array.from(filterCounts.entries())
        .map(([filter, count]) => ({ filter, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      timeOfDay: Array.from(timeOfDayCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour)
    };
  }

  async clearAnalytics(userId: string): Promise<void> {
    try {
      await this.prisma.searchAnalytics.deleteMany({
        where: { userId }
      });
    } catch (error) {
      logger.error('Error clearing search analytics:', error);
      throw error;
    }
  }
} 