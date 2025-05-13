import { WebSocketService } from './websocketService';
import { logger } from '../utils/logger';
import prisma from '../prismaClient';

export class RealtimeActivityService {
  private static instance: RealtimeActivityService;
  private wsService: WebSocketService;

  private constructor() {
    this.wsService = WebSocketService.getInstance();
  }

  public static getInstance(): RealtimeActivityService {
    if (!RealtimeActivityService.instance) {
      RealtimeActivityService.instance = new RealtimeActivityService();
    }
    return RealtimeActivityService.instance;
  }

  // Handle new message in thread
  public async handleNewMessage(threadId: string, message: any) {
    try {
      // Get thread participants
      const participants = await prisma.threadParticipant.findMany({
        where: { threadId },
        select: { userId: true }
      });

      // Emit activity to thread subscribers
      this.wsService.emitThreadActivity(threadId, {
        type: 'message',
        data: message,
        timestamp: new Date()
      });

      // Emit activity to each participant
      participants.forEach(participant => {
        this.wsService.emitUserActivity(participant.userId, {
          type: 'thread_message',
          threadId,
          data: message,
          timestamp: new Date()
        });
      });

      // Clear relevant caches
      await this.wsService.clearCacheAndNotify(`thread:${threadId}`);
      participants.forEach(participant => {
        this.wsService.clearCacheAndNotify(`user:${participant.userId}`);
      });

      logger.info(`Handled new message in thread ${threadId}`);
    } catch (error) {
      logger.error('Error handling new message:', error);
    }
  }

  // Handle thread update
  public async handleThreadUpdate(threadId: string, update: any) {
    try {
      // Get thread participants
      const participants = await prisma.threadParticipant.findMany({
        where: { threadId },
        select: { userId: true }
      });

      // Emit update to thread subscribers
      this.wsService.emitThreadActivity(threadId, {
        type: 'thread_update',
        data: update,
        timestamp: new Date()
      });

      // Emit update to each participant
      participants.forEach(participant => {
        this.wsService.emitUserActivity(participant.userId, {
          type: 'thread_update',
          threadId,
          data: update,
          timestamp: new Date()
        });
      });

      // Clear relevant caches
      await this.wsService.clearCacheAndNotify(`thread:${threadId}`);
      participants.forEach(participant => {
        this.wsService.clearCacheAndNotify(`user:${participant.userId}`);
      });

      logger.info(`Handled thread update for thread ${threadId}`);
    } catch (error) {
      logger.error('Error handling thread update:', error);
    }
  }

  // Handle user activity
  public async handleUserActivity(userId: string, activity: any) {
    try {
      // Get user's active threads
      const activeThreads = await prisma.threadParticipant.findMany({
        where: { userId },
        select: { threadId: true }
      });

      // Emit activity to user subscribers
      this.wsService.emitUserActivity(userId, {
        type: 'user_activity',
        data: activity,
        timestamp: new Date()
      });

      // Emit activity to each active thread
      activeThreads.forEach(thread => {
        this.wsService.emitThreadActivity(thread.threadId, {
          type: 'participant_activity',
          userId,
          data: activity,
          timestamp: new Date()
        });
      });

      // Clear relevant caches
      await this.wsService.clearCacheAndNotify(`user:${userId}`);
      activeThreads.forEach(thread => {
        this.wsService.clearCacheAndNotify(`thread:${thread.threadId}`);
      });

      logger.info(`Handled user activity for user ${userId}`);
    } catch (error) {
      logger.error('Error handling user activity:', error);
    }
  }

  // Handle recommendation updates
  public async handleRecommendationUpdate(userId: string, recommendations: any) {
    try {
      // Emit recommendations to user
      this.wsService.emitRecommendations(userId, {
        type: 'recommendations',
        data: recommendations,
        timestamp: new Date()
      });

      // Clear recommendation cache
      await this.wsService.clearCacheAndNotify(`recommendations:${userId}`);

      logger.info(`Handled recommendation update for user ${userId}`);
    } catch (error) {
      logger.error('Error handling recommendation update:', error);
    }
  }
} 