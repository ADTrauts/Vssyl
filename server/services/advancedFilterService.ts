import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
}

interface FilterGroup {
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
}

interface AdvancedFilter {
  id: string;
  name: string;
  description: string;
  filterGroups: FilterGroup[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdvancedFilterService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createFilter(filter: Omit<AdvancedFilter, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdvancedFilter> {
    try {
      const createdFilter = await this.prisma.advancedFilter.create({
        data: {
          name: filter.name,
          description: filter.description,
          filterGroups: filter.filterGroups,
          createdBy: filter.createdBy
        }
      });

      return createdFilter;
    } catch (error) {
      logger.error('Error creating advanced filter:', error);
      throw error;
    }
  }

  async getFilter(filterId: string): Promise<AdvancedFilter | null> {
    try {
      const filter = await this.prisma.advancedFilter.findUnique({
        where: { id: filterId }
      });

      return filter;
    } catch (error) {
      logger.error('Error getting advanced filter:', error);
      throw error;
    }
  }

  async getUserFilters(userId: string): Promise<AdvancedFilter[]> {
    try {
      const filters = await this.prisma.advancedFilter.findMany({
        where: { createdBy: userId },
        orderBy: { updatedAt: 'desc' }
      });

      return filters;
    } catch (error) {
      logger.error('Error getting user filters:', error);
      throw error;
    }
  }

  async updateFilter(filterId: string, updates: Partial<AdvancedFilter>): Promise<AdvancedFilter> {
    try {
      const updatedFilter = await this.prisma.advancedFilter.update({
        where: { id: filterId },
        data: {
          name: updates.name,
          description: updates.description,
          filterGroups: updates.filterGroups
        }
      });

      return updatedFilter;
    } catch (error) {
      logger.error('Error updating advanced filter:', error);
      throw error;
    }
  }

  async deleteFilter(filterId: string): Promise<void> {
    try {
      await this.prisma.advancedFilter.delete({
        where: { id: filterId }
      });
    } catch (error) {
      logger.error('Error deleting advanced filter:', error);
      throw error;
    }
  }

  async applyFilter(filterId: string, data: any[]): Promise<any[]> {
    try {
      const filter = await this.getFilter(filterId);
      if (!filter) {
        throw new Error('Filter not found');
      }

      return this.filterData(data, filter.filterGroups);
    } catch (error) {
      logger.error('Error applying advanced filter:', error);
      throw error;
    }
  }

  private filterData(data: any[], filterGroups: FilterGroup[]): any[] {
    return data.filter(item => {
      return filterGroups.every(group => {
        const groupResults = group.conditions.map(condition => {
          return this.evaluateCondition(item, condition);
        });

        return group.operator === 'AND'
          ? groupResults.every(result => result)
          : groupResults.some(result => result);
      });
    });
  }

  private evaluateCondition(item: any, condition: FilterCondition): boolean {
    const value = item[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return value?.toString().toLowerCase().includes(condition.value?.toString().toLowerCase());
      case 'greaterThan':
        return value > condition.value;
      case 'lessThan':
        return value < condition.value;
      case 'between':
        return value >= condition.value[0] && value <= condition.value[1];
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }
} 