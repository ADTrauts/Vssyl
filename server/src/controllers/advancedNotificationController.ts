import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../middleware/auth';

export const createNotification = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { type, title, body, targetUserId, priority, scheduledAt } = req.body;

    // Validate required fields
    if (!type || !title || !body) {
      return res.status(400).json({ message: 'Type, title, and body are required' });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        body,
        userId: targetUserId || userId,
        data: { 
          priority: priority || 'MEDIUM',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null 
        },
        read: false,
        createdAt: new Date()
      }
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { page = 1, limit = 20, status, type, businessId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (businessId) where.businessId = businessId;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),

      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const updateNotification = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { id } = req.params;
    const { status, readAt, priority, scheduledAt } = req.body;

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        read: status === 'READ',
        data: {
          priority,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          readAt: readAt ? new Date(readAt) : null
        }
      }
    });

    res.json({
      message: 'Notification updated successfully',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existingNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        read: true
      }
    });

    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { businessId } = req.query;

    const where: any = { userId };
    if (businessId) where.businessId = businessId;

    const [total, unread, pending, read] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.count({ where: { ...where, read: true } })
    ]);

    res.json({
      total,
      unread,
      pending,
      read,
      unreadPercentage: total > 0 ? Math.round((unread / total) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Failed to fetch notification stats' });
  }
};

// Missing functions referenced in routes
export const getGroupedNotifications = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { businessId } = req.query;

    const where: any = { userId };
    if (businessId) where.businessId = businessId;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Group notifications by type
    const grouped = notifications.reduce((acc: any, notification: any) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped notifications:', error);
    res.status(500).json({ message: 'Failed to fetch grouped notifications' });
  }
};

export const getNotificationGroup = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { groupType } = req.params;
    const userId = user.id;
    const { businessId } = req.query;

    const where: any = { userId, type: groupType };
    if (businessId) where.businessId = businessId;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notification group:', error);
    res.status(500).json({ message: 'Failed to fetch notification group' });
  }
};

export const markGroupAsRead = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { groupType } = req.params;
    const userId = user.id;
    const { businessId } = req.body;

    const where: any = { userId, type: groupType, read: false };
    if (businessId) where.businessId = businessId;

    await prisma.notification.updateMany({
      where,
      data: { read: true }
    });

    res.json({ message: 'Group marked as read successfully' });
  } catch (error) {
    console.error('Error marking group as read:', error);
    res.status(500).json({ message: 'Failed to mark group as read' });
  }
};

export const getAdvancedNotificationStats = getNotificationStats; // Alias

export const getNotificationDigest = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { businessId, period = '7d' } = req.query;

    const periodDays = period === '30d' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const where: any = { userId, createdAt: { gte: since } };
    if (businessId) where.businessId = businessId;

    const digest = await prisma.notification.groupBy({
      by: ['type'],
      where,
      _count: true,
      orderBy: { _count: { type: 'desc' } }
    });

    res.json(digest);
  } catch (error) {
    console.error('Error fetching notification digest:', error);
    res.status(500).json({ message: 'Failed to fetch notification digest' });
  }
};

export const getSmartFilters = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = user.id;
    const { businessId } = req.query;

    const where: any = { userId };
    if (businessId) where.businessId = businessId;

    // Get distinct types and priorities for smart filtering
    const [types, priorities] = await Promise.all([
      prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: true
      }),
      prisma.notification.groupBy({
        by: ['data'],
        where,
        _count: true
      })
    ]);

    const filters = {
      types: types.map(t => ({ type: t.type, count: t._count })),
      priorities: ['HIGH', 'MEDIUM', 'LOW'],
      timeRanges: ['today', 'week', 'month'],
      status: ['unread', 'read', 'all']
    };

    res.json(filters);
  } catch (error) {
    console.error('Error fetching smart filters:', error);
    res.status(500).json({ message: 'Failed to fetch smart filters' });
  }
}; 