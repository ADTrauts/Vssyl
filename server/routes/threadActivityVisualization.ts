import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getActivityTimeline,
  getActivityHeatmap,
  getActivityMetrics,
  getActivityVisualization
} from '../controllers/threadActivityVisualization';
import { validateActivityVisualization } from '../middleware/validation';
import { visualizationLimiter } from '../middleware/rateLimit';
import { cache } from '../middleware/cache';

const router = express.Router();

// Get combined activity visualization data
router.get('/', authenticateToken, visualizationLimiter, validateActivityVisualization, cache(300), getActivityVisualization);

// Get activity timeline
router.get('/:threadId/timeline', authenticateToken, visualizationLimiter, validateActivityVisualization, cache(300), getActivityTimeline);

// Get activity heatmap
router.get('/:threadId/heatmap', authenticateToken, visualizationLimiter, validateActivityVisualization, cache(300), getActivityHeatmap);

// Get activity metrics
router.get('/:threadId/metrics', authenticateToken, visualizationLimiter, validateActivityVisualization, cache(300), getActivityMetrics);

export default router; 