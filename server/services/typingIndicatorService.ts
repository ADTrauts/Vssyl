import { logger } from '../utils/logger';
import { WebSocketService } from './websocketService';

export class TypingIndicatorService {
  private typingUsers: Map<string, Set<string>> = new Map(); // threadId -> Set<userId>
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map(); // userId -> timeout

  constructor(private wsService: WebSocketService) {}

  startTyping(threadId: string, userId: string) {
    try {
      // Clear any existing timeout for this user
      this.clearUserTimeout(userId);

      // Add user to typing set for this thread
      if (!this.typingUsers.has(threadId)) {
        this.typingUsers.set(threadId, new Set());
      }
      this.typingUsers.get(threadId)?.add(userId);

      // Set a timeout to remove the typing indicator after 5 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(threadId, userId);
      }, 5000);

      this.typingTimeouts.set(userId, timeout);

      // Broadcast typing status to all users in the thread
      this.broadcastTypingStatus(threadId);
    } catch (error) {
      logger.error('Error in startTyping:', error);
    }
  }

  stopTyping(threadId: string, userId: string) {
    try {
      this.clearUserTimeout(userId);
      
      const typingSet = this.typingUsers.get(threadId);
      if (typingSet) {
        typingSet.delete(userId);
        if (typingSet.size === 0) {
          this.typingUsers.delete(threadId);
        }
      }

      this.broadcastTypingStatus(threadId);
    } catch (error) {
      logger.error('Error in stopTyping:', error);
    }
  }

  private clearUserTimeout(userId: string) {
    const timeout = this.typingTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(userId);
    }
  }

  private broadcastTypingStatus(threadId: string) {
    const typingSet = this.typingUsers.get(threadId);
    const typingUsers = typingSet ? Array.from(typingSet) : [];

    this.wsService.broadcastToThread(threadId, {
      type: 'typing:update',
      data: {
        threadId,
        typingUsers
      }
    });
  }

  getTypingUsers(threadId: string): string[] {
    const typingSet = this.typingUsers.get(threadId);
    return typingSet ? Array.from(typingSet) : [];
  }
} 