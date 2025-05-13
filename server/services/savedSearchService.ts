import { PrismaClient, Prisma } from '@prisma/client';
import { SavedSearch, SearchFilter } from '@shared/types/search';
import { logger } from '../utils/logger';
import { prisma } from '../prismaClient';

export class SavedSearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async saveSearch(
    userId: string,
    name: string,
    query: string,
    filters: SearchFilter
  ): Promise<SavedSearch> {
    try {
      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          name,
          query,
          filters: filters as unknown as Prisma.InputJsonValue,
          userId,
          isDefault: false
        }
      });

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
      logger.error('Error saving search:', error);
      throw error;
    }
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      return savedSearches.map(search => ({
        id: search.id,
        name: search.name,
        query: search.query,
        filters: search.filters as SearchFilter,
        userId: search.userId,
        createdAt: search.createdAt,
        updatedAt: search.updatedAt,
        isDefault: search.isDefault
      }));
    } catch (error) {
      logger.error('Error getting saved searches:', error);
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

  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    try {
      await this.prisma.savedSearch.delete({
        where: {
          id: searchId,
          userId
        }
      });
    } catch (error) {
      logger.error('Error deleting saved search:', error);
      throw error;
    }
  }

  async clearSavedSearches(userId: string): Promise<void> {
    try {
      await this.prisma.savedSearch.deleteMany({
        where: { userId }
      });
    } catch (error) {
      logger.error('Error clearing saved searches:', error);
      throw error;
    }
  }
} 