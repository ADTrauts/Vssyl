import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { notificationLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';
import { WebSocketService } from '../services/websocketService';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notifications';

const router = express.Router();
const wsService = WebSocketService.getInstance();
const notificationService = new NotificationService(wsService);

// Get all notifications for the authenticated user
router.get('/', authenticateToken, notificationLimiter, async (req: any, res) => {
  try {
    const { limit, unreadOnly } = req.query;
    const notifications = await notificationService.getUserNotifications(req.user.id, {
      limit: limit ? parseInt(limit as string) : undefined,
      unreadOnly: unreadOnly === 'true'
    });
    res.json(notifications);
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread notification count
router.get('/unread', authenticateToken, notificationLimiter, async (req: any, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json(count);
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.post('/:id/read', authenticateToken, notificationLimiter, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/read-all', authenticateToken, notificationLimiter, async (req: any, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create notification
router.post('/', authenticateToken, notificationLimiter, async (req: any, res) => {
  try {
    const { type, message, metadata } = req.body;
    const notification = await notificationService.createNotification({
      userId: req.user.id,
      type,
      message,
      metadata
    });
    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, notificationLimiter, async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router; 