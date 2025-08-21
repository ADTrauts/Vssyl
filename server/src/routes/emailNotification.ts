import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  testEmailService,
  getEmailServiceStatus,
  sendEmailNotification,
  getUserEmailPreferences,
  updateUserEmailPreferences
} from '../controllers/emailNotificationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get email service status
router.get('/status', getEmailServiceStatus);

// Get user email preferences
router.get('/preferences', getUserEmailPreferences);

// Update user email preferences
router.put('/preferences', updateUserEmailPreferences);

// Test email service (admin only)
router.post('/test', testEmailService);

// Send email notification (admin only)
router.post('/send', sendEmailNotification);

export default router; 