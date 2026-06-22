import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ChatServiceError } from './chat/chatErrors';

export interface ChatAnalyticsQuery {
  userId: string;
  dashboardId?: string;
  startDate?: string;
  endDate?: string;
}

function buildCreatedAtFilter(
  startDate?: string,
  endDate?: string
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;

  const createdAt: Prisma.DateTimeFilter = {};
  if (startDate) createdAt.gte = new Date(startDate);
  if (endDate) createdAt.lte = new Date(endDate);

  return createdAt;
}

async function getMessageActivityByDay(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const createdAt = buildCreatedAtFilter(startDate, endDate);

  const messages = await prisma.message.findMany({
    where: {
      deletedAt: null,
      conversation: {
        trashedAt: null,
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      ...(createdAt ? { createdAt } : {}),
    },
    select: {
      createdAt: true,
    },
  });

  const activityByDay: Record<string, number> = {};
  for (const message of messages) {
    const day = message.createdAt.toISOString().split('T')[0];
    activityByDay[day] = (activityByDay[day] ?? 0) + 1;
  }

  return Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getTopReactors(userId: string, startDate?: string, endDate?: string) {
  const createdAt = buildCreatedAtFilter(startDate, endDate);

  const reactions = await prisma.messageReaction.findMany({
    where: {
      message: {
        deletedAt: null,
        conversation: {
          trashedAt: null,
          participants: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      },
      ...(createdAt ? { createdAt } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const userReactions: Record<
    string,
    { user: { id: string; name: string | null; email: string }; count: number }
  > = {};

  for (const reaction of reactions) {
    const reactorId = reaction.user.id;
    if (!userReactions[reactorId]) {
      userReactions[reactorId] = { user: reaction.user, count: 0 };
    }
    userReactions[reactorId].count++;
  }

  return Object.values(userReactions)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function getResponseTimeStats(userId: string, startDate?: string, endDate?: string) {
  const createdAt = buildCreatedAtFilter(startDate, endDate);

  const conversations = await prisma.conversation.findMany({
    where: {
      trashedAt: null,
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
      ...(createdAt ? { createdAt } : {}),
    },
    include: {
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true },
          },
        },
      },
    },
  });

  const responseTimes: number[] = [];

  for (const conversation of conversations) {
    const messages = conversation.messages;
    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];

      if (prevMessage.sender.id !== userId && currentMessage.sender.id === userId) {
        const responseTime =
          currentMessage.createdAt.getTime() - prevMessage.createdAt.getTime();
        responseTimes.push(responseTime);
      }
    }
  }

  if (responseTimes.length === 0) {
    return {
      averageResponseTime: 0,
      medianResponseTime: 0,
      fastestResponse: 0,
      slowestResponse: 0,
    };
  }

  responseTimes.sort((a, b) => a - b);
  const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const median = responseTimes[Math.floor(responseTimes.length / 2)];

  return {
    averageResponseTime: Math.round(average / 1000 / 60),
    medianResponseTime: Math.round(median / 1000 / 60),
    fastestResponse: Math.round(responseTimes[0] / 1000 / 60),
    slowestResponse: Math.round(responseTimes[responseTimes.length - 1] / 1000 / 60),
  };
}

/**
 * Chat module — dashboard-scoped unread message rollup for Analytics Capability federation.
 */
export async function countUnreadMessagesForDashboardRollup(
  userId: string,
  dashboardId: string
): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: {
      dashboardId,
      trashedAt: null,
      participants: { some: { userId, isActive: true } },
    },
    select: { id: true },
  });

  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length === 0) {
    return 0;
  }

  return prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      deletedAt: null,
      readReceipts: { none: { userId } },
    },
  });
}

export async function getChatAnalytics(query: ChatAnalyticsQuery) {
  const { userId, dashboardId, startDate, endDate } = query;
  const createdAt = buildCreatedAtFilter(startDate, endDate);

  const conversations = await prisma.conversation.findMany({
    where: {
      trashedAt: null,
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
      ...(dashboardId ? { dashboardId } : {}),
      ...(createdAt ? { createdAt } : {}),
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      messages: {
        where: { deletedAt: null },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
          reactions: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          readReceipts: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  const totalReactions = conversations.reduce(
    (sum, conv) =>
      sum + conv.messages.reduce((msgSum, msg) => msgSum + msg.reactions.length, 0),
    0
  );

  return {
    totalConversations: conversations.length,
    totalMessages,
    totalReactions,
    averageMessagesPerConversation:
      conversations.length > 0
        ? Math.round((totalMessages / conversations.length) * 100) / 100
        : 0,
    mostActiveConversations: conversations
      .map((conv) => ({
        id: conv.id,
        name: conv.name || 'Direct Message',
        messageCount: conv.messages.length,
        lastActivity:
          conv.messages.length > 0
            ? conv.messages[conv.messages.length - 1].createdAt
            : conv.createdAt,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5),
    messageActivityByDay: await getMessageActivityByDay(userId, startDate, endDate),
    topReactors: await getTopReactors(userId, startDate, endDate),
    responseTimeStats: await getResponseTimeStats(userId, startDate, endDate),
  };
}

/** Resolve user id from email for analytics entry (legacy controller contract). */
export async function resolveUserIdByEmail(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new ChatServiceError('User not found', 'not_found', 404);
  }

  return user.id;
}
