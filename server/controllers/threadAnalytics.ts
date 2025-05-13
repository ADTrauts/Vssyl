import { Request, Response } from 'express';
import { ThreadAnalyticsService } from '../services/threadAnalyticsService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const analyticsService = new ThreadAnalyticsService();

export const getThreadAnalytics = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const analytics = await analyticsService.getThreadAnalytics(threadId);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting thread analytics:', error);
    res.status(500).json({ error: 'Failed to get thread analytics' });
  }
};

export const trackThreadView = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const analytics = await analyticsService.trackThreadView(threadId);
    res.json(analytics);
  } catch (error) {
    handleError(error, res);
  }
};

export const trackThreadReply = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const analytics = await analyticsService.trackThreadReply(threadId);
    res.json(analytics);
  } catch (error) {
    handleError(error, res);
  }
};

export const trackThreadReaction = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const analytics = await analyticsService.trackThreadReaction(threadId);
    res.json(analytics);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateParticipantCount = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { count } = req.body;
    const analytics = await analyticsService.updateParticipantCount(threadId, count);
    res.json(analytics);
  } catch (error) {
    handleError(error, res);
  }
};

export const getAllThreadsAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getAllThreadsAnalytics();
    res.json(analytics);
  } catch (error) {
    handleError(error, res);
  }
};

export const getTrendingThreads = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const threads = await analyticsService.getTrendingThreads(limit);
    res.json(threads);
  } catch (error) {
    logger.error('Error getting trending threads:', error);
    res.status(500).json({ error: 'Failed to get trending threads' });
  }
};

export const getThreadEngagement = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const engagement = await analyticsService.getThreadEngagement(threadId);
    res.json(engagement);
  } catch (error) {
    logger.error('Error getting thread engagement:', error);
    res.status(500).json({ error: 'Failed to get thread engagement' });
  }
}; 