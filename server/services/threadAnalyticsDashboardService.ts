import { prisma } from '../prismaClient';
import { ThreadAnalytics, Thread, User } from '@prisma/client';
import { logger } from '../utils/logger';

export class ThreadAnalyticsDashboardService {
  // Get overall thread engagement metrics
  async getThreadEngagementMetrics(threadId: string) {
    const [analytics, messages, reactions, participants] = await Promise.all([
      prisma.threadAnalytics.findUnique({
        where: { threadId },
        include: {
          thread: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      }),
      prisma.threadMessage.count({ where: { threadId } }),
      prisma.threadReaction.count({ where: { message: { threadId } } }),
      prisma.threadParticipant.count({ where: { threadId } })
    ]);

    if (!analytics) {
      throw new Error('Thread analytics not found');
    }

    return {
      viewCount: analytics.viewCount,
      replyCount: messages,
      reactionCount: reactions,
      participantCount: participants,
      lastActivity: analytics.lastActivity,
      averageResponseTime: await this.calculateAverageResponseTime(threadId),
      engagementRate: this.calculateEngagementRate(analytics, messages, reactions, participants)
    };
  }

  // Get thread activity timeline
  async getThreadActivityTimeline(threadId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.threadActivity.findMany({
      where: {
        threadId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      timestamp: activity.timestamp,
      user: activity.user,
      metadata: activity.metadata
    }));
  }

  // Get top contributors for a thread
  async getTopContributors(threadId: string, limit: number = 5) {
    const contributors = await prisma.threadMessage.groupBy({
      by: ['userId'],
      where: { threadId },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: contributors.map(c => c.userId)
        }
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true
      }
    });

    return contributors.map(contributor => {
      const user = users.find(u => u.id === contributor.userId);
      return {
        user,
        messageCount: contributor._count.id
      };
    });
  }

  // Calculate average response time for a thread
  private async calculateAverageResponseTime(threadId: string): Promise<number> {
    const messages = await prisma.threadMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    if (messages.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = messages[i].createdAt.getTime() - messages[i-1].createdAt.getTime();
      totalTime += timeDiff;
    }

    return totalTime / (messages.length - 1);
  }

  // Calculate engagement rate
  private calculateEngagementRate(
    analytics: ThreadAnalytics,
    messageCount: number,
    reactionCount: number,
    participantCount: number
  ): number {
    if (analytics.viewCount === 0) return 0;
    
    const totalEngagement = messageCount + reactionCount;
    return (totalEngagement / analytics.viewCount) * 100;
  }
} 