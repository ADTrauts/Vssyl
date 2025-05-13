import { logger } from '../utils/logger';
import { WebSocketService } from './websocketService';
import prisma from '../prismaClient';

interface ThreadVersion {
  id: string;
  threadId: string;
  content: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  metadata: {
    changes: {
      type: 'insert' | 'delete' | 'replace';
      position: number;
      length: number;
      text?: string;
    }[];
    userAgent?: string;
  };
}

export class ThreadVersionService {
  constructor(private wsService: WebSocketService) {}

  async createVersion(threadId: string, content: string, userId: string, metadata: ThreadVersion['metadata']) {
    try {
      // Get the current version number
      const lastVersion = await prisma.threadVersion.findFirst({
        where: { threadId },
        orderBy: { version: 'desc' },
        select: { version: true }
      });

      const newVersion = (lastVersion?.version || 0) + 1;

      // Create the new version
      const version = await prisma.threadVersion.create({
        data: {
          threadId,
          content,
          version: newVersion,
          createdBy: userId,
          metadata
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      // Update the thread's current content
      await prisma.thread.update({
        where: { id: threadId },
        data: { content }
      });

      // Broadcast the version update
      this.broadcastVersionUpdate(threadId, version);

      return version;
    } catch (error) {
      logger.error('Error creating thread version:', error);
      throw error;
    }
  }

  async getVersions(threadId: string, limit: number = 20) {
    try {
      return await prisma.threadVersion.findMany({
        where: { threadId },
        orderBy: { version: 'desc' },
        take: limit,
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting thread versions:', error);
      throw error;
    }
  }

  async getVersion(threadId: string, version: number) {
    try {
      return await prisma.threadVersion.findFirst({
        where: { threadId, version },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting thread version:', error);
      throw error;
    }
  }

  async rollbackToVersion(threadId: string, version: number, userId: string) {
    try {
      const targetVersion = await this.getVersion(threadId, version);
      if (!targetVersion) {
        throw new Error('Version not found');
      }

      // Create a new version with the rolled back content
      const newVersion = await this.createVersion(
        threadId,
        targetVersion.content,
        userId,
        {
          changes: [{
            type: 'replace',
            position: 0,
            length: targetVersion.content.length,
            text: targetVersion.content
          }],
          userAgent: 'rollback'
        }
      );

      return newVersion;
    } catch (error) {
      logger.error('Error rolling back thread version:', error);
      throw error;
    }
  }

  async compareVersions(threadId: string, version1: number, version2: number) {
    try {
      const [v1, v2] = await Promise.all([
        this.getVersion(threadId, version1),
        this.getVersion(threadId, version2)
      ]);

      if (!v1 || !v2) {
        throw new Error('One or both versions not found');
      }

      // Simple diff implementation - can be enhanced with a proper diff algorithm
      const changes: ThreadVersion['metadata']['changes'] = [];
      const maxLength = Math.max(v1.content.length, v2.content.length);

      for (let i = 0; i < maxLength; i++) {
        if (v1.content[i] !== v2.content[i]) {
          let j = i;
          while (j < maxLength && v1.content[j] !== v2.content[j]) {
            j++;
          }
          changes.push({
            type: 'replace',
            position: i,
            length: j - i,
            text: v2.content.slice(i, j)
          });
          i = j - 1;
        }
      }

      return {
        version1: v1,
        version2: v2,
        changes
      };
    } catch (error) {
      logger.error('Error comparing thread versions:', error);
      throw error;
    }
  }

  private broadcastVersionUpdate(threadId: string, version: ThreadVersion) {
    try {
      this.wsService.broadcastToThread(threadId, {
        type: 'version:update',
        data: version
      });
    } catch (error) {
      logger.error('Error broadcasting version update:', error);
    }
  }
} 