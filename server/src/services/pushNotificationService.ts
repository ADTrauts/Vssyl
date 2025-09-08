import webpush from 'web-push';
import { prisma } from '../lib/prisma';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationData {
  id: string;
  title: string;
  body?: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface PrismaPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private initialize() {
    if (this.isInitialized) return;

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('⚠️ VAPID keys not found. Push notifications will be disabled.');
      return;
    }

    webpush.setVapidDetails(
      'mailto:notifications@blockonblock.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    this.isInitialized = true;
    console.log('✅ Push notification service initialized');
  }

  /**
   * Save push subscription for a user
   */
  async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint
          }
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date()
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      });

      console.log(`✅ Push subscription saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription for a user
   */
  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint
        }
      });

      console.log(`✅ Push subscription removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing push subscription:', error);
      throw error;
    }
  }

  /**
   * Get all push subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      return subscriptions.map((sub: PrismaPushSubscription) => ({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }));
    } catch (error) {
      console.error('Error getting user push subscriptions:', error);
      return [];
    }
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return false;
    }

    try {
      const subscriptions = await this.getUserSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return false;
      }

      const results = await Promise.allSettled(
        subscriptions.map(subscription => 
          this.sendToSubscription(subscription, payload)
        )
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const totalCount = results.length;

      console.log(`📱 Push notification sent to ${successCount}/${totalCount} devices for user ${userId}`);

      // Clean up failed subscriptions
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const subscription = subscriptions[index];
          this.removeSubscription(userId, subscription.endpoint).catch(console.error);
        }
      });

      return successCount > 0;
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return 0;
    }

    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendToUser(userId, payload))
      );

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      console.log(`📱 Push notification sent to ${successCount}/${userIds.length} users`);
      return successCount;
    } catch (error) {
      console.error('Error sending push notifications to multiple users:', error);
      return 0;
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendToSubscription(subscription: PushSubscription, payload: PushNotificationPayload): Promise<void> {
    try {
      const pushPayload = JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
      });

      await webpush.sendNotification(subscription, pushPayload);
    } catch (error) {
      console.error('Error sending push notification to subscription:', error);
      throw error;
    }
  }

  /**
   * Create push notification payload from notification data
   */
  createPayloadFromNotification(notification: NotificationData): PushNotificationPayload {
    const icon = process.env.NEXT_PUBLIC_APP_URL + '/favicon.ico';
    const badge = process.env.NEXT_PUBLIC_APP_URL + '/notification-badge.png';

    return {
      title: notification.title,
      body: notification.body,
      icon,
      badge,
      tag: notification.type, // Group notifications by type
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...notification.data
      },
      requireInteraction: notification.type === 'system', // System notifications require interaction
      actions: this.getActionsForNotificationType(notification.type)
    };
  }

  /**
   * Get actions for different notification types
   */
  private getActionsForNotificationType(type: string): Array<{ action: string; title: string; icon?: string }> {
    switch (type) {
      case 'chat':
      case 'mentions':
        return [
          { action: 'view', title: 'View Message' },
          { action: 'mark_read', title: 'Mark as Read' }
        ];
      case 'drive':
        return [
          { action: 'view', title: 'View File' },
          { action: 'mark_read', title: 'Mark as Read' }
        ];
      case 'business':
        return [
          { action: 'view', title: 'View Invitation' },
          { action: 'mark_read', title: 'Mark as Read' }
        ];
      default:
        return [
          { action: 'view', title: 'View' },
          { action: 'mark_read', title: 'Mark as Read' }
        ];
    }
  }

  /**
   * Get VAPID public key for frontend
   */
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }
} 