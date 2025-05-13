import { PrismaClient, Thread, File, Folder, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../prismaClient';
import { SearchAnalyticsService } from './searchAnalyticsService';
import { SearchHistoryService } from './searchHistoryService';
import { SavedSearchService } from './savedSearchService';
import { 
  SearchResult, 
  SearchFilter, 
  SearchHistoryEntry, 
  SavedSearch, 
  SearchAnalytics,
  AnalyticsData,
  SearchTrend,
  UserBehavior
} from '@shared/types/search';

interface SearchResultGroup {
  type: 'thread' | 'file' | 'folder';
  title: string;
  results: SearchResult[];
  count: number;
}

interface SearchResponse {
  results: SearchResult[];
  groups: SearchResultGroup[];
  total: number;
}

interface SearchWhereClause {
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    content?: { contains: string; mode: 'insensitive' };
  }>;
  AND?: Array<{
    type?: { in: string[] };
    createdAt?: { gte?: Date; lte?: Date };
    size?: { gte?: number; lte?: number };
    userId?: string;
    tags?: { hasSome: string[] };
  }>;
}

interface SearchOrderByClause {
  [key: string]: 'asc' | 'desc';
}

export class SearchService {
  private prisma: PrismaClient;
  private analyticsService: SearchAnalyticsService;
  private historyService: SearchHistoryService;
  private savedSearchService: SavedSearchService;
  private readonly MAX_HISTORY_ENTRIES = 100;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
    this.analyticsService = new SearchAnalyticsService();
    this.historyService = new SearchHistoryService(prismaClient);
    this.savedSearchService = new SavedSearchService();
  }

  async search(query: string, filters: SearchFilter = {}, userId: string): Promise<SearchResult[]> {
    try {
      const where: Prisma.ThreadWhereInput = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { messages: { some: { content: { contains: query, mode: 'insensitive' } } } }
        ]
      };

      const threads = await this.prisma.thread.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: true,
          participants: true,
          user: true
        }
      });

      const results = threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        description: thread.content,
        timestamp: thread.updatedAt.toISOString(),
        type: 'thread' as const,
        metadata: {
          author: thread.user.name,
          messageCount: thread.messages.length,
          lastActivity: thread.updatedAt
        },
        score: 1.0
      }));

      // Record search analytics
      await this.analyticsService.trackSearch(userId, query, filters);

      // Add to search history
      await this.historyService.addToHistory(userId, query, filters, results);

      return results;
    } catch (error) {
      logger.error('Error performing search:', error);
      throw error;
    }
  }

  async searchThreads(filters: SearchFilter = {}): Promise<SearchResult[]> {
    try {
      const threads = await this.prisma.thread.findMany({
        where: {
          // Add thread-specific filters here
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: true,
          participants: true,
          user: true
        }
      });

      return threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        description: thread.content,
        timestamp: thread.updatedAt.toISOString(),
        type: 'thread' as const,
        metadata: {
          author: thread.user.name,
          messageCount: thread.messages.length,
          lastActivity: thread.updatedAt
        },
        score: 1.0
      }));
    } catch (error) {
      logger.error('Error searching threads:', error);
      throw error;
    }
  }

  async searchFiles(filters: SearchFilter = {}): Promise<SearchResult[]> {
    try {
      const files = await this.prisma.file.findMany({
        where: {
          // Add file-specific filters here
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: true
        }
      });

      return files.map(file => ({
        id: file.id,
        title: file.name,
        description: '',
        timestamp: file.updatedAt.toISOString(),
        type: 'file' as const,
        metadata: {
          author: file.owner.name,
          size: file.size,
          mimeType: file.mimeType
        },
        score: 1.0
      }));
    } catch (error) {
      logger.error('Error searching files:', error);
      throw error;
    }
  }

  async searchFolders(filters: SearchFilter = {}): Promise<SearchResult[]> {
    try {
      const folders = await this.prisma.folder.findMany({
        where: {
          // Add folder-specific filters here
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: true,
          files: true
        }
      });

      return folders.map(folder => ({
        id: folder.id,
        title: folder.name,
        description: '',
        timestamp: folder.updatedAt.toISOString(),
        type: 'folder' as const,
        metadata: {
          author: folder.owner.name,
          itemCount: folder.files.length,
          lastActivity: folder.updatedAt
        },
        score: 1.0
      }));
    } catch (error) {
      logger.error('Error searching folders:', error);
      throw error;
    }
  }

  private sortByRelevance(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  private applyFilters(filters: SearchFilter): SearchWhereClause {
    const where: SearchWhereClause = {};

    if (filters.type?.length) {
      where.AND = where.AND || [];
      where.AND.push({ type: { in: filters.type } });
    }

    if (filters.dateRange) {
      where.AND = where.AND || [];
      where.AND.push({
        createdAt: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to
        }
      });
    }

    if (filters.size) {
      where.AND = where.AND || [];
      where.AND.push({
        size: {
          gte: filters.size.min,
          lte: filters.size.max
        }
      });
    }

    if (filters.author) {
      where.AND = where.AND || [];
      where.AND.push({ userId: filters.author });
    }

    if (filters.tags?.length) {
      where.AND = where.AND || [];
      where.AND.push({ tags: { hasSome: filters.tags } });
    }

    return where;
  }

  private getSortOptions(filters: SearchFilter): SearchOrderByClause {
    const orderBy: SearchOrderByClause = {};

    switch (filters.sortBy) {
      case 'relevance':
        // Relevance is handled by the sortByRelevance method
        break;
      case 'date':
        orderBy.createdAt = filters.sortOrder || 'desc';
        break;
      case 'name':
        orderBy.title = filters.sortOrder || 'asc';
        break;
      case 'size':
        orderBy.size = filters.sortOrder || 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    return orderBy;
  }

  private calculateRelevance(item: { title: string; content?: string | null }, query: string): number {
    const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
    const contentMatch = item.content?.toLowerCase().includes(query.toLowerCase());
    
    let score = 0;
    if (titleMatch) score += 2;
    if (contentMatch) score += 1;
    
    return score;
  }

  // Search History
  async getSearchHistory(userId: string): Promise<SearchHistoryEntry[]> {
    try {
      const history = await this.prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: this.MAX_HISTORY_ENTRIES
      });

      return history.map((entry: { id: string; query: string; timestamp: Date; resultCount: number; filters: Prisma.JsonValue; userId: string }) => ({
        id: entry.id,
        query: entry.query,
        timestamp: entry.timestamp,
        resultCount: entry.resultCount,
        filters: entry.filters as SearchFilter | undefined,
        userId: entry.userId
      }));
    } catch (error) {
      logger.error('Error in getSearchHistory:', error);
      throw error;
    }
  }

  async clearSearchHistory(userId: string): Promise<void> {
    try {
      await this.historyService.clearHistory(userId);
    } catch (error) {
      logger.error('Error clearing search history:', error);
      throw error;
    }
  }

  async deleteSearchHistoryEntry(userId: string, entryId: string): Promise<void> {
    try {
      await this.historyService.deleteHistoryEntry(userId, entryId);
    } catch (error) {
      logger.error('Error deleting search history entry:', error);
      throw error;
    }
  }

  async updateSearchHistoryEntry(
    userId: string,
    entryId: string,
    updates: Partial<SearchHistoryEntry>
  ): Promise<void> {
    try {
      await this.historyService.updateHistoryEntry(userId, entryId, updates);
    } catch (error) {
      logger.error('Error updating search history entry:', error);
      throw error;
    }
  }

  // Saved Searches
  async saveSearch(userId: string, name: string, query: string, filters: SearchFilter): Promise<SavedSearch> {
    try {
      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          name,
          query,
          filters: filters as unknown as Prisma.InputJsonValue,
          userId
        }
      });

      return {
        id: savedSearch.id,
        name: savedSearch.name,
        query: savedSearch.query,
        filters: savedSearch.filters as SearchFilter | undefined,
        userId: savedSearch.userId,
        createdAt: savedSearch.createdAt,
        updatedAt: savedSearch.updatedAt,
        isDefault: savedSearch.isDefault
      };
    } catch (error) {
      logger.error('Error in saveSearch:', error);
      throw error;
    }
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      return savedSearches.map((search: { id: string; name: string; query: string; filters: Prisma.JsonValue; userId: string; createdAt: Date; updatedAt: Date; isDefault: boolean }) => ({
        id: search.id,
        name: search.name,
        query: search.query,
        filters: search.filters as SearchFilter | undefined,
        userId: search.userId,
        createdAt: search.createdAt,
        updatedAt: search.updatedAt,
        isDefault: search.isDefault
      }));
    } catch (error) {
      logger.error('Error in getSavedSearches:', error);
      throw error;
    }
  }

  async getSavedSearch(userId: string, searchId: string): Promise<SavedSearch | null> {
    try {
      const savedSearch = await this.prisma.savedSearch.findUnique({
        where: {
          id: searchId,
          userId
        }
      });

      if (!savedSearch) return null;

      return {
        id: savedSearch.id,
        name: savedSearch.name,
        query: savedSearch.query,
        filters: savedSearch.filters as SearchFilter,
        userId: savedSearch.userId,
        createdAt: savedSearch.createdAt,
        updatedAt: savedSearch.updatedAt,
        isDefault: savedSearch.isDefault
      };
    } catch (error) {
      logger.error('Error getting saved search:', error);
      throw error;
    }
  }

  async updateSavedSearch(
    userId: string,
    searchId: string,
    updates: Partial<Omit<SavedSearch, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SavedSearch> {
    try {
      const updatedSearch = await this.prisma.savedSearch.update({
        where: {
          id: searchId,
          userId
        },
        data: {
          name: updates.name,
          query: updates.query,
          filters: updates.filters as unknown as Prisma.InputJsonValue,
          isDefault: updates.isDefault
        }
      });

      return {
        id: updatedSearch.id,
        name: updatedSearch.name,
        query: updatedSearch.query,
        filters: updatedSearch.filters as SearchFilter,
        userId: updatedSearch.userId,
        createdAt: updatedSearch.createdAt,
        updatedAt: updatedSearch.updatedAt,
        isDefault: updatedSearch.isDefault
      };
    } catch (error) {
      logger.error('Error updating saved search:', error);
      throw error;
    }
  }

  async deleteSavedSearch(id: string): Promise<void> {
    try {
      await this.prisma.savedSearch.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error in deleteSavedSearch:', error);
      throw error;
    }
  }

  async clearSavedSearches(userId: string): Promise<void> {
    try {
      await this.savedSearchService.clearSavedSearches(userId);
    } catch (error) {
      logger.error('Error clearing saved searches:', error);
      throw error;
    }
  }

  // Search Analytics
  async getSearchAnalytics(): Promise<AnalyticsData> {
    try {
      const analytics = await this.prisma.searchAnalytics.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1000
      });

      const searchAnalytics: SearchAnalytics[] = analytics.map(entry => ({
        id: entry.id,
        query: entry.query,
        timestamp: entry.timestamp,
        resultCount: entry.resultCount,
        filters: entry.filters as SearchFilter | undefined,
        userId: entry.userId
      }));

      const popularSearches = this.aggregatePopularSearches(searchAnalytics);
      const searchTrends = this.analyzeSearchTrends(searchAnalytics);
      const userBehavior = this.analyzeUserBehavior(searchAnalytics);

      return {
        popularSearches,
        searchTrends,
        userBehavior
      };
    } catch (error) {
      logger.error('Error in getSearchAnalytics:', error);
      throw error;
    }
  }

  private aggregatePopularSearches(analytics: SearchAnalytics[]): Array<{ query: string; count: number }> {
    const queryCounts = new Map<string, number>();
    analytics.forEach(entry => {
      const count = queryCounts.get(entry.query) || 0;
      queryCounts.set(entry.query, count + 1);
    });

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private analyzeSearchTrends(analytics: SearchAnalytics[]): SearchTrend[] {
    const trends: SearchTrend[] = [];
    const timeRanges = [
      { name: 'Last 24 hours', hours: 24 },
      { name: 'Last 7 days', hours: 168 },
      { name: 'Last 30 days', hours: 720 }
    ];

    timeRanges.forEach(range => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - range.hours);

      const relevantAnalytics = analytics.filter(a => a.timestamp >= startTime);
      const queryCounts = new Map<string, number>();

      relevantAnalytics.forEach(entry => {
        const count = queryCounts.get(entry.query) || 0;
        queryCounts.set(entry.query, count + 1);
      });

      trends.push({
        timeRange: range.name,
        topQueries: Array.from(queryCounts.entries())
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      });
    });

    return trends;
  }

  private analyzeUserBehavior(analytics: SearchAnalytics[]): UserBehavior {
    const behavior: UserBehavior = {
      averageResultsPerQuery: 0,
      commonFilters: [],
      timeOfDay: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
    };

    let totalResults = 0;
    const filterCounts = new Map<string, number>();

    analytics.forEach(entry => {
      totalResults += entry.resultCount;
      const hour = new Date(entry.timestamp).getHours();
      behavior.timeOfDay[hour].count++;

      if (entry.filters) {
        Object.entries(entry.filters).forEach(([key, value]) => {
          if (value) {
            const count = filterCounts.get(key) || 0;
            filterCounts.set(key, count + 1);
          }
        });
      }
    });

    behavior.averageResultsPerQuery = totalResults / analytics.length;
    behavior.commonFilters = Array.from(filterCounts.entries())
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return behavior;
  }

  async clearSearchAnalytics(userId: string): Promise<void> {
    try {
      await this.analyticsService.clearAnalytics(userId);
    } catch (error) {
      logger.error('Error clearing search analytics:', error);
      throw error;
    }
  }
} 