import { prisma } from '../prismaClient';
import { logger } from '../utils/logger';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

export class ThreadActivityExportService {
  async exportActivityData(params: {
    userId: string;
    format: string;
    timeRange: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const { userId, format, timeRange, startDate, endDate } = params;
      const dateRange = this.getDateRange(timeRange, startDate, endDate);

      const activities = await this.getActivities(userId, dateRange);
      return this.formatExportData(activities, format);
    } catch (error) {
      logger.error('Error exporting activity data:', error);
      throw error;
    }
  }

  async exportThreadActivity(threadId: string, format: string) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          threadId
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return this.formatExportData(activities, format);
    } catch (error) {
      logger.error('Error exporting thread activity:', error);
      throw error;
    }
  }

  async exportUserActivity(userId: string, format: string) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          userId
        },
        include: {
          thread: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return this.formatExportData(activities, format);
    } catch (error) {
      logger.error('Error exporting user activity:', error);
      throw error;
    }
  }

  async createScheduledExport(params: {
    userId: string;
    frequency: string;
    format: string;
    timeOfDay: string;
  }) {
    try {
      const { userId, frequency, format, timeOfDay } = params;

      const schedule = await prisma.scheduledExport.create({
        data: {
          userId,
          frequency,
          format,
          timeOfDay,
          isActive: true
        }
      });

      return schedule;
    } catch (error) {
      logger.error('Error creating scheduled export:', error);
      throw error;
    }
  }

  async updateScheduledExport(userId: string, id: string, updates: any) {
    try {
      const schedule = await prisma.scheduledExport.update({
        where: {
          id,
          userId
        },
        data: updates
      });

      return schedule;
    } catch (error) {
      logger.error('Error updating scheduled export:', error);
      throw error;
    }
  }

  async deleteScheduledExport(userId: string, id: string) {
    try {
      await prisma.scheduledExport.delete({
        where: {
          id,
          userId
        }
      });
    } catch (error) {
      logger.error('Error deleting scheduled export:', error);
      throw error;
    }
  }

  async getUserScheduledExports(userId: string) {
    try {
      return prisma.scheduledExport.findMany({
        where: {
          userId,
          isActive: true
        }
      });
    } catch (error) {
      logger.error('Error getting user scheduled exports:', error);
      throw error;
    }
  }

  private getDateRange(timeRange: string, startDate?: Date, endDate?: Date) {
    if (startDate && endDate) {
      return {
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate)
      };
    }

    const now = new Date();
    let start: Date;

    switch (timeRange) {
      case 'day':
        start = subDays(now, 1);
        break;
      case 'week':
        start = subDays(now, 7);
        break;
      case 'month':
        start = subDays(now, 30);
        break;
      default:
        start = subDays(now, 7);
    }

    return {
      startDate: startOfDay(start),
      endDate: endOfDay(now)
    };
  }

  private async getActivities(userId: string, dateRange: { startDate: Date; endDate: Date }) {
    return prisma.activity.findMany({
      where: {
        userId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        }
      },
      include: {
        thread: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  private formatExportData(activities: any[], format: string) {
    switch (format) {
      case 'csv':
        return this.formatAsCSV(activities);
      case 'json':
        return this.formatAsJSON(activities);
      case 'pdf':
        return this.formatAsPDF(activities);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private formatAsCSV(activities: any[]) {
    const fields = [
      'createdAt',
      'type',
      'thread.title',
      'user.name',
      'user.email',
      'details'
    ];

    const parser = new Parser({ fields });
    return parser.parse(activities);
  }

  private formatAsJSON(activities: any[]) {
    return JSON.stringify(activities, null, 2);
  }

  private formatAsPDF(activities: any[]) {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));

    activities.forEach(activity => {
      doc.fontSize(12).text(`Activity: ${activity.type}`, { underline: true });
      doc.fontSize(10).text(`Thread: ${activity.thread?.title || 'N/A'}`);
      doc.text(`User: ${activity.user?.name || 'N/A'} (${activity.user?.email || 'N/A'})`);
      doc.text(`Date: ${activity.createdAt.toISOString()}`);
      doc.text(`Details: ${JSON.stringify(activity.details)}`);
      doc.moveDown(2);
    });

    doc.end();

    return Buffer.concat(chunks);
  }
} 