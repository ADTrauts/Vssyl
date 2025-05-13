import { Request, Response } from 'express';
import { ThreadAnalyticsDashboardService } from '../services/threadAnalyticsDashboardService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const dashboardService = new ThreadAnalyticsDashboardService();

export const getThreadEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const metrics = await dashboardService.getThreadEngagementMetrics(threadId);
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting thread engagement metrics:', error);
    handleError(error, res);
  }
};

export const getThreadActivityTimeline = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { days } = req.query;
    const timeline = await dashboardService.getThreadActivityTimeline(
      threadId,
      days ? parseInt(days as string) : undefined
    );
    res.json(timeline);
  } catch (error) {
    logger.error('Error getting thread activity timeline:', error);
    handleError(error, res);
  }
};

export const getTopContributors = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { limit } = req.query;
    const contributors = await dashboardService.getTopContributors(
      threadId,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(contributors);
  } catch (error) {
    logger.error('Error getting top contributors:', error);
    handleError(error, res);
  }
}; 