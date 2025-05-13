import { Request, Response } from 'express';
import { ThreadSearchService, ThreadSearchFilters } from '../services/threadSearchService';
import { handleError } from '../utils/errorHandler';

const searchService = new ThreadSearchService();

export const searchThreads = async (req: Request, res: Response) => {
  try {
    const filters: ThreadSearchFilters = {
      query: req.query.q as string,
      userId: req.user.id,
      pinned: req.query.pinned === 'true' ? true : req.query.pinned === 'false' ? false : undefined,
      starred: req.query.starred === 'true',
      hasReplies: req.query.hasReplies === 'true' ? true : req.query.hasReplies === 'false' ? false : undefined,
      hasReactions: req.query.hasReactions === 'true' ? true : req.query.hasReactions === 'false' ? false : undefined,
      minReplies: req.query.minReplies ? parseInt(req.query.minReplies as string) : undefined,
      minReactions: req.query.minReactions ? parseInt(req.query.minReactions as string) : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      sortBy: req.query.sortBy as ThreadSearchFilters['sortBy'],
      sortOrder: req.query.sortOrder as ThreadSearchFilters['sortOrder'],
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const result = await searchService.searchThreads(filters);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};

export const getThreadSuggestions = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const suggestions = await searchService.getThreadSuggestions(req.user.id, limit);
    res.json(suggestions);
  } catch (error) {
    handleError(error, res);
  }
};

export const getTrendingThreads = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const threads = await searchService.getTrendingThreads(limit);
    res.json(threads);
  } catch (error) {
    handleError(error, res);
  }
}; 