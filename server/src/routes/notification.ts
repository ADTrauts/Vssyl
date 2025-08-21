import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  getNotificationStats,
  createNotificationForUser
} from '../controllers/notificationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get notifications for current user
router.get('/', getNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Create notification for current user
router.post('/', createNotification);

// Mark notification as read
router.post('/:id/read', markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Delete multiple notifications
router.delete('/bulk', deleteMultipleNotifications);

// Create notification for another user (admin only)
router.post('/for-user', createNotificationForUser);

export default router; 