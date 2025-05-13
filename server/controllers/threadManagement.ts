import { Request, Response } from 'express';
import { ThreadManagementService } from '../services/threadManagementService';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
    isAdmin?: boolean;
  };
}

const threadManagementService = new ThreadManagementService();

export const pinThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const thread = await threadManagementService.pinThread(threadId, req.user.id);
    res.json(thread);
  } catch (error) {
    logger.error('Error pinning thread:', error);
    res.status(500).json({ error: 'Failed to pin thread' });
  }
};

export const unpinThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const thread = await threadManagementService.unpinThread(threadId, req.user.id);
    res.json(thread);
  } catch (error) {
    logger.error('Error unpinning thread:', error);
    res.status(500).json({ error: 'Failed to unpin thread' });
  }
};

export const starThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const star = await threadManagementService.starThread(threadId, req.user.id);
    res.json(star);
  } catch (error) {
    logger.error('Error starring thread:', error);
    res.status(500).json({ error: 'Failed to star thread' });
  }
};

export const unstarThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await threadManagementService.unstarThread(threadId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error unstarring thread:', error);
    res.status(500).json({ error: 'Failed to unstar thread' });
  }
};

export const getStarredThreads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const threads = await threadManagementService.getStarredThreads(req.user.id);
    res.json(threads);
  } catch (error) {
    logger.error('Error getting starred threads:', error);
    res.status(500).json({ error: 'Failed to get starred threads' });
  }
};

export const getPinnedThreads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const threads = await threadManagementService.getPinnedThreads(req.user.id);
    res.json(threads);
  } catch (error) {
    logger.error('Error getting pinned threads:', error);
    res.status(500).json({ error: 'Failed to get pinned threads' });
  }
};

export const updateThreadMetadata = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const { metadata } = req.body;
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const thread = await threadManagementService.updateThreadMetadata(
      threadId,
      req.user.id,
      metadata
    );
    res.json(thread);
  } catch (error) {
    logger.error('Error updating thread metadata:', error);
    res.status(500).json({ error: 'Failed to update thread metadata' });
  }
}; 