import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  subscribeToThreadActivity,
  unsubscribeFromThreadActivity,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSubscribedThreads
} from '../controllers/threadActivityNotification';

const router = express.Router();

// Subscribe to thread activity notifications
router.post('/:threadId/subscribe', authenticateToken, subscribeToThreadActivity);

// Unsubscribe from thread activity notifications
router.post('/:threadId/unsubscribe', authenticateToken, unsubscribeFromThreadActivity);

// Get notification preferences for a thread
router.get('/:threadId/preferences', authenticateToken, getNotificationPreferences);

// Update notification preferences for a thread
router.put('/:threadId/preferences', authenticateToken, updateNotificationPreferences);

// Get all threads user is subscribed to
router.get('/subscribed', authenticateToken, getSubscribedThreads);

export default router; 