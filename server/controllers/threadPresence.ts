import { Request, Response } from 'express';
import { ThreadPresenceService } from '../services/threadPresenceService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const presenceService = new ThreadPresenceService();

export const joinThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const presence = await presenceService.addUserToThread(threadId, userId);
    res.json(presence);
  } catch (error) {
    handleError(error, res);
  }
};

export const leaveThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const presence = await presenceService.removeUserFromThread(threadId, userId);
    res.json(presence);
  } catch (error) {
    handleError(error, res);
  }
};

export const updatePresence = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const presence = await presenceService.updatePresence(threadId, userId, status);
    res.json(presence);
  } catch (error) {
    logger.error('Error updating presence:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
};

export const getThreadPresence = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const presence = await presenceService.getThreadPresence(threadId);
    res.json(presence);
  } catch (error) {
    logger.error('Error getting thread presence:', error);
    res.status(500).json({ error: 'Failed to get thread presence' });
  }
};

export const getUserThreadPresence = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const presence = await presenceService.getUserThreadPresence(userId);
    res.json(presence);
  } catch (error) {
    logger.error('Error getting user thread presence:', error);
    res.status(500).json({ error: 'Failed to get user thread presence' });
  }
};

export const markUserOffline = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    await presenceService.markUserOffline(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking user offline:', error);
    res.status(500).json({ error: 'Failed to mark user offline' });
  }
};

export const getAllThreadPresences = async (req: Request, res: Response) => {
  try {
    const presences = presenceService.getAllThreadPresences();
    res.json(presences);
  } catch (error) {
    handleError(error, res);
  }
};

export const cleanupThreadPresence = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    await presenceService.cleanupThreadPresence(threadId);
    res.json({ success: true });
  } catch (error) {
    handleError(error, res);
  }
}; 