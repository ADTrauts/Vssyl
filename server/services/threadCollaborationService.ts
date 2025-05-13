import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { WebSocketService } from './websocketService';
import { prisma } from '../prismaClient';

const prismaClient = new PrismaClient();

interface CursorPosition {
  line: number;
  column: number;
}

interface UserCursor {
  userId: string;
  position: CursorPosition;
  color: string;
  name: string;
}

interface Collaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
}

interface Comment {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Insight {
  id: string;
  threadId: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ThreadCollaborationService {
  private activeCursors: Map<string, Map<string, UserCursor>> = new Map(); // threadId -> Map<userId, cursor>
  private editLocks: Map<string, string | null> = new Map(); // threadId -> userId | null
  private cursorColors: Map<string, string> = new Map(); // userId -> color
  private prisma: PrismaClient;

  constructor(private wsService: WebSocketService) {
    this.prisma = prisma;
  }

  // Mention Management
  async createMention(threadId: string, mentionedById: string, mentionedToId: string) {
    try {
      const mention = await prismaClient.threadMention.create({
        data: {
          threadId,
          mentionedById,
          mentionedToId,
        },
        include: {
          thread: true,
          mentionedBy: true,
          mentionedTo: true,
        },
      });

      // Create notification for the mention
      await this.createNotification({
        type: 'mention',
        threadId,
        userId: mentionedToId,
        createdById: mentionedById,
        metadata: {
          mentionId: mention.id,
        },
      });

      return mention;
    } catch (error) {
      logger.error('Error creating mention:', error);
      throw error;
    }
  }

  // Notification Management
  async createNotification(data: {
    type: string;
    threadId: string;
    userId: string;
    createdById: string;
    metadata?: any;
  }) {
    try {
      return await prismaClient.threadNotification.create({
        data: {
          type: data.type,
          threadId: data.threadId,
          userId: data.userId,
          createdById: data.createdById,
          metadata: data.metadata,
        },
        include: {
          thread: true,
          user: true,
          createdBy: true,
        },
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      return await prismaClient.threadNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Assignment Management
  async createAssignment(threadId: string, assignedToId: string, assignedById: string, dueDate?: Date) {
    try {
      const assignment = await prismaClient.threadAssignment.create({
        data: {
          threadId,
          assignedToId,
          assignedById,
          dueDate,
        },
        include: {
          thread: true,
          assignedTo: true,
          assignedBy: true,
        },
      });

      // Create notification for the assignment
      await this.createNotification({
        type: 'assignment',
        threadId,
        userId: assignedToId,
        createdById: assignedById,
        metadata: {
          assignmentId: assignment.id,
          dueDate,
        },
      });

      return assignment;
    } catch (error) {
      logger.error('Error creating assignment:', error);
      throw error;
    }
  }

  async updateAssignmentStatus(assignmentId: string, status: string) {
    try {
      return await prismaClient.threadAssignment.update({
        where: { id: assignmentId },
        data: { status },
        include: {
          thread: true,
          assignedTo: true,
          assignedBy: true,
        },
      });
    } catch (error) {
      logger.error('Error updating assignment status:', error);
      throw error;
    }
  }

  // Collaborator Management
  async addCollaborator(threadId: string, userId: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN' = 'EDITOR') {
    try {
      const collaborator = await this.prisma.threadCollaborator.create({
        data: {
          threadId,
          userId,
          role
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

      return collaborator;
    } catch (error) {
      logger.error('Error adding collaborator:', error);
      throw error;
    }
  }

  async updateCollaboratorRole(threadId: string, userId: string, role: 'owner' | 'editor' | 'viewer'): Promise<Collaborator> {
    try {
      const collaborator = await prismaClient.threadCollaborator.update({
        where: {
          threadId_userId: {
            threadId,
            userId
          }
        },
        data: { role }
      });

      return collaborator;
    } catch (error) {
      logger.error('Error updating collaborator role:', error);
      throw error;
    }
  }

  async removeCollaborator(threadId: string, userId: string) {
    try {
      await this.prisma.threadCollaborator.delete({
        where: {
          threadId_userId: {
            threadId,
            userId
          }
        }
      });
    } catch (error) {
      logger.error('Error removing collaborator:', error);
      throw error;
    }
  }

  // Edit Management
  async createEdit(threadId: string, userId: string, content: string) {
    try {
      return await prismaClient.threadEdit.create({
        data: {
          threadId,
          userId,
          content,
        },
        include: {
          thread: true,
          user: true,
        },
      });
    } catch (error) {
      logger.error('Error creating edit:', error);
      throw error;
    }
  }

  // Get Methods
  async getThreadMentions(threadId: string) {
    try {
      return await prismaClient.threadMention.findMany({
        where: { threadId },
        include: {
          mentionedBy: true,
          mentionedTo: true,
        },
      });
    } catch (error) {
      logger.error('Error getting thread mentions:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit: number = 20) {
    try {
      return await prismaClient.threadNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          thread: true,
          createdBy: true,
        },
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async getThreadAssignments(threadId: string) {
    try {
      return await prismaClient.threadAssignment.findMany({
        where: { threadId },
        include: {
          assignedTo: true,
          assignedBy: true,
        },
      });
    } catch (error) {
      logger.error('Error getting thread assignments:', error);
      throw error;
    }
  }

  async getThreadCollaborators(threadId: string): Promise<Collaborator[]> {
    try {
      const collaborators = await this.prisma.threadCollaborator.findMany({
        where: { threadId },
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

      return collaborators;
    } catch (error) {
      logger.error('Error getting thread collaborators:', error);
      throw error;
    }
  }

  async getThreadEdits(threadId: string, limit: number = 20) {
    try {
      return await prismaClient.threadEdit.findMany({
        where: { threadId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: true,
        },
      });
    } catch (error) {
      logger.error('Error getting thread edits:', error);
      throw error;
    }
  }

  async updateCursor(threadId: string, userId: string, position: CursorPosition) {
    try {
      if (!this.activeCursors.has(threadId)) {
        this.activeCursors.set(threadId, new Map());
      }

      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const cursorColor = this.getUserCursorColor(userId);
      const cursor: UserCursor = {
        userId,
        position,
        color: cursorColor,
        name: user.name
      };

      this.activeCursors.get(threadId)?.set(userId, cursor);
      this.broadcastCursorUpdate(threadId);
    } catch (error) {
      logger.error('Error updating cursor:', error);
    }
  }

  async requestEditLock(threadId: string, userId: string): Promise<boolean> {
    try {
      const currentLock = this.editLocks.get(threadId);
      
      if (currentLock === null || currentLock === userId) {
        this.editLocks.set(threadId, userId);
        this.broadcastEditLockUpdate(threadId);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error requesting edit lock:', error);
      return false;
    }
  }

  releaseEditLock(threadId: string, userId: string) {
    try {
      const currentLock = this.editLocks.get(threadId);
      if (currentLock === userId) {
        this.editLocks.set(threadId, null);
        this.broadcastEditLockUpdate(threadId);
      }
    } catch (error) {
      logger.error('Error releasing edit lock:', error);
    }
  }

  async broadcastContentUpdate(threadId: string, content: string, userId: string) {
    try {
      this.wsService.broadcastToThread(threadId, {
        type: 'content:update',
        data: {
          threadId,
          content,
          userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error broadcasting content update:', error);
    }
  }

  private broadcastCursorUpdate(threadId: string) {
    try {
      const cursors = this.activeCursors.get(threadId);
      if (cursors) {
        this.wsService.broadcastToThread(threadId, {
          type: 'cursor:update',
          data: {
            threadId,
            cursors: Array.from(cursors.values())
          }
        });
      }
    } catch (error) {
      logger.error('Error broadcasting cursor update:', error);
    }
  }

  private broadcastEditLockUpdate(threadId: string) {
    try {
      const currentLock = this.editLocks.get(threadId);
      this.wsService.broadcastToThread(threadId, {
        type: 'edit:lock',
        data: {
          threadId,
          lockedBy: currentLock
        }
      });
    } catch (error) {
      logger.error('Error broadcasting edit lock update:', error);
    }
  }

  private getUserCursorColor(userId: string): string {
    if (!this.cursorColors.has(userId)) {
      const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FFEEAD', // Yellow
        '#D4A5A5', // Pink
        '#9B59B6', // Purple
        '#E67E22'  // Orange
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      this.cursorColors.set(userId, randomColor);
    }
    return this.cursorColors.get(userId) || '#000000';
  }

  getActiveCursors(threadId: string): UserCursor[] {
    const cursors = this.activeCursors.get(threadId);
    return cursors ? Array.from(cursors.values()) : [];
  }

  getEditLock(threadId: string): string | null {
    return this.editLocks.get(threadId) || null;
  }

  async addComment(threadId: string, userId: string, content: string): Promise<Comment> {
    try {
      const comment = await this.prisma.threadComment.create({
        data: {
          threadId,
          userId,
          content
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

      return comment;
    } catch (error) {
      logger.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(threadId: string, limit: number = 20): Promise<Comment[]> {
    try {
      const comments = await this.prisma.threadComment.findMany({
        where: { threadId },
        orderBy: { createdAt: 'desc' },
        take: limit,
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

      return comments;
    } catch (error) {
      logger.error('Error getting comments:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const comment = await this.prisma.threadComment.update({
        where: { id: commentId },
        data: {
          content,
          updatedAt: new Date()
        }
      });

      return comment;
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await this.prisma.threadComment.delete({
        where: { id: commentId }
      });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  async addInsight(threadId: string, userId: string, type: 'SUMMARY' | 'ACTION_ITEM' | 'DECISION' | 'QUESTION' | 'NOTE', content: any): Promise<Insight> {
    try {
      const insight = await this.prisma.threadInsight.create({
        data: {
          threadId,
          userId,
          type,
          content
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

      return insight;
    } catch (error) {
      logger.error('Error adding insight:', error);
      throw error;
    }
  }

  async getInsights(threadId: string): Promise<Insight[]> {
    try {
      const insights = await this.prisma.threadInsight.findMany({
        where: { threadId },
        orderBy: { createdAt: 'desc' },
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

      return insights;
    } catch (error) {
      logger.error('Error getting insights:', error);
      throw error;
    }
  }

  async updateInsight(insightId: string, updates: Partial<Insight>): Promise<Insight> {
    try {
      const insight = await this.prisma.threadInsight.update({
        where: { id: insightId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      return insight;
    } catch (error) {
      logger.error('Error updating insight:', error);
      throw error;
    }
  }

  async deleteInsight(insightId: string): Promise<void> {
    try {
      await this.prisma.threadInsight.delete({
        where: { id: insightId }
      });
    } catch (error) {
      logger.error('Error deleting insight:', error);
      throw error;
    }
  }

  // Version History
  async createVersion(threadId: string, userId: string, content: any) {
    try {
      const latestVersion = await this.prisma.threadVersion.findFirst({
        where: { threadId },
        orderBy: { version: 'desc' }
      });

      const newVersion = await this.prisma.threadVersion.create({
        data: {
          threadId,
          version: (latestVersion?.version || 0) + 1,
          content,
          createdBy: userId
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

      return newVersion;
    } catch (error) {
      logger.error('Error creating version:', error);
      throw error;
    }
  }

  async getVersions(threadId: string, limit: number = 10) {
    try {
      const versions = await this.prisma.threadVersion.findMany({
        where: { threadId },
        orderBy: { version: 'desc' },
        take: limit,
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

      return versions;
    } catch (error) {
      logger.error('Error getting versions:', error);
      throw error;
    }
  }
} 