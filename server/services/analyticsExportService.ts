import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { format } from 'date-fns';
import { Workbook } from 'exceljs';
import PDFDocument from 'pdfkit';
import { AnalyticsService } from './analyticsService';
import { prisma } from '../prismaClient';

interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  timeRange?: {
    start: Date;
    end: Date;
  };
  include: {
    userStats?: boolean;
    tagStats?: boolean;
    trendingThreads?: boolean;
  };
}

interface ExportData {
  tagStats: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  trendingThreads: Array<{
    id: string;
    title: string;
    activityCount: number;
    lastActivity: Date;
  }>;
  userStats: Array<{
    userId: string;
    name: string;
    activityCount: number;
    lastActive: Date;
  }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class AnalyticsExportService {
  private analyticsService: AnalyticsService;

  constructor(private prismaClient: PrismaClient = prisma) {
    this.analyticsService = new AnalyticsService(prismaClient);
  }

  async exportAnalytics(userId: string, options: ExportOptions): Promise<Buffer> {
    try {
      const data = await this.collectAnalyticsData(userId, options);
      return await this.formatData(data, options.format);
    } catch (error) {
      logger.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics data');
    }
  }

  private async collectAnalyticsData(userId: string, options: ExportOptions): Promise<ExportData> {
    const data: ExportData = {
      tagStats: [],
      trendingThreads: [],
      userStats: [],
      timeRange: options.timeRange || { start: new Date(), end: new Date() }
    };

    if (options.include.userStats) {
      const userAnalytics = await this.analyticsService.getUserAnalytics(userId);
      data.userStats = [{
        userId: userAnalytics.userId,
        name: userAnalytics.metrics.activityLevel,
        activityCount: userAnalytics.metrics.contentCount,
        lastActive: userAnalytics.timeStats.lastActive
      }];
    }

    if (options.include.tagStats) {
      const userAnalytics = await this.analyticsService.getUserAnalytics(userId);
      data.tagStats = [{
        name: 'User Activity',
        count: userAnalytics.metrics.contentCount,
        percentage: (userAnalytics.metrics.engagementScore / 100) * 100
      }];
    }

    if (options.include.trendingThreads) {
      const userAnalytics = await this.analyticsService.getUserAnalytics(userId);
      data.trendingThreads = userAnalytics.threadStats.created > 0 ? [{
        id: userId,
        title: 'User Threads',
        activityCount: userAnalytics.threadStats.participated,
        lastActivity: userAnalytics.timeStats.lastActive
      }] : [];
    }

    return data;
  }

  private async formatData(data: ExportData, format: string): Promise<Buffer> {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.convertToCSV(data);
      case 'excel':
        return this.convertToExcel(data);
      case 'pdf':
        return this.convertToPDF(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async convertToCSV(data: ExportData): Promise<Buffer> {
    const rows: string[] = [];
    
    // Add header
    rows.push('Category,Name,Count,Percentage,Last Updated');
    
    // Add tag statistics
    data.tagStats.forEach(tag => {
      rows.push(`Tag,${tag.name},${tag.count},${tag.percentage.toFixed(2)}%,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    });
    
    // Add trending threads
    data.trendingThreads.forEach(thread => {
      rows.push(`Thread,${thread.title},${thread.activityCount},N/A,${format(thread.lastActivity, 'yyyy-MM-dd HH:mm:ss')}`);
    });
    
    // Add user statistics
    data.userStats.forEach(user => {
      rows.push(`User,${user.name},${user.activityCount},N/A,${format(user.lastActive, 'yyyy-MM-dd HH:mm:ss')}`);
    });
    
    return Buffer.from(rows.join('\n'));
  }

  private async convertToExcel(data: ExportData): Promise<Buffer> {
    const workbook = new Workbook();
    
    // Add tag statistics sheet
    const tagSheet = workbook.addWorksheet('Tag Statistics');
    tagSheet.columns = [
      { header: 'Tag Name', key: 'name', width: 20 },
      { header: 'Count', key: 'count', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 15 }
    ];
    
    data.tagStats.forEach(tag => {
      tagSheet.addRow({
        name: tag.name,
        count: tag.count,
        percentage: `${tag.percentage.toFixed(2)}%`
      });
    });
    
    // Add trending threads sheet
    const threadSheet = workbook.addWorksheet('Trending Threads');
    threadSheet.columns = [
      { header: 'Thread Title', key: 'title', width: 30 },
      { header: 'Activity Count', key: 'activityCount', width: 15 },
      { header: 'Last Activity', key: 'lastActivity', width: 20 }
    ];
    
    data.trendingThreads.forEach(thread => {
      threadSheet.addRow({
        title: thread.title,
        activityCount: thread.activityCount,
        lastActivity: format(thread.lastActivity, 'yyyy-MM-dd HH:mm:ss')
      });
    });
    
    // Add user statistics sheet
    const userSheet = workbook.addWorksheet('User Statistics');
    userSheet.columns = [
      { header: 'User Name', key: 'name', width: 20 },
      { header: 'Activity Count', key: 'activityCount', width: 15 },
      { header: 'Last Active', key: 'lastActive', width: 20 }
    ];
    
    data.userStats.forEach(user => {
      userSheet.addRow({
        name: user.name,
        activityCount: user.activityCount,
        lastActive: format(user.lastActive, 'yyyy-MM-dd HH:mm:ss')
      });
    });
    
    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  private async convertToPDF(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument();
        
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Add title
        doc.fontSize(20).text('Analytics Report', { align: 'center' });
        doc.moveDown();
        
        // Add time range
        doc.fontSize(12).text(`Time Range: ${format(data.timeRange.start, 'yyyy-MM-dd')} to ${format(data.timeRange.end, 'yyyy-MM-dd')}`);
        doc.moveDown();
        
        // Add tag statistics
        doc.fontSize(16).text('Tag Statistics');
        data.tagStats.forEach(tag => {
          doc.fontSize(12).text(`${tag.name}: ${tag.count} (${tag.percentage.toFixed(2)}%)`);
        });
        doc.moveDown();
        
        // Add trending threads
        doc.fontSize(16).text('Trending Threads');
        data.trendingThreads.forEach(thread => {
          doc.fontSize(12).text(`${thread.title}: ${thread.activityCount} activities`);
        });
        doc.moveDown();
        
        // Add user statistics
        doc.fontSize(16).text('User Statistics');
        data.userStats.forEach(user => {
          doc.fontSize(12).text(`${user.name}: ${user.activityCount} activities`);
        });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
} 