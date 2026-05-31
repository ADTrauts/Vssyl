import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { ChatServiceError } from '../services/chat/chatErrors';
import { createConversation as createConversationService } from '../services/chatConversationService';
import {
  markAsRead as markAsReadService,
  sendMessage as sendMessageService,
  toggleReaction as toggleReactionService,
} from '../services/chatMessageService';
import {
  createThread as createThreadService,
  listThreads as listThreadsService,
} from '../services/chatThreadService';
import {
  getConversationIfAccessible,
  listAccessibleConversations,
  listAccessibleMessages,
} from '../services/chatVisibilityService';
import { searchUsersForChatInvite } from '../services/chatUserSearchService';
import {
  getChatAnalytics as computeChatAnalytics,
  resolveUserIdByEmail,
} from '../services/chatAnalyticsService';

interface CreateConversationRequest {
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  participantIds: string[];
  dashboardId?: string;
}

interface CreateThreadRequest {
  conversationId: string;
  name?: string;
  type?: 'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION';
  parentId?: string;
  participantIds?: string[];
}

interface AddReactionRequest {
  messageId: string;
  emoji: string;
}

const getUserFromRequest = (req: Request) => req.user || null;

const handleError = async (
  res: Response,
  error: unknown,
  message: string = 'Internal server error'
) => {
  if (error instanceof ChatServiceError) {
    return res.status(error.status).json({ success: false, error: error.message });
  }
  await logger.error('Chat controller error', {
    operation: 'chat_controller_error',
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    },
  });
  res.status(500).json({ success: false, error: message });
};

function actorDisplayName(user: { name?: string | null; email?: string | null }): string {
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split('@')[0] ?? 'Someone';
  return 'Someone';
}

export const searchUsersForChat = async (req: Request, res: Response) => {
  try {
    const { query, limit = 20, offset = 0 } = req.query;
    const currentUser = req.user;

    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });
    }

    const sortedUsers = await searchUsersForChatInvite({
      currentUserId: currentUser.id,
      query,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({ success: true, data: sortedUsers });
  } catch (error) {
    await handleError(res, error, 'Failed to search users for chat');
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { dashboardId } = req.query;
    const dashboardFilter =
      dashboardId && typeof dashboardId === 'string' ? dashboardId : undefined;

    const conversations = await listAccessibleConversations(user.id, {
      dashboardId: dashboardFilter,
    });

    res.json({ success: true, data: conversations });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch conversations');
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const conversation = await getConversationIfAccessible(user.id, id);

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch conversation');
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, type, participantIds, dashboardId }: CreateConversationRequest = req.body;

    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ success: false, error: 'participantIds must be an array' });
    }
    if (participantIds.some((id) => typeof id !== 'string' || id.length === 0)) {
      return res.status(400).json({ success: false, error: 'Invalid participantIds' });
    }
    if (dashboardId !== undefined && dashboardId !== null && typeof dashboardId !== 'string') {
      return res.status(400).json({ success: false, error: 'dashboardId must be a string' });
    }

    const result = await createConversationService({
      userId: user.id,
      name,
      type,
      participantIds,
      dashboardId,
    });

    if (!result.created) {
      return res.json({ success: true, data: result.conversation });
    }

    res.status(201).json({ success: true, data: result.conversation });
  } catch (error) {
    await handleError(res, error, 'Failed to create conversation');
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 50, threadId } = req.query;

    const threadFilter =
      typeof threadId === 'string' && threadId.length > 0 ? threadId : undefined;

    const { messages, pagination } = await listAccessibleMessages({
      userId: user.id,
      conversationId,
      page: Number(page),
      limit: Number(limit),
      threadId: threadFilter,
    });

    res.json({
      success: true,
      data: messages,
      pagination,
    });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch messages');
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { content, threadId, replyToId, fileIds } = req.body;
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const messageWithFullUrls = await sendMessageService({
      userId: user.id,
      senderName: actorDisplayName(user),
      conversationId,
      content: typeof content === 'string' ? content : '',
      threadId: threadId ?? null,
      replyToId: replyToId ?? null,
      fileIds: Array.isArray(fileIds) ? fileIds : undefined,
    });

    res.status(201).json({ success: true, data: messageWithFullUrls });
  } catch (error) {
    await handleError(res, error, 'Failed to create message');
  }
};

export const addReaction = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { messageId } = req.params;
    const { emoji }: AddReactionRequest = req.body;

    const result = await toggleReactionService({
      userId: user.id,
      actorName: actorDisplayName(user),
      messageId,
      emoji,
    });

    res.json({
      success: true,
      data: result.data,
      action: result.action,
    });
  } catch (error) {
    await handleError(res, error, 'Failed to add reaction');
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { messageId } = req.params;
    const result = await markAsReadService({ userId: user.id, messageId });

    if (!result.created) {
      return res.json({ success: true, data: result.receipt });
    }

    res.status(201).json({ success: true, data: result.receipt });
  } catch (error) {
    await handleError(res, error, 'Failed to mark message as read');
  }
};

export const getThreads = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const threads = await listThreadsService(user.id, conversationId);

    res.json({ success: true, data: threads });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch threads');
  }
};

export const createThread = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const paramCid = (req.params as { conversationId?: string }).conversationId;
    const { conversationId: bodyCid, name, type = 'MESSAGE', parentId, participantIds = [] }: CreateThreadRequest =
      req.body;
    const conversationId = paramCid || bodyCid;
    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({ success: false, error: 'conversationId is required' });
    }

    const thread = await createThreadService({
      userId: user.id,
      conversationId,
      name,
      type,
      parentId,
      participantIds,
    });

    res.status(201).json({ success: true, data: thread });
  } catch (error) {
    await handleError(res, error, 'Failed to create thread');
  }
};

export const getChatAnalytics = async (req: Request, res: Response) => {
  try {
    const { dashboardId, startDate, endDate } = req.query;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = await resolveUserIdByEmail(userEmail);
    const analytics = await computeChatAnalytics({
      userId,
      dashboardId: typeof dashboardId === 'string' ? dashboardId : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
    });

    res.json({ success: true, data: analytics });
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    await logger.error('Failed to get chat analytics', {
      operation: 'chat_get_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ success: false, message: 'Failed to get chat analytics' });
  }
};
