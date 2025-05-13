import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { WebSocketService } from './websocketService';
import prisma from '../prismaClient';

const prismaClient = new PrismaClient();

export interface ThreadSearchFilters {
  query?: string;
  userId?: string;
  pinned?: boolean;
  starred?: boolean;
  hasReplies?: boolean;
  hasReactions?: boolean;
  minReplies?: number;
  minReactions?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'replyCount' | 'reactionCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface SearchFilters {
  query?: string;
  authorId?: string;
  tags?: string[];
  status?: 'active' | 'archived' | 'locked';
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'mostActive';
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  status: string;
  messageCount: number;
  lastActivity: Date;
  relevance?: number;
}

export class ThreadSearchService {
  constructor(private wsService: WebSocketService) {}

  // Search threads with filters
  async searchThreads(filters: SearchFilters): Promise<SearchResult[]> {
    try {
      const where: any = {};

      // Text search
      if (filters.query) {
        where.OR = [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { content: { contains: filters.query, mode: 'insensitive' } }
        ];
      }

      // Author filter
      if (filters.authorId) {
        where.authorId = filters.authorId;
      }

      // Tags filter
      if (filters.tags?.length) {
        where.tags = {
          hasSome: filters.tags
        };
      }

      // Status filter
      if (filters.status) {
        where.status = filters.status;
      }

      // Date range filter
      if (filters.dateRange) {
        where.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        };
      }

      // Base query
      let query = prismaClient.thread.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        }
      });

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          query = query.orderBy({ createdAt: 'desc' });
          break;
        case 'oldest':
          query = query.orderBy({ createdAt: 'asc' });
          break;
        case 'mostActive':
          query = query.orderBy({ messages: { _count: 'desc' } });
          break;
        case 'relevance':
        default:
          if (filters.query) {
            // Add relevance score based on text search
            query = query.orderBy({
              _relevance: {
                fields: ['title', 'content'],
                search: filters.query,
                sort: 'desc'
              }
            });
          } else {
            query = query.orderBy({ createdAt: 'desc' });
          }
      }

      const threads = await query;

      // Transform results
      return threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        author: thread.author,
        tags: thread.tags,
        status: thread.status,
        messageCount: thread._count.messages,
        lastActivity: thread.updatedAt
      }));
    } catch (error) {
      logger.error('Error searching threads:', error);
      throw error;
    }
  }

  // Get thread suggestions based on user activity
  async getThreadSuggestions(userId: string, limit: number = 5) {
    try {
      // Get threads where user has participated
      const userThreads = await prismaClient.thread.findMany({
        where: {
          participants: { some: { userId } }
        },
        select: {
          id: true,
          parentMessage: {
            select: {
              content: true
            }
          }
        },
        take: 10
      });

      // Get threads with similar content
      const similarThreads = await prismaClient.thread.findMany({
        where: {
          id: { notIn: userThreads.map(t => t.id) },
          OR: userThreads.map(thread => ({
            parentMessage: {
              content: {
                contains: thread.parentMessage.content.split(' ').slice(0, 3).join(' '),
                mode: 'insensitive'
              }
            }
          }))
        },
        include: {
          parentMessage: {
            select: {
              content: true,
              createdAt: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          analytics: true,
          participants: {
            select: {
              userId: true,
              isFollowing: true
            }
          }
        },
        take: limit
      });

      return similarThreads;
    } catch (error) {
      logger.error('Error getting thread suggestions:', error);
      throw error;
    }
  }

  // Get trending threads
  async getTrendingThreads(limit: number = 10) {
    try {
      return await prismaClient.thread.findMany({
        where: {
          analytics: {
            replyCount: { gt: 0 },
            lastActivity: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        orderBy: {
          analytics: {
            replyCount: 'desc'
          }
        },
        include: {
          parentMessage: {
            select: {
              content: true,
              createdAt: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          analytics: true,
          participants: {
            select: {
              userId: true,
              isFollowing: true
            }
          }
        },
        take: limit
      });
    } catch (error) {
      logger.error('Error getting trending threads:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string): Promise<{
    threads: { id: string; title: string }[];
    tags: string[];
    authors: { id: string; name: string }[];
  }> {
    try {
      const [threads, tags, authors] = await Promise.all([
        prismaClient.thread.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            title: true
          },
          take: 5
        }),
        prismaClient.thread.findMany({
          where: {
            tags: {
              hasSome: [query]
            }
          },
          select: {
            tags: true
          },
          take: 5
        }),
        prismaClient.user.findMany({
          where: {
            name: { contains: query, mode: 'insensitive' }
          },
          select: {
            id: true,
            name: true
          },
          take: 5
        })
      ]);

      // Extract unique tags
      const uniqueTags = Array.from(
        new Set(tags.flatMap(t => t.tags))
      ).filter(tag => tag.toLowerCase().includes(query.toLowerCase()));

      return {
        threads,
        tags: uniqueTags,
        authors
      };
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      throw error;
    }
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    try {
      const searches = await prismaClient.searchLog.groupBy({
        by: ['query'],
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: limit
      });

      return searches.map(s => s.query);
    } catch (error) {
      logger.error('Error getting popular searches:', error);
      throw error;
    }
  }

  async logSearch(query: string, userId: string): Promise<void> {
    try {
      await prismaClient.searchLog.create({
        data: {
          query,
          userId
        }
      });
    } catch (error) {
      logger.error('Error logging search:', error);
    }
  }

  private broadcastSearchUpdate(threadId: string, update: any) {
    try {
      this.wsService.broadcastToThread(threadId, {
        type: 'search:update',
        data: update
      });
    } catch (error) {
      logger.error('Error broadcasting search update:', error);
    }
  }
} 