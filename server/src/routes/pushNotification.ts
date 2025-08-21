import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptions,
  getVapidPublicKey,
  testPushNotification
} from '../controllers/pushNotificationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Save push subscription
router.post('/subscriptions', savePushSubscription);

// Remove push subscription
router.delete('/subscriptions', removePushSubscription);

// Get user's push subscriptions
router.get('/subscriptions', getPushSubscriptions);

// Get VAPID public key
router.get('/vapid-public-key', getVapidPublicKey);

// Test push notification (admin only)
router.post('/test', testPushNotification);

export default router; 