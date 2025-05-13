import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export class ThreadOrganizationService {
  // Category Management
  async createCategory(name: string, description: string, color: string, createdById: string) {
    try {
      return await prisma.threadCategory.create({
        data: {
          name,
          description,
          color,
          createdById,
        },
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, data: { name?: string; description?: string; color?: string }) {
    try {
      return await prisma.threadCategory.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      return await prisma.threadCategory.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  // Tag Management
  async createTag(name: string, color: string, createdById: string) {
    try {
      return await prisma.threadTag.create({
        data: {
          name,
          color,
          createdById,
        },
      });
    } catch (error) {
      logger.error('Error creating tag:', error);
      throw error;
    }
  }

  async updateTag(id: string, data: { name?: string; color?: string }) {
    try {
      return await prisma.threadTag.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating tag:', error);
      throw error;
    }
  }

  async deleteTag(id: string) {
    try {
      return await prisma.threadTag.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error deleting tag:', error);
      throw error;
    }
  }

  // Collection Management
  async createCollection(name: string, description: string, isPrivate: boolean, createdById: string) {
    try {
      return await prisma.threadCollection.create({
        data: {
          name,
          description,
          isPrivate,
          createdById,
          members: {
            connect: { id: createdById },
          },
        },
      });
    } catch (error) {
      logger.error('Error creating collection:', error);
      throw error;
    }
  }

  async updateCollection(id: string, data: { name?: string; description?: string; isPrivate?: boolean }) {
    try {
      return await prisma.threadCollection.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating collection:', error);
      throw error;
    }
  }

  async deleteCollection(id: string) {
    try {
      return await prisma.threadCollection.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error deleting collection:', error);
      throw error;
    }
  }

  async addThreadToCollection(threadId: string, collectionId: string) {
    try {
      return await prisma.threadCollection.update({
        where: { id: collectionId },
        data: {
          threads: {
            connect: { id: threadId },
          },
        },
      });
    } catch (error) {
      logger.error('Error adding thread to collection:', error);
      throw error;
    }
  }

  async removeThreadFromCollection(threadId: string, collectionId: string) {
    try {
      return await prisma.threadCollection.update({
        where: { id: collectionId },
        data: {
          threads: {
            disconnect: { id: threadId },
          },
        },
      });
    } catch (error) {
      logger.error('Error removing thread from collection:', error);
      throw error;
    }
  }

  async addMemberToCollection(collectionId: string, userId: string) {
    try {
      return await prisma.threadCollection.update({
        where: { id: collectionId },
        data: {
          members: {
            connect: { id: userId },
          },
        },
      });
    } catch (error) {
      logger.error('Error adding member to collection:', error);
      throw error;
    }
  }

  async removeMemberFromCollection(collectionId: string, userId: string) {
    try {
      return await prisma.threadCollection.update({
        where: { id: collectionId },
        data: {
          members: {
            disconnect: { id: userId },
          },
        },
      });
    } catch (error) {
      logger.error('Error removing member from collection:', error);
      throw error;
    }
  }

  // Template Management
  async createTemplate(name: string, description: string, content: string, metadata: any, createdById: string) {
    try {
      return await prisma.threadTemplate.create({
        data: {
          name,
          description,
          content,
          metadata,
          createdById,
        },
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, data: { name?: string; description?: string; content?: string; metadata?: any }) {
    try {
      return await prisma.threadTemplate.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string) {
    try {
      return await prisma.threadTemplate.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  // Thread Relations
  async addThreadRelation(threadId: string, relatedThreadId: string) {
    try {
      return await prisma.thread.update({
        where: { id: threadId },
        data: {
          relatedThreads: {
            connect: { id: relatedThreadId },
          },
        },
      });
    } catch (error) {
      logger.error('Error adding thread relation:', error);
      throw error;
    }
  }

  async removeThreadRelation(threadId: string, relatedThreadId: string) {
    try {
      return await prisma.thread.update({
        where: { id: threadId },
        data: {
          relatedThreads: {
            disconnect: { id: relatedThreadId },
          },
        },
      });
    } catch (error) {
      logger.error('Error removing thread relation:', error);
      throw error;
    }
  }

  async organizeThreadsByActivity(
    userId: string,
    days: number = 30
  ): Promise<{
    activeThreads: Array<{ thread: Thread; lastActivity: Date; activityCount: number }>;
    inactiveThreads: Array<{ thread: Thread; lastActivity: Date }>;
    trendingThreads: Array<{ thread: Thread; activityCount: number }>;
    recommendedThreads: Array<{ thread: Thread; relevanceScore: number }>;
  }> {
    try {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Get all threads the user has access to
      const userThreads = await prisma.thread.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        include: {
          activities: {
            where: {
              timestamp: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      });

      // Organize threads by activity
      const activeThreads = this.getActiveThreads(userThreads);
      const inactiveThreads = this.getInactiveThreads(userThreads);
      const trendingThreads = this.getTrendingThreads(userThreads);
      const recommendedThreads = await this.getRecommendedThreads(userId, userThreads);

      return {
        activeThreads,
        inactiveThreads,
        trendingThreads,
        recommendedThreads
      };
    } catch (error) {
      logger.error('Error organizing threads by activity:', error);
      throw error;
    }
  }

  async organizeThreadsByCategory(
    userId: string
  ): Promise<{
    categories: Array<{
      name: string;
      threads: Array<{ thread: Thread; lastActivity: Date }>;
    }>;
  }> {
    try {
      // Get all threads the user has access to
      const userThreads = await prisma.thread.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        include: {
          category: true
        }
      });

      // Group threads by category
      const categoryMap = new Map<string, Array<{ thread: Thread; lastActivity: Date }>>();

      userThreads.forEach(thread => {
        const categoryName = thread.category?.name || 'Uncategorized';
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, []);
        }
        categoryMap.get(categoryName)?.push({
          thread,
          lastActivity: thread.updatedAt
        });
      });

      // Convert to array and sort by category name
      const categories = Array.from(categoryMap.entries())
        .map(([name, threads]) => ({
          name,
          threads: threads.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { categories };
    } catch (error) {
      logger.error('Error organizing threads by category:', error);
      throw error;
    }
  }

  async organizeThreadsByPriority(
    userId: string
  ): Promise<{
    highPriority: Array<{ thread: Thread; priorityScore: number }>;
    mediumPriority: Array<{ thread: Thread; priorityScore: number }>;
    lowPriority: Array<{ thread: Thread; priorityScore: number }>;
  }> {
    try {
      // Get all threads the user has access to
      const userThreads = await prisma.thread.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        include: {
          activities: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 10
          }
        }
      });

      // Calculate priority scores for each thread
      const threadsWithPriority = userThreads.map(thread => ({
        thread,
        priorityScore: this.calculatePriorityScore(thread)
      }));

      // Sort threads by priority score
      threadsWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);

      // Categorize threads by priority
      const highPriority = threadsWithPriority
        .filter(t => t.priorityScore >= 0.7)
        .slice(0, 10);
      const mediumPriority = threadsWithPriority
        .filter(t => t.priorityScore >= 0.3 && t.priorityScore < 0.7)
        .slice(0, 20);
      const lowPriority = threadsWithPriority
        .filter(t => t.priorityScore < 0.3)
        .slice(0, 30);

      return {
        highPriority,
        mediumPriority,
        lowPriority
      };
    } catch (error) {
      logger.error('Error organizing threads by priority:', error);
      throw error;
    }
  }

  private getActiveThreads(
    threads: (Thread & { activities: ThreadActivity[] })[]
  ): Array<{ thread: Thread; lastActivity: Date; activityCount: number }> {
    return threads
      .filter(thread => thread.activities.length > 0)
      .map(thread => ({
        thread,
        lastActivity: thread.activities[0].timestamp,
        activityCount: thread.activities.length
      }))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
      .slice(0, 20);
  }

  private getInactiveThreads(
    threads: (Thread & { activities: ThreadActivity[] })[]
  ): Array<{ thread: Thread; lastActivity: Date }> {
    return threads
      .filter(thread => thread.activities.length === 0)
      .map(thread => ({
        thread,
        lastActivity: thread.updatedAt
      }))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
      .slice(0, 20);
  }

  private getTrendingThreads(
    threads: (Thread & { activities: ThreadActivity[] })[]
  ): Array<{ thread: Thread; activityCount: number }> {
    return threads
      .map(thread => ({
        thread,
        activityCount: thread.activities.length
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 10);
  }

  private async getRecommendedThreads(
    userId: string,
    userThreads: (Thread & { activities: ThreadActivity[] })[]
  ): Promise<Array<{ thread: Thread; relevanceScore: number }>> {
    // Get user's activity patterns
    const userActivities = await prisma.threadActivity.findMany({
      where: {
        userId,
        timestamp: {
          gte: subDays(new Date(), 30)
        }
      },
      include: {
        thread: true
      }
    });

    // Calculate relevance scores for each thread
    const threadsWithScores = userThreads.map(thread => ({
      thread,
      relevanceScore: this.calculateRelevanceScore(thread, userActivities)
    }));

    // Sort by relevance score and return top recommendations
    return threadsWithScores
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  private calculatePriorityScore(thread: Thread & { activities: ThreadActivity[] }): number {
    const activityCount = thread.activities.length;
    const lastActivity = thread.activities[0]?.timestamp || thread.updatedAt;
    const daysSinceLastActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate score based on activity count and recency
    const activityScore = Math.min(activityCount / 10, 1);
    const recencyScore = Math.max(0, 1 - daysSinceLastActivity / 30);

    // Weight the scores
    return (activityScore * 0.6) + (recencyScore * 0.4);
  }

  private calculateRelevanceScore(
    thread: Thread & { activities: ThreadActivity[] },
    userActivities: (ThreadActivity & { thread: Thread })[]
  ): number {
    // Calculate score based on common participants, activity patterns, and recency
    const activityCount = thread.activities.length;
    const lastActivity = thread.activities[0]?.timestamp || thread.updatedAt;
    const daysSinceLastActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate scores
    const activityScore = Math.min(activityCount / 10, 1);
    const recencyScore = Math.max(0, 1 - daysSinceLastActivity / 30);
    const patternScore = this.calculatePatternMatch(thread, userActivities);

    // Weight the scores
    return (activityScore * 0.4) + (recencyScore * 0.3) + (patternScore * 0.3);
  }

  private calculatePatternMatch(
    thread: Thread & { activities: ThreadActivity[] },
    userActivities: (ThreadActivity & { thread: Thread })[]
  ): number {
    // Calculate how well the thread's activity pattern matches the user's preferences
    const userActivityTypes = new Set(userActivities.map(a => a.type));
    const threadActivityTypes = new Set(thread.activities.map(a => a.type));

    const matchingTypes = Array.from(userActivityTypes).filter(type =>
      threadActivityTypes.has(type)
    );

    return matchingTypes.length / userActivityTypes.size;
  }
} 