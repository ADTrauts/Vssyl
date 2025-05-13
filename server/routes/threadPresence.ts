import express, { Request } from 'express';
import { authenticateToken } from '../middleware/auth';
import { presenceLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { prisma } from '../prismaClient';
import { User, ThreadPresence } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
    isAdmin?: boolean;
  };
}

const router = express.Router();

// Get active users in a thread
router.get('/:threadId', authenticateToken, presenceLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const activeUsers = await prisma.user.findMany({
      where: {
        ThreadPresence: {
          some: {
            threadId: req.params.threadId,
            lastActive: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        ThreadPresence: {
          where: {
            threadId: req.params.threadId
          },
          select: {
            lastActive: true,
            status: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const formattedUsers = activeUsers.map(user => ({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      lastActive: user.ThreadPresence[0]?.lastActive || new Date(),
      status: user.ThreadPresence[0]?.status || 'offline'
    }));

    res.json(formattedUsers);
  } catch (error) {
    logger.error('Error fetching active users:', error);
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

// Update user presence in a thread
router.post('/:threadId', authenticateToken, presenceLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await prisma.threadPresence.upsert({
      where: {
        threadId_userId: {
          userId: req.user.id,
          threadId: req.params.threadId
        }
      },
      update: {
        lastActive: new Date(),
        status: 'online'
      },
      create: {
        userId: req.user.id,
        threadId: req.params.threadId,
        lastActive: new Date(),
        status: 'online'
      }
    });

    res.json({ message: 'Presence updated' });
  } catch (error) {
    logger.error('Error updating presence:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

export default router; 