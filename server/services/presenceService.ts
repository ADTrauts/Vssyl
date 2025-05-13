import { logger } from '../utils/logger';
import { WebSocketService } from './websocketService';
import prisma from '../prismaClient';

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentThreadId?: string;
}

export class PresenceService {
  private userPresence: Map<string, UserPresence> = new Map();
  private threadPresence: Map<string, Set<string>> = new Map(); // threadId -> Set<userId>

  constructor(private wsService: WebSocketService) {}

  async updateUserPresence(userId: string, status: 'online' | 'away' | 'offline', threadId?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const presence: UserPresence = {
        userId,
        status,
        lastSeen: new Date(),
        currentThreadId: threadId
      };

      this.userPresence.set(userId, presence);

      if (threadId) {
        if (!this.threadPresence.has(threadId)) {
          this.threadPresence.set(threadId, new Set());
        }
        this.threadPresence.get(threadId)?.add(userId);
      }

      this.broadcastPresenceUpdate(userId);
      if (threadId) {
        this.broadcastThreadPresenceUpdate(threadId);
      }
    } catch (error) {
      logger.error('Error updating user presence:', error);
    }
  }

  async markUserAway(userId: string) {
    try {
      const presence = this.userPresence.get(userId);
      if (presence && presence.status === 'online') {
        await this.updateUserPresence(userId, 'away', presence.currentThreadId);
      }
    } catch (error) {
      logger.error('Error marking user as away:', error);
    }
  }

  async markUserOffline(userId: string) {
    try {
      const presence = this.userPresence.get(userId);
      if (presence) {
        await this.updateUserPresence(userId, 'offline');
        
        // Remove from thread presence
        if (presence.currentThreadId) {
          this.threadPresence.get(presence.currentThreadId)?.delete(userId);
          this.broadcastThreadPresenceUpdate(presence.currentThreadId);
        }
      }
    } catch (error) {
      logger.error('Error marking user as offline:', error);
    }
  }

  getUserPresence(userId: string): UserPresence | undefined {
    return this.userPresence.get(userId);
  }

  getThreadPresence(threadId: string): string[] {
    return Array.from(this.threadPresence.get(threadId) || []);
  }

  private broadcastPresenceUpdate(userId: string) {
    try {
      const presence = this.userPresence.get(userId);
      if (presence) {
        this.wsService.broadcastToUser(userId, {
          type: 'presence:update',
          data: presence
        });
      }
    } catch (error) {
      logger.error('Error broadcasting presence update:', error);
    }
  }

  private broadcastThreadPresenceUpdate(threadId: string) {
    try {
      const userIds = this.getThreadPresence(threadId);
      const presences = userIds
        .map(userId => this.userPresence.get(userId))
        .filter((presence): presence is UserPresence => presence !== undefined);

      this.wsService.broadcastToThread(threadId, {
        type: 'thread:presence',
        data: {
          threadId,
          presences
        }
      });
    } catch (error) {
      logger.error('Error broadcasting thread presence update:', error);
    }
  }
} 