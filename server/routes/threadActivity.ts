import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  recordActivity,
  getRecentActivities,
  getActivitySummary,
  cleanupOldActivities
} from '../controllers/threadActivity';

const router = express.Router();

// Record a new thread activity
router.post('/:threadId', authenticateToken, recordActivity);

// Get recent activities for a thread
router.get('/:threadId/recent', authenticateToken, getRecentActivities);

// Get activity summary for a thread
router.get('/:threadId/summary', authenticateToken, getActivitySummary);

// Clean up old activities (admin only)
router.delete('/cleanup', authenticateToken, cleanupOldActivities);

export default router; 