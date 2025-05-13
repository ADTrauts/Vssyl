import { prisma } from '../prismaClient';
import { ThreadActivity, Thread, User, ThreadActivityNotification } from '@prisma/client';
import { logger } from '../utils/logger';

export class ThreadActivityNotificationService {
  // Subscribe a user to thread activity notifications
  async subscribeToThreadActivity(userId: string, threadId: string, notificationTypes: string[]): Promise<void> {
    await prisma.threadActivityNotification.upsert({
      where: {
        userId_threadId: {
          userId,
          threadId
        }
      },
      create: {
        userId,
        threadId,
        notificationTypes,
        isActive: true
      },
      update: {
        notificationTypes,
        isActive: true
      }
    });
  }

  // Unsubscribe a user from thread activity notifications
  async unsubscribeFromThreadActivity(userId: string, threadId: string): Promise<void> {
    await prisma.threadActivityNotification.update({
      where: {
        userId_threadId: {
          userId,
          threadId
        }
      },
      data: {
        isActive: false
      }
    });
  }

  // Get users to notify for a specific activity
  async getUsersToNotify(threadId: string, activityType: string): Promise<Array<{
    userId: string;
    notificationTypes: string[];
  }>> {
    const notifications = await prisma.threadActivityNotification.findMany({
      where: {
        threadId,
        isActive: true,
        notificationTypes: {
          has: activityType
        }
      },
      select: {
        userId: true,
        notificationTypes: true
      }
    });

    return notifications;
  }

  // Get user's notification preferences for a thread
  async getUserNotificationPreferences(userId: string, threadId: string): Promise<{
    isActive: boolean;
    notificationTypes: string[];
  } | null> {
    const notification = await prisma.threadActivityNotification.findUnique({
      where: {
        userId_threadId: {
          userId,
          threadId
        }
      },
      select: {
        isActive: true,
        notificationTypes: true
      }
    });

    return notification;
  }

  // Get all threads a user is subscribed to
  async getUserSubscribedThreads(userId: string): Promise<Array<{
    threadId: string;
    notificationTypes: string[];
  }>> {
    const notifications = await prisma.threadActivityNotification.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        threadId: true,
        notificationTypes: true
      }
    });

    return notifications;
  }

  // Update notification preferences for a user
  async updateNotificationPreferences(
    userId: string,
    threadId: string,
    preferences: {
      isActive?: boolean;
      notificationTypes?: string[];
    }
  ): Promise<void> {
    await prisma.threadActivityNotification.upsert({
      where: {
        userId_threadId: {
          userId,
          threadId
        }
      },
      create: {
        userId,
        threadId,
        isActive: preferences.isActive ?? true,
        notificationTypes: preferences.notificationTypes ?? []
      },
      update: {
        isActive: preferences.isActive,
        notificationTypes: preferences.notificationTypes
      }
    });
  }
} 