import { prisma } from '../prismaClient';
import { ThreadPresence, Thread, User } from '@prisma/client';
import { logger } from '../utils/logger';

export class ThreadPresenceService {
  // Update user presence in a thread
  async updatePresence(threadId: string, userId: string, status: 'online' | 'offline' | 'away'): Promise<ThreadPresence> {
    return prisma.threadPresence.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId
        }
      },
      create: {
        threadId,
        userId,
        status,
        lastActive: new Date()
      },
      update: {
        status,
        lastActive: new Date()
      }
    });
  }

  // Get all users currently present in a thread
  async getThreadPresence(threadId: string): Promise<Array<{
    user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    status: string;
    lastActive: Date;
  }>> {
    const presence = await prisma.threadPresence.findMany({
      where: {
        threadId,
        lastActive: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
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

    return presence.map(p => ({
      user: p.user,
      status: p.status,
      lastActive: p.lastActive
    }));
  }

  // Get all threads where a user is present
  async getUserThreadPresence(userId: string): Promise<Array<{
    thread: Pick<Thread, 'id'>;
    status: string;
    lastActive: Date;
  }>> {
    const presence = await prisma.threadPresence.findMany({
      where: {
        userId,
        lastActive: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      include: {
        thread: {
          select: {
            id: true
          }
        }
      }
    });

    return presence.map(p => ({
      thread: p.thread,
      status: p.status,
      lastActive: p.lastActive
    }));
  }

  // Mark user as offline in all threads
  async markUserOffline(userId: string): Promise<void> {
    await prisma.threadPresence.updateMany({
      where: {
        userId,
        status: 'online'
      },
      data: {
        status: 'offline',
        lastActive: new Date()
      }
    });
  }

  // Clean up old presence records
  async cleanupOldPresence(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.threadPresence.deleteMany({
      where: {
        lastActive: {
          lt: fiveMinutesAgo
        }
      }
    });
  }
} 