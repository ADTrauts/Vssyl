import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { PushNotificationService, PushSubscription } from '../services/pushNotificationService';

// Save push subscription for the current user
export const savePushSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { endpoint, keys }: PushSubscription = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    const pushService = PushNotificationService.getInstance();
    await pushService.saveSubscription(userId, { endpoint, keys });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
};

// Remove push subscription for the current user
export const removePushSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const pushService = PushNotificationService.getInstance();
    await pushService.removeSubscription(userId, endpoint);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to remove push subscription' });
  }
};

// Get push subscriptions for the current user
export const getPushSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pushService = PushNotificationService.getInstance();
    const subscriptions = await pushService.getUserSubscriptions(userId);

    res.json({ subscriptions });
  } catch (error) {
    console.error('Error getting push subscriptions:', error);
    res.status(500).json({ error: 'Failed to get push subscriptions' });
  }
};

// Get VAPID public key for frontend
export const getVapidPublicKey = async (req: Request, res: Response) => {
  try {
    const pushService = PushNotificationService.getInstance();
    const publicKey = pushService.getVapidPublicKey();

    if (!publicKey) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }

    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
};

// Test push notification (admin only)
export const testPushNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { title = 'Test Notification', body = 'This is a test push notification' } = req.body;

    const pushService = PushNotificationService.getInstance();
    const success = await pushService.sendToUser(userId, {
      title,
      body,
      icon: process.env.NEXT_PUBLIC_APP_URL + '/favicon.ico',
      badge: process.env.NEXT_PUBLIC_APP_URL + '/notification-badge.png',
      tag: 'test',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    if (success) {
      res.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      res.status(400).json({ error: 'No push subscriptions found for user' });
    }
  } catch (error) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
}; 