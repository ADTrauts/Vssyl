import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { z } from 'zod';
import {
  getRecentConversationMemory as fetchRecentConversationMemory,
  listRecentTopicsForUser,
  refreshConversationThreadMemory,
} from '../services/aiConversationMemoryService';
import { indexAIMessageForRecall } from '../services/aiMessageRecallService';
import { validateAccessibleFileIds } from '../services/driveVisibilityService';

function logAiConversationError(
  message: string,
  operation: string,
  err: unknown,
  context?: Record<string, unknown>
): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}

// Type guard for user with id
function hasUserId(user: unknown): user is { id: string } {
  return typeof user === 'object' && user !== null && 'id' in user && typeof (user as { id: unknown }).id === 'string';
}

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  dashboardId: z.string().optional(),
  businessId: z.string().optional(),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isArchived: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional(),
  fileIds: z.array(z.string().min(1)).max(10).optional(),
});

// Helper function to generate conversation title from first message
function generateTitle(content: string): string {
  // Take first 50 characters and clean up
  const title = content.substring(0, 50).trim();
  return title.length < content.length ? `${title}...` : title;
}

// GET /api/ai-conversations - Get user's AI conversations
export const getConversations = async (req: Request, res: Response) => {
  let userId: string | undefined;
  let where: Record<string, unknown> | undefined;
  
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { 
      page = 1, 
      limit = 20, 
      archived,
      dashboardId,
      businessId 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Parse archived parameter (query params come as strings)
    const isArchived = typeof archived === 'string' ? archived === 'true' : false;

    // Build where clause
    where = {
      userId: userId,
      isArchived: isArchived,
      trashedAt: null, // Exclude trashed conversations
    };

    if (dashboardId) {
      where.dashboardId = dashboardId as string;
    }

    if (businessId) {
      where.businessId = businessId as string;
    }

    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          title: true,
          dashboardId: true,
          businessId: true,
          createdAt: true,
          updatedAt: true,
          lastMessageAt: true,
          isArchived: true,
          isPinned: true,
          messageCount: true,
          dashboard: {
            select: {
              id: true,
              name: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.aIConversation.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: unknown) {
    logAiConversationError('Error fetching AI conversations', 'ai_conversations_list', error, {
      userId: userId ?? 'not yet assigned',
      where: where ?? 'not yet assigned',
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversations',
      details:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : undefined
    });
  }
};

// GET /api/ai-conversations/:id - Get specific conversation with messages
export const getConversation = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { id } = req.params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: userId,
        trashedAt: null, // Exclude trashed conversations
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        dashboard: {
          select: {
            id: true,
            name: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    logAiConversationError('Error fetching AI conversation', 'ai_conversation_get', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversation' 
    });
  }
};

// POST /api/ai-conversations - Create new conversation
export const createConversation = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const validatedData = createConversationSchema.parse(req.body);

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: userId,
        title: validatedData.title,
        dashboardId: validatedData.dashboardId,
        businessId: validatedData.businessId,
      },
      include: {
        dashboard: {
          select: {
            id: true,
            name: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logAiConversationError('Error creating AI conversation', 'ai_conversation_create', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create conversation' 
    });
  }
};

// PUT /api/ai-conversations/:id - Update conversation
export const updateConversation = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { id } = req.params;
    const validatedData = updateConversationSchema.parse(req.body);

    // Check if conversation exists and belongs to user
    const existingConversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: userId,
        trashedAt: null, // Exclude trashed conversations
      },
    });

    if (!existingConversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    const conversation = await prisma.aIConversation.update({
      where: { id },
      data: validatedData,
      include: {
        dashboard: {
          select: {
            id: true,
            name: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logAiConversationError('Error updating AI conversation', 'ai_conversation_update', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update conversation' 
    });
  }
};

// DELETE /api/ai-conversations/:id - Delete conversation
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { id } = req.params;

    // Check if conversation exists and belongs to user
    const existingConversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: userId,
        trashedAt: null, // Only allow trashing non-trashed conversations
      },
    });

    if (!existingConversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found or already trashed' 
      });
    }

    // Move conversation to trash instead of hard delete
    await prisma.aIConversation.update({
      where: { id },
      data: { trashedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Conversation moved to trash successfully',
    });
  } catch (error) {
    logAiConversationError('Error deleting AI conversation', 'ai_conversation_delete', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete conversation' 
    });
  }
};

// POST /api/ai-conversations/:id/messages - Add message to conversation
export const addMessage = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { id } = req.params;
    const validatedData = addMessageSchema.parse(req.body);

    // Check if conversation exists and belongs to user
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: userId,
        trashedAt: null, // Exclude trashed conversations
      },
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    // Validate file access for user messages with attachments
    let attachments: { fileIds: string[] } | null = null;
    if (validatedData.fileIds && validatedData.fileIds.length > 0 && validatedData.role === 'user') {
      const { accessibleIds, deniedIds } = await validateAccessibleFileIds(userId, validatedData.fileIds);
      if (deniedIds.length > 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to one or more files',
          invalidFileIds: deniedIds,
        });
      }
      attachments = { fileIds: accessibleIds };
    }

    // Create message
    const message = await prisma.aIMessage.create({
      data: {
        conversationId: id,
        role: validatedData.role,
        content: validatedData.content,
        confidence: validatedData.confidence,
        metadata: validatedData.metadata as Prisma.InputJsonValue | undefined,
        attachments: attachments as Prisma.InputJsonValue | undefined,
      },
    });

    // Update conversation metadata
    const updateData: Record<string, unknown> = {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
    };

    // If this is the first user message, update the title
    if (validatedData.role === 'user' && conversation.messageCount === 0) {
      updateData.title = generateTitle(validatedData.content);
    }

    await prisma.aIConversation.update({
      where: { id },
      data: updateData,
    });

    try {
      await indexAIMessageForRecall({
        userId,
        conversationId: id,
        messageId: message.id,
        role: validatedData.role,
        content: validatedData.content,
        businessId: conversation.businessId,
        dashboardId: conversation.dashboardId,
      });
    } catch (indexErr: unknown) {
      const e = indexErr instanceof Error ? indexErr : new Error(String(indexErr));
      void logger.warn('Failed to index AI message for recall', {
        operation: 'ai_message_recall_index',
        error: { message: e.message },
        messageId: message.id,
      });
    }

    if (validatedData.role === 'assistant') {
      try {
        const lastUser = await prisma.aIMessage.findFirst({
          where: { conversationId: id, role: 'user' },
          orderBy: { createdAt: 'desc' },
          select: { content: true },
        });
        await refreshConversationThreadMemory({
          conversationId: id,
          userId,
          assistantMetadata: validatedData.metadata as Record<string, unknown> | undefined,
          lastUserContent: lastUser?.content,
        });
      } catch (memoryErr: unknown) {
        const e = memoryErr instanceof Error ? memoryErr : new Error(String(memoryErr));
        void logger.warn('Failed to refresh conversation thread memory', {
          operation: 'ai_conversation_thread_memory',
          error: { message: e.message },
          conversationId: id,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logAiConversationError('Error adding message to AI conversation', 'ai_conversation_message_add', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add message' 
    });
  }
};

// GET /api/ai-conversations/:id/messages - Get conversation messages
export const getMessages = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Check if conversation exists and belongs to user
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: userId,
        trashedAt: null, // Exclude trashed conversations
      },
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    const [messages, total] = await Promise.all([
      prisma.aIMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      prisma.aIMessage.count({
        where: { conversationId: id },
      }),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logAiConversationError('Error fetching AI conversation messages', 'ai_conversation_messages', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    });
  }
};

// GET /api/ai-conversations/memory/recent — recent threads with summaries (cross-session recall)
export const getRecentConversationMemory = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { limit, excludeConversationId, businessId, dashboardId } = req.query;
    const memories = await fetchRecentConversationMemory({
      userId,
      limit: limit != null ? Number(limit) : 5,
      excludeConversationId:
        typeof excludeConversationId === 'string' ? excludeConversationId : undefined,
      businessId: typeof businessId === 'string' ? businessId : undefined,
      dashboardId: typeof dashboardId === 'string' ? dashboardId : undefined,
    });

    res.json({ success: true, data: { conversations: memories } });
  } catch (error: unknown) {
    logAiConversationError('Error fetching recent conversation memory', 'ai_conversation_memory_recent', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent conversation memory' });
  }
};

// GET /api/ai-conversations/memory/topics — distilled topic labels from recent threads
export const getRecentConversationTopics = async (req: Request, res: Response) => {
  try {
    if (!hasUserId(req.user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = (req.user as { id?: string; sub?: string }).id || (req.user as { id?: string; sub?: string }).sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;
    const topics = await listRecentTopicsForUser(userId, Number.isFinite(limit) ? limit : 10);

    res.json({ success: true, data: { topics } });
  } catch (error: unknown) {
    logAiConversationError('Error fetching recent conversation topics', 'ai_conversation_memory_topics', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent topics' });
  }
};
