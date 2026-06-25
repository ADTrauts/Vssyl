import { Request, Response } from 'express';
import { SearchFilters } from 'vssyl-shared/types/search';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  SearchAccessError,
  executeGlobalSearch,
  getSearchSuggestionsForUser,
} from '../services/searchCapabilityService';

const getUserFromRequest = (req: Request) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return null;
  return { ...user, id: user.id };
};

const handleError = async (res: Response, error: unknown, message: string = 'Internal server error') => {
  const err = error as Error;
  await logger.error('Search controller error', {
    operation: 'search_controller_error',
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    },
  });
  res.status(500).json({ success: false, error: message });
};

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { query, filters }: { query: string; filters?: SearchFilters } = req.body;

    const { results } = await executeGlobalSearch({
      userId: user.id,
      query,
      filters,
    });

    res.json({ success: true, results });
  } catch (error: unknown) {
    if (error instanceof SearchAccessError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    await handleError(res, error, 'Failed to perform global search');
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { q: query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.json({ success: true, suggestions: [] });
    }

    const suggestions = await getSearchSuggestionsForUser(user.id, query);
    res.json({ success: true, suggestions });
  } catch (error: unknown) {
    if (error instanceof SearchAccessError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    await handleError(res, error, 'Failed to get suggestions');
  }
};
