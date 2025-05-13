import { Request, Response } from 'express';
import { ThreadActivityExportService } from '../services/threadActivityExportService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const exportService = new ThreadActivityExportService();

function handleError(res: Response, error: any) {
  logger.error('Error in thread activity export:', error);
  res.status(500).json({ error: 'Internal server error' });
}

export const exportThreadActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { threadId } = req.params;
    const format = req.query.format as string || 'csv';
    
    const exportData = await exportService.exportThreadActivity(threadId, format);
    
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename=thread-${threadId}-activity.${format}`);
    res.send(exportData);
  } catch (error) {
    handleError(res, error);
  }
};

export const exportUserActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const format = req.query.format as string || 'csv';
    
    const exportData = await exportService.exportUserActivity(userId, format);
    
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename=user-${userId}-activity.${format}`);
    res.send(exportData);
  } catch (error) {
    handleError(res, error);
  }
};

export const createScheduledExport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { frequency, format, timeOfDay } = req.body;
    
    const schedule = await exportService.createScheduledExport({
      userId,
      frequency,
      format,
      timeOfDay
    });
    
    res.status(201).json(schedule);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateScheduledExport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    
    const schedule = await exportService.updateScheduledExport(userId, id, updates);
    res.json(schedule);
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteScheduledExport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    await exportService.deleteScheduledExport(userId, id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
};

export const getUserScheduledExports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const schedules = await exportService.getUserScheduledExports(userId);
    res.json(schedules);
  } catch (error) {
    handleError(res, error);
  }
};

export async function exportActivityData(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user.id;
    const { timeRange, startDate, endDate, format } = req.body;
    
    const exportData = await exportService.exportActivityData({
      userId,
      format,
      timeRange,
      startDate,
      endDate
    });
    
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename=activity-export.${format}`);
    res.send(exportData);
  } catch (error) {
    logger.error('Error exporting activity data:', error);
    handleError(res, error);
  }
}

function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
} 