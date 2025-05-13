import express from 'express';
import { authenticate } from '../middleware/auth';
import { engagementHeatmapLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { EngagementHeatmapService } from '../services/engagementHeatmapService';

const router = express.Router();
const engagementHeatmapService = new EngagementHeatmapService();

// Get thread engagement heatmap
router.get('/threads/:threadId/heatmap', authenticate, engagementHeatmapLimiter, async (req, res) => {
  try {
    const { threadId } = req.params;
    const heatmap = await engagementHeatmapService.getThreadEngagementHeatmap(threadId);
    res.json(heatmap);
  } catch (error) {
    logger.error('Error getting thread engagement heatmap:', error);
    res.status(500).json({ error: 'Failed to get thread engagement heatmap' });
  }
});

// Get user engagement heatmap
router.get('/users/:userId/heatmap', authenticate, engagementHeatmapLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const heatmap = await engagementHeatmapService.getUserEngagementHeatmap(userId);
    res.json(heatmap);
  } catch (error) {
    logger.error('Error getting user engagement heatmap:', error);
    res.status(500).json({ error: 'Failed to get user engagement heatmap' });
  }
});

// Get top engaged threads
router.get('/threads/top-engaged', authenticate, engagementHeatmapLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const threads = await engagementHeatmapService.getTopEngagedThreads(limit);
    res.json(threads);
  } catch (error) {
    logger.error('Error getting top engaged threads:', error);
    res.status(500).json({ error: 'Failed to get top engaged threads' });
  }
});

export default router; 