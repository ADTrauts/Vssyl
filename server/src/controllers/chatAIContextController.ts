/**
 * Chat AI Context Provider Controller
 *
 * Provides context data about a user's Chat/Messaging activity to the AI system.
 * These endpoints are called by the CrossModuleContextEngine when processing AI queries.
 */

import { Request, Response } from 'express';
import { getUserFromRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import {
  getHistoryForAI,
  getRecentForAI,
  getUnreadForAI,
} from '../services/chatVisibilityService';
import { ChatServiceError } from '../services/chat/chatErrors';

function logChatAiCtxError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function handleAiContextError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof ChatServiceError) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }
  logChatAiCtxError(fallbackMessage, 'ai_ctx_chat_error', error);
  res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}

/**
 * GET /api/chat/ai/context/recent
 */
export async function getRecentConversationsContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const context = await getRecentForAI(userId);

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'chat',
        endpoint: 'recentConversations',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAiContextError(res, error, 'Failed to fetch recent conversations context');
  }
}

/**
 * GET /api/chat/ai/context/unread
 */
export async function getUnreadMessagesContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const context = await getUnreadForAI(userId);

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'chat',
        endpoint: 'unreadMessages',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAiContextError(res, error, 'Failed to fetch unread messages context');
  }
}

/**
 * GET /api/chat/ai/query/history
 */
export async function getConversationHistory(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;
    const { conversationId, limit = '20' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'conversationId is required',
      });
    }

    const limitNum = parseInt(typeof limit === 'string' ? limit : '20', 10);
    const messages = await getHistoryForAI(userId, conversationId, limitNum);

    res.json({
      success: true,
      messages,
      metadata: {
        provider: 'chat',
        endpoint: 'conversationHistory',
        conversationId,
        messageCount: messages.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAiContextError(res, error, 'Failed to get conversation history');
  }
}
