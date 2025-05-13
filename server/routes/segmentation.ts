import express from 'express';
import { authenticate } from '../middleware/auth';
import { segmentationLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { UserSegmentationService } from '../services/userSegmentationService';

const router = express.Router();
const segmentationService = new UserSegmentationService();

// Get all user segments
router.get('/segments', authenticate, segmentationLimiter, async (req, res) => {
  try {
    const segments = await segmentationService.getSegments();
    res.json(segments);
  } catch (error) {
    logger.error('Error getting segments:', error);
    res.status(500).json({ error: 'Failed to get segments' });
  }
});

// Get segment statistics
router.get('/segments/:segmentId/stats', authenticate, segmentationLimiter, async (req, res) => {
  try {
    const { segmentId } = req.params;
    const stats = await segmentationService.getSegmentStats(segmentId);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting segment stats:', error);
    res.status(500).json({ error: 'Failed to get segment stats' });
  }
});

// Get users in a segment
router.get('/segments/:segmentId/users', authenticate, segmentationLimiter, async (req, res) => {
  try {
    const { segmentId } = req.params;
    const users = await segmentationService.getSegmentUsers(segmentId);
    res.json(users);
  } catch (error) {
    logger.error('Error getting segment users:', error);
    res.status(500).json({ error: 'Failed to get segment users' });
  }
});

export default router; 