import { prisma } from '../prismaClient';
import { ThreadAnalytics, Thread, ThreadMessage, ThreadReaction } from '@prisma/client';
import { logger } from '../utils/logger';

export class ThreadAnalyticsService {
  // Get analytics for a specific thread
  async getThreadAnalytics(threadId: string): Promise<ThreadAnalytics> {
    const analytics = await prisma.threadAnalytics.findUnique({
      where: { threadId },
      include: {
        thread: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            participants: true
          }
        }
      }
    });

    if (!analytics) {
      throw new Error('Thread analytics not found');
    }

    return analytics;
  }

  // Update thread analytics when a new message is added
  async onNewMessage(threadId: string, messageId: string): Promise<void> {
    await prisma.threadAnalytics.upsert({
      where: { threadId },
      create: {
        threadId,
        replyCount: 1,
        lastActivity: new Date(),
        viewCount: 0,
        reactionCount: 0,
        participantCount: 0
      },
      update: {
        replyCount: { increment: 1 },
        lastActivity: new Date()
      }
    });
  }

  // Update thread analytics when a reaction is added
  async onNewReaction(threadId: string): Promise<void> {
    await prisma.threadAnalytics.upsert({
      where: { threadId },
      create: {
        threadId,
        reactionCount: 1,
        lastActivity: new Date(),
        viewCount: 0,
        replyCount: 0,
        participantCount: 0
      },
      update: {
        reactionCount: { increment: 1 },
        lastActivity: new Date()
      }
    });
  }

  // Update thread analytics when a view is recorded
  async onThreadView(threadId: string): Promise<void> {
    await prisma.threadAnalytics.upsert({
      where: { threadId },
      create: {
        threadId,
        viewCount: 1,
        lastActivity: new Date(),
        replyCount: 0,
        reactionCount: 0,
        participantCount: 0
      },
      update: {
        viewCount: { increment: 1 },
        lastActivity: new Date()
      }
    });
  }

  // Update thread analytics when a participant joins
  async onParticipantJoin(threadId: string): Promise<void> {
    await prisma.threadAnalytics.upsert({
      where: { threadId },
      create: {
        threadId,
        participantCount: 1,
        lastActivity: new Date(),
        viewCount: 0,
        replyCount: 0,
        reactionCount: 0
      },
      update: {
        participantCount: { increment: 1 },
        lastActivity: new Date()
      }
    });
  }

  // Get trending threads (most active in last 24 hours)
  async getTrendingThreads(limit: number = 10): Promise<Thread[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.thread.findMany({
      where: {
        analytics: {
          lastActivity: {
            gte: twentyFourHoursAgo
          }
        }
      },
      include: {
        analytics: true,
        parentMessage: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        analytics: {
          lastActivity: 'desc'
        }
      },
      take: limit
    });
  }

  // Get thread engagement metrics
  async getThreadEngagement(threadId: string): Promise<{
    totalMessages: number;
    totalReactions: number;
    totalParticipants: number;
    averageRepliesPerParticipant: number;
    mostActiveParticipants: Array<{
      userId: string;
      messageCount: number;
      reactionCount: number;
    }>;
  }> {
    const [messages, reactions, participants] = await Promise.all([
      prisma.threadMessage.count({ where: { threadId } }),
      prisma.threadReaction.count({ where: { message: { threadId } } }),
      prisma.threadParticipant.count({ where: { threadId } })
    ]);

    const participantActivity = await prisma.threadMessage.groupBy({
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
      take: 5
    });

    const participantReactions = await prisma.threadReaction.groupBy({
      by: ['userId'],
      where: { message: { threadId } },
      _count: {
        id: true
      }
    });

    const mostActiveParticipants = participantActivity.map(activity => {
      const reactions = participantReactions.find(r => r.userId === activity.userId);
      return {
        userId: activity.userId,
        messageCount: activity._count.id,
        reactionCount: reactions?._count.id || 0
      };
    });

    return {
      totalMessages: messages,
      totalReactions: reactions,
      totalParticipants: participants,
      averageRepliesPerParticipant: participants > 0 ? messages / participants : 0,
      mostActiveParticipants
    };
  }
} 