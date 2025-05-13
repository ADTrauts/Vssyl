import { Request, Response } from 'express';
import { ThreadActivityService } from '../services/threadActivityService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const activityService = new ThreadActivityService();

export const recordActivity = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { type, metadata } = req.body;
    const userId = req.user.id;

    const activity = await activityService.recordActivity(threadId, userId, type, metadata);
    res.json(activity);
  } catch (error) {
    logger.error('Error recording thread activity:', error);
    handleError(error, res);
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { limit } = req.query;
    const activities = await activityService.getRecentActivities(
      threadId,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(activities);
  } catch (error) {
    logger.error('Error getting recent activities:', error);
    handleError(error, res);
  }
};

export const getActivitySummary = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { days } = req.query;
    const summary = await activityService.getActivitySummary(
      threadId,
      days ? parseInt(days as string) : undefined
    );
    res.json(summary);
  } catch (error) {
    logger.error('Error getting activity summary:', error);
    handleError(error, res);
  }
};

export const cleanupOldActivities = async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    await activityService.cleanupOldActivities(days ? parseInt(days as string) : undefined);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error cleaning up old activities:', error);
    handleError(error, res);
  }
}; 