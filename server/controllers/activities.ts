import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/express';

interface ActivityBody {
  type: 'block' | 'unblock' | 'login' | 'logout';
  targetUserId?: string;
  details?: string;
}

export const getActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

export const createActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, targetUserId, details } = req.body as ActivityBody;

    if (!type || !['block', 'unblock', 'login', 'logout'].includes(type)) {
      return res.status(400).json({ message: 'Invalid activity type' });
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        userId: req.user.id,
        targetUserId,
        details
      }
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error creating activity' });
  }
}; 