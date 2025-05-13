import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getThreadAnalytics,
  getTrendingThreads,
  getThreadEngagement
} from '../controllers/threadAnalytics';
import { ThreadAnalyticsService } from '../services/threadAnalyticsService';

const router = express.Router();
const analyticsService = new ThreadAnalyticsService();

// Get analytics for a specific thread
router.get('/:threadId', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const analytics = await analyticsService.getThreadAnalytics(threadId);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting thread analytics:', error);
    res.status(500).json({ error: 'Failed to get thread analytics' });
  }
});

// Get engagement metrics for a thread
router.get('/:threadId/engagement', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const metrics = await analyticsService.getEngagementMetrics(threadId);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    res.status(500).json({ error: 'Failed to get engagement metrics' });
  }
});

// Get trending threads
router.get('/trending', authenticateToken, getTrendingThreads);

// Get thread activity timeline
router.get('/:threadId/timeline', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { timeRange = 'week' } = req.query;
    const timeline = await analyticsService.getActivityTimeline(threadId, timeRange as string);
    res.json(timeline);
  } catch (error) {
    console.error('Error getting activity timeline:', error);
    res.status(500).json({ error: 'Failed to get activity timeline' });
  }
});

// Get thread participant stats
router.get('/:threadId/participants', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const stats = await analyticsService.getParticipantStats(threadId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting participant stats:', error);
    res.status(500).json({ error: 'Failed to get participant stats' });
  }
});

export default router; 