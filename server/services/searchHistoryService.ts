import { PrismaClient, Prisma } from '@prisma/client';
import { SearchHistoryEntry, SearchFilter, SearchResult } from '@shared/types/search';
import { logger } from '../utils/logger';

export class SearchHistoryService {
  private prisma: PrismaClient;
  private readonly MAX_HISTORY_ENTRIES = 100;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async addToHistory(
    userId: string,
    query: string,
    filters: SearchFilter,
    results: SearchResult[]
  ): Promise<void> {
    try {
      await this.prisma.searchHistory.create({
        data: {
          userId,
          query,
          filters: filters as unknown as Prisma.InputJsonValue,
          timestamp: new Date(),
          resultCount: results.length
        }
      });

      // Clean up old entries if needed
      await this.cleanupHistory(userId);
    } catch (error) {
      logger.error('Error adding to search history:', error);
      throw error;
    }
  }

  async getHistory(userId: string, limit: number = 20): Promise<SearchHistoryEntry[]> {
    try {
      const history = await this.prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return history.map(entry => ({
        id: entry.id,
        query: entry.query,
        timestamp: entry.timestamp,
        resultCount: entry.resultCount,
        filters: entry.filters as SearchFilter | undefined,
        userId: entry.userId
      }));
    } catch (error) {
      logger.error('Error getting search history:', error);
      throw error;
    }
  }

  async clearHistory(userId: string): Promise<void> {
    try {
      await this.prisma.searchHistory.deleteMany({
        where: { userId }
      });
    } catch (error) {
      logger.error('Error clearing search history:', error);
      throw error;
    }
  }

  async deleteHistoryEntry(userId: string, entryId: string): Promise<void> {
    try {
      await this.prisma.searchHistory.delete({
        where: {
          id: entryId,
          userId
        }
      });
    } catch (error) {
      logger.error('Error deleting search history entry:', error);
      throw error;
    }
  }

  async updateHistoryEntry(
    userId: string,
    entryId: string,
    updates: Partial<Omit<SearchHistoryEntry, 'id' | 'userId' | 'timestamp'>>
  ): Promise<void> {
    try {
      await this.prisma.searchHistory.update({
        where: {
          id: entryId,
          userId
        },
        data: {
          query: updates.query,
          filters: updates.filters as unknown as Prisma.InputJsonValue,
          resultCount: updates.resultCount ?? 0
        }
      });
    } catch (error) {
      logger.error('Error updating search history entry:', error);
      throw error;
    }
  }

  private async cleanupHistory(userId: string): Promise<void> {
    try {
      const count = await this.prisma.searchHistory.count({
        where: { userId }
      });

      if (count > this.MAX_HISTORY_ENTRIES) {
        const entriesToDelete = count - this.MAX_HISTORY_ENTRIES;
        const oldestEntries = await this.prisma.searchHistory.findMany({
          where: { userId },
          orderBy: { timestamp: 'asc' },
          take: entriesToDelete,
          select: { id: true }
        });

        await this.prisma.searchHistory.deleteMany({
          where: {
            id: { in: oldestEntries.map(entry => entry.id) }
          }
        });
      }
    } catch (error) {
      logger.error('Error cleaning up search history:', error);
      throw error;
    }
  }
} 