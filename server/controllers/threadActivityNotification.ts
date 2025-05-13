import { Request, Response } from 'express';
import { ThreadActivityNotificationService } from '../services/threadActivityNotificationService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const notificationService = new ThreadActivityNotificationService();

export const subscribeToThreadActivity = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { notificationTypes } = req.body;
    const userId = req.user.id;

    await notificationService.subscribeToThreadActivity(userId, threadId, notificationTypes);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error subscribing to thread activity:', error);
    handleError(error, res);
  }
};

export const unsubscribeFromThreadActivity = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    await notificationService.unsubscribeFromThreadActivity(userId, threadId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error unsubscribing from thread activity:', error);
    handleError(error, res);
  }
};

export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const preferences = await notificationService.getUserNotificationPreferences(userId, threadId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error getting notification preferences:', error);
    handleError(error, res);
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { isActive, notificationTypes } = req.body;
    const userId = req.user.id;

    await notificationService.updateNotificationPreferences(userId, threadId, {
      isActive,
      notificationTypes
    });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    handleError(error, res);
  }
};

export const getSubscribedThreads = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const threads = await notificationService.getUserSubscribedThreads(userId);
    res.json(threads);
  } catch (error) {
    logger.error('Error getting subscribed threads:', error);
    handleError(error, res);
  }
}; 