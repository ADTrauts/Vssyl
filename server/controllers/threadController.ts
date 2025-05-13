import { Request, Response } from 'express';
import { ThreadService } from '../services/threadService';
import { handleError } from '../utils/errorHandler';

const threadService = new ThreadService();

export class ThreadController {
  // Get thread details
  async getThread(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId, messageId } = req.params;
      const userId = req.user.id;

      const thread = await threadService.getThread(workspaceId, conversationId, messageId, userId);
      res.json(thread);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Create a new thread
  async createThread(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId, messageId } = req.params;
      const userId = req.user.id;

      const thread = await threadService.createThread(workspaceId, conversationId, messageId, userId);
      res.json(thread);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Delete a thread
  async deleteThread(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId, messageId } = req.params;
      const userId = req.user.id;

      const result = await threadService.deleteThread(workspaceId, conversationId, messageId, userId);
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Get thread messages
  async getThreadMessages(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId, messageId } = req.params;
      const { cursor, limit } = req.query;
      const userId = req.user.id;

      const messages = await threadService.getThreadMessages(
        workspaceId,
        conversationId,
        messageId,
        userId,
        cursor as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Create thread message
  async createThreadMessage(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId, messageId } = req.params;
      const { content, attachments } = req.body;
      const userId = req.user.id;

      const message = await threadService.createThreadMessage(
        workspaceId,
        conversationId,
        messageId,
        userId,
        content,
        attachments
      );
      res.json(message);
    } catch (error) {
      handleError(error, res);
    }
  }

  // Update thread message
  async updateThreadMessage(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId, messageId } = req.params;
      const { messageId: threadMessageId, content } = req.body;
      const userId = req.user.id;

      const message = await threadService.updateThreadMessage(
        workspaceId,
        conversationId,
        messageId,
        threadMessageId,
        userId,
        content
      );
      res.json(message);
    } catch (error) {
      handleError(error, res);
    }
  }
} 