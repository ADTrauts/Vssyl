import { prisma } from '../prismaClient';
import { Thread, ThreadParticipant, ThreadMessage, ThreadStar, Message } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

interface ThreadMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  status?: 'open' | 'closed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  lastActivity?: string;
  participants?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  customFields?: Record<string, string | number | boolean | null>;
}

interface ThreadWithParticipants extends Thread {
  participants: ThreadParticipant[];
}

interface ThreadWithDetails extends Thread {
  parentMessage: (Message & {
    reactions: {
      id: string;
      emoji: string;
      userId: string;
    }[];
  }) | null;
  messages: (ThreadMessage & {
    reactions: {
      id: string;
      emoji: string;
      userId: string;
    }[];
  })[];
  participants: (ThreadParticipant & {
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  })[];
}

export class ThreadManagementService {
  private async validateThreadAccess(threadId: string, userId: string): Promise<ThreadWithParticipants> {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { participants: true }
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const isParticipant = thread.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new UnauthorizedError('User is not a participant in this thread');
    }

    return thread;
  }

  // Pin a thread
  async pinThread(threadId: string, userId: string): Promise<Thread> {
    await this.validateThreadAccess(threadId, userId);

    return prisma.thread.update({
      where: { id: threadId },
      data: { isPinned: true }
    });
  }

  // Unpin a thread
  async unpinThread(threadId: string, userId: string): Promise<Thread> {
    await this.validateThreadAccess(threadId, userId);

    return prisma.thread.update({
      where: { id: threadId },
      data: { isPinned: false }
    });
  }

  // Star a thread
  async starThread(threadId: string, userId: string): Promise<ThreadStar> {
    await this.validateThreadAccess(threadId, userId);

    return prisma.threadStar.create({
      data: {
        threadId,
        userId
      }
    });
  }

  // Unstar a thread
  async unstarThread(threadId: string, userId: string): Promise<void> {
    await prisma.threadStar.deleteMany({
      where: {
        threadId,
        userId
      }
    });
  }

  // Get starred threads for a user
  async getStarredThreads(userId: string): Promise<ThreadWithDetails[]> {
    const starredThreads = await prisma.thread.findMany({
      where: {
        starredBy: {
          some: {
            userId
          }
        }
      },
      include: {
        parentMessage: {
          include: {
            reactions: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            reactions: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return starredThreads;
  }

  // Get pinned threads for a user
  async getPinnedThreads(userId: string): Promise<ThreadWithDetails[]> {
    return prisma.thread.findMany({
      where: {
        isPinned: true,
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        parentMessage: {
          include: {
            reactions: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            reactions: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
  }

  // Update thread metadata
  async updateThreadMetadata(
    threadId: string,
    userId: string,
    metadata: ThreadMetadata
  ): Promise<Thread> {
    await this.validateThreadAccess(threadId, userId);

    return prisma.thread.update({
      where: { id: threadId },
      data: {
        metadata: metadata
      }
    });
  }
} 