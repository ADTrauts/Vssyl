import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  exportActivityData,
  exportThreadActivities,
  exportUserActivities,
  createScheduledExport,
  updateScheduledExport,
  deleteScheduledExport,
  getUserScheduledExports
} from '../controllers/threadActivityExport';
import { exportLimiter } from '../middleware/rateLimit';
import { validateActivityExport, validateScheduledExport } from '../middleware/validation';

const router = express.Router();

// Main export endpoint
router.post('/', authenticateToken, exportLimiter, validateActivityExport, exportActivityData);

// Thread-specific exports
router.get('/thread/:threadId', authenticateToken, exportLimiter, validateActivityExport, exportThreadActivities);

// User-specific exports
router.get('/user', authenticateToken, exportLimiter, validateActivityExport, exportUserActivities);

// Scheduled exports
router.post('/scheduled', authenticateToken, exportLimiter, validateScheduledExport, createScheduledExport);
router.put('/scheduled/:id', authenticateToken, exportLimiter, validateScheduledExport, updateScheduledExport);
router.delete('/scheduled/:id', authenticateToken, exportLimiter, deleteScheduledExport);
router.get('/scheduled', authenticateToken, exportLimiter, getUserScheduledExports);

export default router; 