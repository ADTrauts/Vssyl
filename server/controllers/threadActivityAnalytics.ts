import { Request, Response } from 'express';
import { ThreadActivityAnalyticsService } from '../services/threadActivityAnalyticsService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const analyticsService = new ThreadActivityAnalyticsService();

export const getEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { timeRange = 'week' } = req.query;

    const metrics = await analyticsService.getEngagementMetrics(
      threadId,
      timeRange as 'day' | 'week' | 'month'
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting engagement metrics:', error);
    handleError(error, res);
  }
};

export const getActivityPatterns = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { timeRange = 'week' } = req.query;

    const patterns = await analyticsService.getActivityPatterns(
      threadId,
      timeRange as 'day' | 'week' | 'month'
    );

    res.json(patterns);
  } catch (error) {
    logger.error('Error getting activity patterns:', error);
    handleError(error, res);
  }
};

export const getParticipantMetrics = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { timeRange = 'week' } = req.query;

    const metrics = await analyticsService.getParticipantMetrics(
      threadId,
      timeRange as 'day' | 'week' | 'month'
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting participant metrics:', error);
    handleError(error, res);
  }
};

export const getThreadHealthMetrics = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { timeRange = 'week' } = req.query;

    const metrics = await analyticsService.getThreadHealthMetrics(
      threadId,
      timeRange as 'day' | 'week' | 'month'
    );

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting thread health metrics:', error);
    handleError(error, res);
  }
}; 