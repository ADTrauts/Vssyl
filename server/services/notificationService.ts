import { logger } from '../utils/logger';
import { WebSocketService } from './websocketService';
import { prisma } from '../prismaClient';
import { Notification as PrismaNotification } from '@prisma/client';

interface NotificationMetadata {
  [key: string]: string | number | boolean | Date | null | undefined;
  threadId?: string;
  messageId?: string;
  assignedById?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  title?: string;
}

interface NotificationOptions {
  limit?: number;
  unreadOnly?: boolean;
}

interface UnreadCount {
  total: number;
}

export class NotificationService {
  constructor(private wsService: WebSocketService) {}

  async createNotification(data: {
    userId: string;
    type: string;
    message: string;
    metadata?: NotificationMetadata;
  }): Promise<PrismaNotification> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          message: data.message,
          data: data.metadata || {},
          read: false
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      this.broadcastNotification(notification);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getUserNotifications(userId: string, options: NotificationOptions = {}): Promise<PrismaNotification[]> {
    try {
      return await prisma.notification.findMany({
        where: {
          userId,
          read: options.unreadOnly ? false : undefined
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: options.limit || 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  async markAsRead(notificationId: string): Promise<PrismaNotification> {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      this.broadcastNotificationUpdate(notification);
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      });

      this.broadcastNotificationsUpdate(userId);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<PrismaNotification> {
    try {
      const notification = await prisma.notification.delete({
        where: { id: notificationId }
      });

      this.broadcastNotificationDelete(notification);
      return notification;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async getUnreadCount(userId: string): Promise<UnreadCount> {
    try {
      const count = await prisma.notification.count({
        where: { userId, read: false }
      });

      return { total: count };
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw new Error('Failed to get unread count');
    }
  }

  private broadcastNotification(notification: PrismaNotification): void {
    try {
      this.wsService.emitUserActivity(notification.userId, {
        id: notification.id,
        type: 'notification:new',
        userId: notification.userId,
        timestamp: notification.createdAt,
        data: notification
      });
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
    }
  }

  private broadcastNotificationUpdate(notification: PrismaNotification): void {
    try {
      this.wsService.emitUserActivity(notification.userId, {
        id: notification.id,
        type: 'notification:update',
        userId: notification.userId,
        timestamp: new Date(),
        data: notification
      });
    } catch (error) {
      logger.error('Error broadcasting notification update:', error);
    }
  }

  private broadcastNotificationDelete(notification: PrismaNotification): void {
    try {
      this.wsService.emitUserActivity(notification.userId, {
        id: notification.id,
        type: 'notification:delete',
        userId: notification.userId,
        timestamp: new Date(),
        data: { id: notification.id }
      });
    } catch (error) {
      logger.error('Error broadcasting notification delete:', error);
    }
  }

  private broadcastNotificationsUpdate(userId: string): void {
    try {
      this.wsService.emitUserActivity(userId, {
        id: 'notifications-update',
        type: 'notifications:update',
        userId,
        timestamp: new Date(),
        data: { userId }
      });
    } catch (error) {
      logger.error('Error broadcasting notifications update:', error);
    }
  }
} 