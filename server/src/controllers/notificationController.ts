import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from '../services/chatSocketService';

// Get all notifications for the current user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      page = 1, 
      limit = 50, 
      type, 
      read, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {
      userId,
      deleted: false
    };

    if (type) {
      where.type = type;
    }

    if (read !== undefined) {
      where.read = read === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { body: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get notifications with sender information
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        [sortBy as string]: sortOrder
      },
      skip,
      take
    });

    // Get total count for pagination
    const total = await prisma.notification.count({ where });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
        deleted: false
      }
    });

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Create a new notification
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { type, title, body, data, userId } = req.body;

    if (!type || !title || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        body,
        data: data || {},
        userId
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

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true },
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

    // Broadcast notification update via WebSocket
    try {
      const chatSocketService = getChatSocketService();
      chatSocketService.broadcastNotificationUpdate(userId, id, { read: true });
    } catch (socketError) {
      console.error('Error broadcasting notification update via WebSocket:', socketError);
      // Don't fail the operation if WebSocket fails
    }

    res.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type } = req.query;

    const where: any = {
      userId,
      read: false,
      deleted: false
    };

    if (type) {
      where.type = type;
    }

    await prisma.notification.updateMany({
      where,
      data: { read: true }
    });

    // Broadcast notification updates via WebSocket
    try {
      const chatSocketService = getChatSocketService();
      chatSocketService.broadcastNotificationUpdate(userId, 'all', { read: true });
    } catch (socketError) {
      console.error('Error broadcasting notification updates via WebSocket:', socketError);
      // Don't fail the operation if WebSocket fails
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { deleted: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Delete multiple notifications
export const deleteMultipleNotifications = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid notification IDs' });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId
      },
      data: { deleted: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
};

// Get notification statistics
export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [
      totalCount,
      unreadCount,
      typeStats
    ] = await Promise.all([
      // Total notifications
      prisma.notification.count({
        where: {
          userId,
          deleted: false
        }
      }),
      // Unread notifications
      prisma.notification.count({
        where: {
          userId,
          read: false,
          deleted: false
        }
      }),
      // Notifications by type
      prisma.notification.groupBy({
        by: ['type'],
        where: {
          userId,
          deleted: false
        },
        _count: {
          type: true
        }
      })
    ]);

    const stats = {
      total: totalCount,
      unread: unreadCount,
      byType: typeStats.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
};

// Create notification for another user (admin or system function)
export const createNotificationForUser = async (req: Request, res: Response) => {
  try {
    const { type, title, body, data, userId } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if current user is admin or has permission to create notifications for others
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true }
    });

    if (currentUser?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (!type || !title || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        body,
        data: data || {},
        userId
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

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating notification for user:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
}; 