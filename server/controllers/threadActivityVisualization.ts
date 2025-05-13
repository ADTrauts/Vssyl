import { Request, Response } from 'express';
import { ThreadActivityService } from '../services/threadActivityService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const threadActivityService = new ThreadActivityService();

function handleError(res: Response, error: any) {
  logger.error('Error in thread activity visualization:', error);
  res.status(500).json({ error: 'Internal server error' });
}

export const getUserActivitySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const timeRange = req.query.timeRange as string || 'week';
    
    const summary = await threadActivityService.getActivitySummary(userId, 7);
    res.json(summary);
  } catch (error) {
    handleError(res, error);
  }
};

export const getThreadActivitySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const summary = await threadActivityService.getActivitySummary(threadId, 7);
    res.json(summary);
  } catch (error) {
    handleError(res, error);
  }
};

export const getActivityTimeline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const timeline = await threadActivityService.getActivityTimeline(threadId, timeRange);
    res.json(timeline);
  } catch (error) {
    handleError(res, error);
  }
};

export const getActivityHeatmap = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const heatmap = await threadActivityService.getActivityHeatmap(threadId, timeRange);
    res.json(heatmap);
  } catch (error) {
    handleError(res, error);
  }
};

export const getActivityMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const metrics = await threadActivityService.getActivityMetrics(threadId, timeRange);
    res.json(metrics);
  } catch (error) {
    handleError(res, error);
  }
};

export const getActivityDistribution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const distribution = await threadActivityService.getActivityDistribution(threadId, timeRange);
    res.json(distribution);
  } catch (error) {
    handleError(res, error);
  }
};

export const getTopParticipants = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const participants = await threadActivityService.getTopParticipants(threadId, timeRange, limit);
    res.json(participants);
  } catch (error) {
    handleError(res, error);
  }
};

export const getActivityTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const trends = await threadActivityService.getActivityTrends(threadId, timeRange);
    res.json(trends);
  } catch (error) {
    handleError(res, error);
  }
};

export const getThreadActivityInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const timeRange = req.query.timeRange as string || 'week';
    
    const insights = await threadActivityService.getThreadActivityInsights(threadId, timeRange);
    res.json(insights);
  } catch (error) {
    handleError(res, error);
  }
};

export const getUserActivityInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const timeRange = req.query.timeRange as string || 'week';
    
    const insights = await threadActivityService.getUserActivityInsights(userId, timeRange);
    res.json(insights);
  } catch (error) {
    handleError(res, error);
  }
};

export const getActivityVisualization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const timeRange = req.query.timeRange as string || 'week';
    
    const data = await threadActivityService.getActivityVisualization(userId, timeRange);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}; 