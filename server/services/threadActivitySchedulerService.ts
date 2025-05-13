import { prisma } from '../prismaClient';
import { ThreadActivityExport, ExportSchedule, ExportFormat } from '@prisma/client';
import { logger } from '../utils/logger';
import { addDays, addWeeks, addMonths, isAfter } from 'date-fns';
import { ThreadActivityExportService } from './threadActivityExportService';

export class ThreadActivitySchedulerService {
  private exportService: ThreadActivityExportService;

  constructor() {
    this.exportService = new ThreadActivityExportService();
  }

  async createScheduledExport(
    userId: string,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      format: ExportFormat;
      timeOfDay: string;
      threadId?: string;
    }
  ) {
    try {
      const nextRunAt = this.calculateNextRunTime(schedule.timeOfDay);
      
      const scheduledExport = await prisma.exportSchedule.create({
        data: {
          userId,
          frequency: schedule.frequency,
          format: schedule.format,
          timeOfDay: schedule.timeOfDay,
          threadId: schedule.threadId,
          nextRunAt,
          isActive: true
        }
      });

      return scheduledExport;
    } catch (error) {
      logger.error('Error creating scheduled export:', error);
      throw error;
    }
  }

  async updateScheduledExport(
    userId: string,
    scheduleId: string,
    updates: {
      frequency?: 'daily' | 'weekly' | 'monthly';
      format?: ExportFormat;
      timeOfDay?: string;
      isActive?: boolean;
    }
  ) {
    try {
      const schedule = await prisma.exportSchedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule || schedule.userId !== userId) {
        throw new Error('Schedule not found or unauthorized');
      }

      const nextRunAt = updates.timeOfDay 
        ? this.calculateNextRunTime(updates.timeOfDay)
        : schedule.nextRunAt;

      const updatedSchedule = await prisma.exportSchedule.update({
        where: { id: scheduleId },
        data: {
          ...updates,
          nextRunAt
        }
      });

      return updatedSchedule;
    } catch (error) {
      logger.error('Error updating scheduled export:', error);
      throw error;
    }
  }

  async deleteScheduledExport(userId: string, scheduleId: string) {
    try {
      const schedule = await prisma.exportSchedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule || schedule.userId !== userId) {
        throw new Error('Schedule not found or unauthorized');
      }

      await prisma.exportSchedule.delete({
        where: { id: scheduleId }
      });
    } catch (error) {
      logger.error('Error deleting scheduled export:', error);
      throw error;
    }
  }

  async getUserScheduledExports(userId: string) {
    try {
      return await prisma.exportSchedule.findMany({
        where: { userId },
        orderBy: { nextRunAt: 'asc' }
      });
    } catch (error) {
      logger.error('Error getting user scheduled exports:', error);
      throw error;
    }
  }

  async processScheduledExports() {
    try {
      const now = new Date();
      const schedules = await prisma.exportSchedule.findMany({
        where: {
          isActive: true,
          nextRunAt: {
            lte: now
          }
        }
      });

      for (const schedule of schedules) {
        try {
          await this.processExport(schedule);
          
          // Update next run time
          const nextRunAt = this.calculateNextRunTime(schedule.timeOfDay, schedule.frequency);
          await prisma.exportSchedule.update({
            where: { id: schedule.id },
            data: { nextRunAt }
          });
        } catch (error) {
          logger.error(`Error processing scheduled export ${schedule.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing scheduled exports:', error);
      throw error;
    }
  }

  private async processExport(schedule: ExportSchedule) {
    try {
      const { data, filename } = await this.exportService.exportActivity(
        schedule.userId,
        schedule.threadId,
        schedule.format
      );

      // Store export result
      await prisma.threadActivityExport.create({
        data: {
          userId: schedule.userId,
          scheduleId: schedule.id,
          filename,
          format: schedule.format,
          status: 'completed',
          downloadUrl: `/api/exports/${filename}`
        }
      });

      // TODO: Send notification to user about completed export
    } catch (error) {
      logger.error('Error processing export:', error);
      throw error;
    }
  }

  private calculateNextRunTime(
    timeOfDay: string,
    frequency: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const now = new Date();
    let nextRun = new Date(now);
    
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (isAfter(now, nextRun)) {
      switch (frequency) {
        case 'daily':
          nextRun = addDays(nextRun, 1);
          break;
        case 'weekly':
          nextRun = addWeeks(nextRun, 1);
          break;
        case 'monthly':
          nextRun = addMonths(nextRun, 1);
          break;
      }
    }
    
    return nextRun;
  }

  async getExportResults(scheduleId: string, userId: string) {
    try {
      const schedule = await prisma.exportSchedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule || schedule.userId !== userId) {
        throw new Error('Schedule not found or unauthorized');
      }

      return await prisma.threadActivityExport.findMany({
        where: { scheduleId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error getting export results:', error);
      throw error;
    }
  }
} 