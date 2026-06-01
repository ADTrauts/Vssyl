import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { SearchFilters, SearchResult } from 'shared/types/search';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateChatPolicyDual } from '../auth/chatPolicyDual';
import { ChatServiceError } from './chat/chatErrors';
import { conversationParticipantInclude, messageListInclude } from './chat/chatIncludes';
import { assertActiveConversationParticipant } from './chatPermissionService';
import { withFullFileUrlsOnMessages } from './chatAttachmentService';

function activeParticipantFilter(userId: string): Prisma.ConversationWhereInput {
  return {
    trashedAt: null,
    participants: {
      some: {
        userId,
        isActive: true,
      },
    },
  };
}

/** Policy dual gate for conversation-scoped reads (browse/search/AI). */
export async function conversationPassesReadPolicy(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const readPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_CONVERSATION_READ,
    resourceType: 'conversation',
    resourceId: conversationId,
  });
  return !readPolicyDual.blocked;
}

export async function filterConversationsByReadPolicy<T extends { id: string }>(
  userId: string,
  conversations: T[]
): Promise<T[]> {
  const filtered: T[] = [];
  for (const conversation of conversations) {
    if (await conversationPassesReadPolicy(userId, conversation.id)) {
      filtered.push(conversation);
    }
  }
  return filtered;
}

export async function listAccessibleConversations(
  userId: string,
  options?: { dashboardId?: string }
) {
  const where: Prisma.ConversationWhereInput = activeParticipantFilter(userId);

  if (options?.dashboardId) {
    where.dashboardId = options.dashboardId;
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      ...conversationParticipantInclude,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      threads: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return filterConversationsByReadPolicy(userId, conversations);
}

export async function getConversationIfAccessible(userId: string, conversationId: string) {
  const readPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_CONVERSATION_READ,
    resourceType: 'conversation',
    resourceId: conversationId,
  });
  if (readPolicyDual.blocked) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      ...activeParticipantFilter(userId),
    },
    include: {
      ...conversationParticipantInclude,
      threads: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export interface ListAccessibleMessagesInput {
  userId: string;
  conversationId: string;
  page?: number;
  limit?: number;
  threadId?: string;
}

export async function listAccessibleMessages(input: ListAccessibleMessagesInput) {
  const { userId, conversationId } = input;

  const readPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_CONVERSATION_READ,
    resourceType: 'conversation',
    resourceId: conversationId,
  });
  if (readPolicyDual.blocked) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  const { page = 1, limit = 50, threadId } = input;

  await assertActiveConversationParticipant(userId, conversationId);

  const where: Prisma.MessageWhereInput = {
    conversationId,
    deletedAt: null,
  };

  if (threadId) {
    where.threadId = threadId;
  } else {
    where.threadId = null;
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: messageListInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  const messagesWithFullUrls = withFullFileUrlsOnMessages(messages);

  return {
    messages: messagesWithFullUrls.reverse(),
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + messages.length < total,
    },
  };
}

function calculateRelevanceScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 1.0;
  if (lowerText.startsWith(lowerQuery)) return 0.9;
  if (lowerText.includes(lowerQuery)) return 0.7;

  const queryWords = lowerQuery.split(' ');
  const textWords = lowerText.split(' ');
  const matchingWords = queryWords.filter((qw) =>
    textWords.some((tw) => tw.includes(qw))
  );
  if (matchingWords.length > 0) {
    return 0.5 * (matchingWords.length / queryWords.length);
  }

  return 0.3;
}

/** Federated search provider — participant-scoped, excludes trashed conversations. */
export async function searchAccessibleChat(
  query: string,
  userId: string,
  _filters?: SearchFilters
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const messages = await prisma.message.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
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
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
      conversation: {
        select: { id: true, name: true, type: true },
      },
    },
    take: 10,
  });

  for (const message of messages) {
    if (!(await conversationPassesReadPolicy(userId, message.conversation.id))) {
      continue;
    }
    results.push({
      id: message.id,
      title:
        message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      description: `Message from ${message.sender.name || message.sender.email} in ${message.conversation.name || 'conversation'}`,
      moduleId: 'chat',
      moduleName: 'Chat',
      url: `/chat?conversation=${message.conversation.id}&message=${message.id}`,
      type: 'message',
      metadata: {
        senderId: message.sender.id,
        conversationId: message.conversation.id,
        conversationType: message.conversation.type,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: message.createdAt,
      relevanceScore: calculateRelevanceScore(message.content, query),
    });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      trashedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
      ],
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
    include: conversationParticipantInclude,
    take: 5,
  });

  for (const conversation of conversations) {
    if (!(await conversationPassesReadPolicy(userId, conversation.id))) {
      continue;
    }
    results.push({
      id: conversation.id,
      title: conversation.name || `${conversation.type} conversation`,
      description: `${conversation.participants.length} participants`,
      moduleId: 'chat',
      moduleName: 'Chat',
      url: `/chat?conversation=${conversation.id}`,
      type: 'conversation',
      metadata: {
        type: conversation.type,
        participantCount: conversation.participants.length,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: conversation.updatedAt,
      relevanceScore: calculateRelevanceScore(conversation.name || '', query),
    });
  }

  return results;
}

export async function getRecentForAI(userId: string) {
  const rawConversations = await prisma.conversation.findMany({
    where: activeParticipantFilter(userId),
    include: {
      ...conversationParticipantInclude,
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  const recentConversations = await filterConversationsByReadPolicy(userId, rawConversations);

  return {
    recentConversations: recentConversations.map((conv) => ({
      id: conv.id,
      name: conv.name || 'Unnamed Conversation',
      type: conv.type,
      participantCount: conv.participants.length,
      participants: conv.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
      })),
      lastMessage: conv.messages[0]
        ? {
            content: conv.messages[0].content.substring(0, 100),
            timestamp: conv.messages[0].createdAt.toISOString(),
            fromUser: conv.messages[0].senderId === userId,
          }
        : null,
      lastActivity: conv.updatedAt.toISOString(),
    })),
    summary: {
      totalActiveConversations: recentConversations.length,
      hasDirectMessages: recentConversations.some((c) => c.type === 'DIRECT'),
      hasGroupChats: recentConversations.some((c) => c.type === 'GROUP'),
      mostRecentActivity: recentConversations[0]?.updatedAt.toISOString(),
    },
  };
}

export async function getUnreadForAI(userId: string) {
  const rawConversations = await prisma.conversation.findMany({
    where: activeParticipantFilter(userId),
    include: {
      participants: {
        where: { userId },
      },
      messages: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          senderId: { not: userId },
          deletedAt: null,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  const conversationsWithMessages = await filterConversationsByReadPolicy(
    userId,
    rawConversations
  );

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  let totalUnread = 0;
  for (const conv of conversationsWithMessages) {
    const recentMessages = conv.messages.filter((msg) => msg.createdAt > oneDayAgo);
    totalUnread += recentMessages.length;
  }

  return {
    unreadMessages: {
      total: totalUnread,
      conversationCount: conversationsWithMessages.length,
      preview: conversationsWithMessages.slice(0, 5).map((conv) => {
        const recentMessages = conv.messages.filter((msg) => msg.createdAt > oneDayAgo);
        return {
          conversationId: conv.id,
          conversationName: conv.name || 'Unnamed Conversation',
          unreadCount: recentMessages.length,
          latestMessage: conv.messages[0]
            ? {
                from: conv.messages[0].sender.name,
                preview: conv.messages[0].content.substring(0, 50),
                timestamp: conv.messages[0].createdAt.toISOString(),
              }
            : null,
        };
      }),
    },
    summary: {
      hasUnreadMessages: totalUnread > 0,
      requiresAttention: totalUnread > 10,
      status:
        totalUnread === 0
          ? 'all-caught-up'
          : totalUnread > 10
            ? 'many-unread'
            : 'some-unread',
    },
  };
}

export async function getHistoryForAI(
  userId: string,
  conversationId: string,
  limit: number
) {
  const readPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_CONVERSATION_READ,
    resourceType: 'conversation',
    resourceId: conversationId,
  });
  if (readPolicyDual.blocked) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  await assertActiveConversationParticipant(userId, conversationId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.reverse().map((msg) => ({
    id: msg.id,
    content: msg.content,
    sender: {
      id: msg.sender.id,
      name: msg.sender.name,
      isCurrentUser: msg.sender.id === userId,
    },
    timestamp: msg.createdAt.toISOString(),
  }));
}

export async function assertConversationAccessible(
  userId: string,
  conversationId: string
): Promise<void> {
  const conversation = await getConversationIfAccessible(userId, conversationId);
  if (!conversation) {
    throw new ChatServiceError('Conversation not found', 'not_found', 404);
  }
}
