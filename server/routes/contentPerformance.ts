import express from 'express';
import { authenticate } from '../middleware/auth';
import { contentPerformanceLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { ContentPerformanceService } from '../services/contentPerformanceService';

const router = express.Router();
const contentPerformanceService = new ContentPerformanceService();

// Get performance metrics for a specific thread
router.get('/threads/:threadId/performance', authenticate, contentPerformanceLimiter, async (req, res) => {
  try {
    const { threadId } = req.params;
    const metrics = await contentPerformanceService.getThreadPerformance(threadId);
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting thread performance:', error);
    res.status(500).json({ error: 'Failed to get thread performance metrics' });
  }
});

// Get top performing threads
router.get('/threads/top-performing', authenticate, contentPerformanceLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const threads = await contentPerformanceService.getTopPerformingThreads(limit);
    res.json(threads);
  } catch (error) {
    logger.error('Error getting top performing threads:', error);
    res.status(500).json({ error: 'Failed to get top performing threads' });
  }
});

export default router; 