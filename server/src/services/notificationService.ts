import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from './chatSocketService';
import { PushNotificationService } from './pushNotificationService';
import { EmailNotificationService } from './emailNotificationService';

export interface CreateNotificationData {
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  userId: string;
}

export interface NotificationTrigger {
  type: 'chat_message' | 'chat_mention' | 'chat_reaction' | 'drive_shared' | 'drive_permission' | 'business_invitation' | 'member_request' | 'system_alert';
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  recipients: string[];
  senderId?: string;
}

export class NotificationService {
  /**
   * Create a notification for a single user
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          body: data.body,
          data: (data.data || {}) as Prisma.InputJsonValue,
          userId: data.userId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Broadcast notification via WebSocket
      try {
        const chatSocketService = getChatSocketService();
        chatSocketService.broadcastNotification(data.userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body || undefined,
          data: notification.data as Record<string, unknown>, // Fix type mismatch
          createdAt: notification.createdAt.toISOString(),
          read: notification.read
        });
      } catch (socketError) {
        console.error('Error broadcasting notification via WebSocket:', socketError);
        // Don't fail notification creation if WebSocket fails
      }

      // Send push notification
      try {
        const pushService = PushNotificationService.getInstance();
        const pushPayload = pushService.createPayloadFromNotification({
          ...notification,
          body: notification.body || undefined, // Fix null vs undefined
          data: notification.data as Record<string, unknown> // Fix type mismatch
        });
        await pushService.sendToUser(data.userId, pushPayload);
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Don't fail notification creation if push notification fails
      }

      // Send email notification
      try {
        const emailService = EmailNotificationService.getInstance();
        if (emailService.isAvailable()) {
          const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { id: true, email: true, name: true }
          });
          
          if (user) {
            const emailTemplate = emailService.createTemplateFromNotification({
              ...notification,
              body: notification.body || undefined, // Fix null vs undefined
              data: notification.data as Record<string, unknown> // Fix type mismatch
            }, user);
            await emailService.sendToUser(data.userId, emailTemplate);
          }
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail notification creation if email notification fails
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createNotificationsForUsers(notifications: CreateNotificationData[]) {
    try {
      const createdNotifications = await prisma.notification.createMany({
        data: notifications.map(n => ({
          type: n.type,
          title: n.title,
          body: n.body,
          data: (n.data || {}) as Prisma.InputJsonValue,
          userId: n.userId
        }))
      });

      // Broadcast notifications via WebSocket
      try {
        const chatSocketService = getChatSocketService();
        notifications.forEach(notification => {
          chatSocketService.broadcastNotification(notification.userId, {
            id: '', // We don't have individual IDs from createMany
            type: notification.type,
            title: notification.title,
            body: notification.body || undefined,
            data: notification.data as Record<string, unknown>, // Fix type mismatch
            createdAt: new Date().toISOString(),
            read: false
          });
        });
      } catch (socketError) {
        console.error('Error broadcasting notifications via WebSocket:', socketError);
        // Don't fail notification creation if WebSocket fails
      }

      return createdNotifications;
    } catch (error) {
      console.error('Error creating notifications for users:', error);
      throw error;
    }
  }

  /**
   * Handle chat-related notifications
   */
  static async handleChatNotification(trigger: NotificationTrigger) {
    const notifications: CreateNotificationData[] = [];

    for (const recipientId of trigger.recipients) {
      // Skip if sender is the same as recipient
      if (trigger.senderId && trigger.senderId === recipientId) {
        continue;
      }

      notifications.push({
        type: trigger.type,
        title: trigger.title,
        body: trigger.body,
        data: trigger.data,
        userId: recipientId
      });
    }

    if (notifications.length > 0) {
      return await this.createNotificationsForUsers(notifications);
    }

    return null;
  }

  /**
   * Handle drive-related notifications
   */
  static async handleDriveNotification(trigger: NotificationTrigger) {
    const notifications: CreateNotificationData[] = [];

    for (const recipientId of trigger.recipients) {
      // Skip if sender is the same as recipient
      if (trigger.senderId && trigger.senderId === recipientId) {
        continue;
      }

      notifications.push({
        type: trigger.type,
        title: trigger.title,
        body: trigger.body,
        data: trigger.data,
        userId: recipientId
      });
    }

    if (notifications.length > 0) {
      return await this.createNotificationsForUsers(notifications);
    }

    return null;
  }

  /**
   * Handle business-related notifications
   */
  static async handleBusinessNotification(trigger: NotificationTrigger) {
    const notifications: CreateNotificationData[] = [];

    for (const recipientId of trigger.recipients) {
      // Skip if sender is the same as recipient
      if (trigger.senderId && trigger.senderId === recipientId) {
        continue;
      }

      notifications.push({
        type: trigger.type,
        title: trigger.title,
        body: trigger.body,
        data: trigger.data,
        userId: recipientId
      });
    }

    if (notifications.length > 0) {
      return await this.createNotificationsForUsers(notifications);
    }

    return null;
  }

  /**
   * Handle system notifications
   */
  static async handleSystemNotification(trigger: NotificationTrigger) {
    const notifications: CreateNotificationData[] = [];

    for (const recipientId of trigger.recipients) {
      notifications.push({
        type: trigger.type,
        title: trigger.title,
        body: trigger.body,
        data: trigger.data,
        userId: recipientId
      });
    }

    if (notifications.length > 0) {
      return await this.createNotificationsForUsers(notifications);
    }

    return null;
  }

  /**
   * Generic notification handler
   */
  static async handleNotification(trigger: NotificationTrigger) {
    switch (trigger.type) {
      case 'chat_message':
      case 'chat_mention':
      case 'chat_reaction':
        return await this.handleChatNotification(trigger);
      
      case 'drive_shared':
      case 'drive_permission':
        return await this.handleDriveNotification(trigger);
      
      case 'business_invitation':
      case 'member_request':
        return await this.handleBusinessNotification(trigger);
      
      case 'system_alert':
        return await this.handleSystemNotification(trigger);
      
      default:
        throw new Error(`Unknown notification type: ${trigger.type}`);
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false,
          deleted: false
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, notificationIds?: string[]) {
    try {
      const where: Record<string, unknown> = {
        userId,
        read: false,
        deleted: false
      };

      if (notificationIds && notificationIds.length > 0) {
        where.id = { in: notificationIds };
      }

      return await prisma.notification.updateMany({
        where,
        data: { read: true }
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }
} 