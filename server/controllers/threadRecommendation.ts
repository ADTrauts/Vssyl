import { Request, Response } from 'express';
import { ThreadRecommendationService } from '../services/threadRecommendationService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const recommendationService = new ThreadRecommendationService();

export async function getPersonalizedRecommendations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);

    res.json({ recommendations });
  } catch (error) {
    logger.error('Error getting personalized recommendations:', error);
    handleError(res, error);
  }
}

export const getSimilarThreads = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const similarThreads = await recommendationService.findSimilarThreads(
      threadId,
      limit
    );

    res.json(similarThreads);
  } catch (error) {
    logger.error('Error finding similar threads:', error);
    handleError(error, res);
  }
};

export async function getTrendingThreads(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const threads = await recommendationService.getTrendingThreads(userId, limit);

    res.json({ threads });
  } catch (error) {
    logger.error('Error getting trending threads:', error);
    handleError(res, error);
  }
}

export const getRecommendedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const recommended = await recommendationService.getRecommendedUsers(
      userId,
      Number(limit)
    );

    res.json(recommended);
  } catch (error) {
    logger.error('Error getting recommended users:', error);
    handleError(error, res);
  }
}; 