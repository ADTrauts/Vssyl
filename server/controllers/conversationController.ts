import { Request, Response } from 'express';
import { ConversationService } from '../services/conversationService';
import { handleError } from '../utils/errorHandler';

const conversationService = new ConversationService();

export class ConversationController {
  // Get all conversations in workspace
  async getConversations(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;

      const conversations = await conversationService.getConversations(workspaceId, userId);
      res.json(conversations);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Create a new conversation
  async createConversation(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;
      const { name, type, participantIds } = req.body;

      const conversation = await conversationService.createConversation(workspaceId, userId, {
        name,
        type,
        participantIds,
      });
      res.json(conversation);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Get messages in conversation
  async getMessages(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params;
      const { cursor, limit } = req.query;
      const userId = req.user.id;

      const messages = await conversationService.getMessages(workspaceId, conversationId, userId, {
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(messages);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Create a message in conversation
  async createMessage(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params;
      const userId = req.user.id;
      const { content, type, metadata } = req.body;

      const message = await conversationService.createMessage(workspaceId, conversationId, userId, {
        content,
        type,
        metadata,
      });
      res.json(message);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Search messages in conversation
  async searchMessages(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params;
      const { q: query, cursor, limit, type } = req.query;
      const userId = req.user.id;

      const results = await conversationService.searchMessages(workspaceId, conversationId, userId, {
        query: query as string,
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : undefined,
        type: type as string,
      });
      res.json(results);
    } catch (error) {
      handleError(error, res);
    }
  }
} 