import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getEngagementMetrics,
  getActivityPatterns,
  getParticipantMetrics,
  getThreadHealthMetrics
} from '../controllers/threadActivityAnalytics';

const router = express.Router();

// Get engagement metrics for a thread
router.get('/:threadId/engagement', authenticateToken, getEngagementMetrics);

// Get activity patterns for a thread
router.get('/:threadId/patterns', authenticateToken, getActivityPatterns);

// Get participant metrics for a thread
router.get('/:threadId/participants', authenticateToken, getParticipantMetrics);

// Get thread health metrics
router.get('/:threadId/health', authenticateToken, getThreadHealthMetrics);

export default router; 