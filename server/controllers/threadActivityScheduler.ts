import { Request, Response } from 'express';
import { ThreadActivitySchedulerService } from '../services/threadActivitySchedulerService';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const schedulerService = new ThreadActivitySchedulerService();

export const createScheduledExport = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { frequency, format, timeOfDay, threadId } = req.body;

    const schedule = await schedulerService.createScheduledExport(userId, {
      frequency,
      format,
      timeOfDay,
      threadId
    });

    res.status(201).json(schedule);
  } catch (error) {
    logger.error('Error creating scheduled export:', error);
    handleError(error, res);
  }
};

export const updateScheduledExport = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const schedule = await schedulerService.updateScheduledExport(
      userId,
      id,
      updates
    );

    res.json(schedule);
  } catch (error) {
    logger.error('Error updating scheduled export:', error);
    handleError(error, res);
  }
};

export const deleteScheduledExport = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await schedulerService.deleteScheduledExport(userId, id);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting scheduled export:', error);
    handleError(error, res);
  }
};

export const getUserScheduledExports = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const schedules = await schedulerService.getUserScheduledExports(userId);

    res.json(schedules);
  } catch (error) {
    logger.error('Error getting user scheduled exports:', error);
    handleError(error, res);
  }
};

export const getExportResults = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const results = await schedulerService.getExportResults(id, userId);

    res.json(results);
  } catch (error) {
    logger.error('Error getting export results:', error);
    handleError(error, res);
  }
}; 