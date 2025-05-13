import { Request, Response } from 'express';
import { ThreadActivityInsightsService } from '../services/threadActivityInsightsService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const insightsService = new ThreadActivityInsightsService();

export const getThreadInsights = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { timeRange = 'week' } = req.query;

    const insights = await insightsService.getThreadInsights(
      threadId,
      timeRange as 'day' | 'week' | 'month'
    );

    res.json(insights);
  } catch (error) {
    logger.error('Error getting thread insights:', error);
    handleError(error, res);
  }
}; 