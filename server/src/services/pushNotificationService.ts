import webpush from 'web-push';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

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
      logger.warn('VAPID keys not found. Push notifications will be disabled.', {
        operation: 'push_notification_vapid_missing'
      });
      return;
    }

    webpush.setVapidDetails(
      'mailto:notifications@blockonblock.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    this.isInitialized = true;
    logger.info('Push notification service initialized', {
      operation: 'push_notification_service_init'
    });
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

      await logger.info('Push subscription saved for user', {
        operation: 'push_notification_subscription_saved',
        userId
      });
    } catch (error) {
      await logger.error('Failed to save push subscription', {
        operation: 'push_notification_save_subscription',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
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

      await logger.info('Push subscription removed for user', {
        operation: 'push_notification_subscription_removed',
        userId
      });
    } catch (error) {
      await logger.error('Failed to remove push subscription', {
        operation: 'push_notification_remove_subscription',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
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
      await logger.error('Failed to get user push subscriptions', {
        operation: 'push_notification_get_subscriptions',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return [];
    }
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      await logger.warn('Push notification service not initialized', {
        operation: 'push_notification_not_initialized'
      });
      return false;
    }

    try {
      const subscriptions = await this.getUserSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        await logger.debug('No push subscriptions found for user', {
          operation: 'push_notification_no_subscriptions',
          userId
        });
        return false;
      }

      const results = await Promise.allSettled(
        subscriptions.map(subscription => 
          this.sendToSubscription(subscription, payload)
        )
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const totalCount = results.length;

      await logger.info('Push notification sent to user devices', {
        operation: 'push_notification_sent',
        userId,
        successCount,
        totalCount
      });

      // Clean up failed subscriptions
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const subscription = subscriptions[index];
          this.removeSubscription(userId, subscription.endpoint).catch(async (err) => {
            await logger.error('Failed to remove invalid subscription', {
              operation: 'push_notification_remove_invalid',
              userId,
              error: {
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined
              }
            });
          });
        }
      });

      return successCount > 0;
    } catch (error) {
      await logger.error('Failed to send push notification to user', {
        operation: 'push_notification_send_to_user',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    if (!this.isInitialized) {
      await logger.warn('Push notification service not initialized', {
        operation: 'push_notification_not_initialized'
      });
      return 0;
    }

    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendToUser(userId, payload))
      );

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      await logger.info('Push notification sent to multiple users', {
        operation: 'push_notification_sent_multiple',
        successCount,
        totalUsers: userIds.length
      });
      return successCount;
    } catch (error) {
      await logger.error('Failed to send push notifications to multiple users', {
        operation: 'push_notification_send_to_multiple',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
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
      await logger.error('Failed to send push notification to subscription', {
        operation: 'push_notification_send_to_subscription',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
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