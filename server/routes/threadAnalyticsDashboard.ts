import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getThreadEngagementMetrics,
  getThreadActivityTimeline,
  getTopContributors
} from '../controllers/threadAnalyticsDashboard';

const router = express.Router();

// Get thread engagement metrics
router.get('/:threadId/metrics', authenticateToken, getThreadEngagementMetrics);

// Get thread activity timeline
router.get('/:threadId/timeline', authenticateToken, getThreadActivityTimeline);

// Get top contributors for a thread
router.get('/:threadId/contributors', authenticateToken, getTopContributors);

export default router; 