import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  getGroupedNotifications,
  getNotificationGroup,
  markGroupAsRead,
  getAdvancedNotificationStats,
  getNotificationDigest,
  getSmartFilters
} from '../controllers/advancedNotificationController';

const router: express.Router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get grouped notifications with filters
router.get('/grouped', getGroupedNotifications);

// Get notification group by ID
router.get('/grouped/:groupId', getNotificationGroup);

// Mark group as read
router.put('/grouped/:groupId/read', markGroupAsRead);

// Get advanced notification statistics
router.get('/stats/advanced', getAdvancedNotificationStats);

// Get notification digest
router.get('/digest', getNotificationDigest);

// Get smart filters
router.get('/filters', getSmartFilters);

export default router; 