import { PrismaClient } from '@prisma/client';
import { AnalyticsExport, ThreadAnalytics, UserAnalytics, EngagementMetrics } from '../types/analytics';
import { handleApiError } from '../utils/error-handler';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

interface ExportData {
  threadAnalytics?: ThreadAnalytics[];
  userAnalytics?: UserAnalytics[];
  engagementMetrics?: EngagementMetrics[];
  tagStats?: Array<{ tag: string; count: number }>;
  trendingThreads?: Array<{ threadId: string; engagement: number }>;
  metadata?: Record<string, unknown>;
}

export class AnalyticsExportService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async exportAnalytics(data: ExportData, format: AnalyticsExport['format']): Promise<Buffer> {
    try {
      const formattedData = await this.formatData(data, format);
      return formattedData;
    } catch (error) {
      throw handleApiError(error, {
        showToast: true,
        logToConsole: true,
        fallbackMessage: 'Failed to export analytics'
      });
    }
  }

  private async formatData(data: ExportData, format: string): Promise<Buffer> {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
        return Buffer.from(JSON.stringify(data, null, 2));
      case 'excel':
        return this.convertToExcel(data);
      case 'pdf':
        return this.convertToPDF(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async convertToCSV(data: ExportData): Promise<Buffer> {
    const rows: string[] = [];
    
    // Add headers
    if (data.threadAnalytics?.length) {
      rows.push('Thread Analytics');
      rows.push('ID,Thread ID,View Count,Comment Count,Like Count,Share Count,Last Activity,Created At,Updated At');
      data.threadAnalytics.forEach(thread => {
        rows.push(`${thread.id},${thread.threadId},${thread.viewCount},${thread.commentCount},${thread.likeCount},${thread.shareCount},${thread.lastActivityAt},${thread.createdAt},${thread.updatedAt}`);
      });
    }

    if (data.userAnalytics?.length) {
      rows.push('\nUser Analytics');
      rows.push('ID,User ID,Thread Count,Message Count,Average Response Time,Participation Rate,Last Active,Created At,Updated At');
      data.userAnalytics.forEach(user => {
        rows.push(`${user.id},${user.userId},${user.threadCount},${user.messageCount},${user.averageResponseTime},${user.participationRate},${user.lastActiveAt},${user.createdAt},${user.updatedAt}`);
      });
    }

    if (data.tagStats?.length) {
      rows.push('\nTag Statistics');
      rows.push('Tag,Count');
      data.tagStats.forEach(tag => {
        rows.push(`${tag.tag},${tag.count}`);
      });
    }

    if (data.trendingThreads?.length) {
      rows.push('\nTrending Threads');
      rows.push('Thread ID,Engagement Score');
      data.trendingThreads.forEach(thread => {
        rows.push(`${thread.threadId},${thread.engagement}`);
      });
    }

    return Buffer.from(rows.join('\n'));
  }

  private async convertToExcel(data: ExportData): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    if (data.threadAnalytics?.length) {
      const threadSheet = XLSX.utils.json_to_sheet(data.threadAnalytics);
      XLSX.utils.book_append_sheet(workbook, threadSheet, 'Thread Analytics');
    }

    if (data.userAnalytics?.length) {
      const userSheet = XLSX.utils.json_to_sheet(data.userAnalytics);
      XLSX.utils.book_append_sheet(workbook, userSheet, 'User Analytics');
    }

    if (data.tagStats?.length) {
      const tagSheet = XLSX.utils.json_to_sheet(data.tagStats);
      XLSX.utils.book_append_sheet(workbook, tagSheet, 'Tag Statistics');
    }

    if (data.trendingThreads?.length) {
      const trendingSheet = XLSX.utils.json_to_sheet(data.trendingThreads);
      XLSX.utils.book_append_sheet(workbook, trendingSheet, 'Trending Threads');
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async convertToPDF(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add content to PDF
        if (data.threadAnalytics?.length) {
          doc.fontSize(16).text('Thread Analytics', { underline: true });
          data.threadAnalytics.forEach(thread => {
            doc.fontSize(12).text(`Thread ID: ${thread.threadId}`);
            doc.fontSize(10).text(`Views: ${thread.viewCount}, Comments: ${thread.commentCount}, Likes: ${thread.likeCount}, Shares: ${thread.shareCount}`);
            doc.moveDown();
          });
        }

        if (data.userAnalytics?.length) {
          doc.addPage();
          doc.fontSize(16).text('User Analytics', { underline: true });
          data.userAnalytics.forEach(user => {
            doc.fontSize(12).text(`User ID: ${user.userId}`);
            doc.fontSize(10).text(`Threads: ${user.threadCount}, Messages: ${user.messageCount}, Response Time: ${user.averageResponseTime}s`);
            doc.moveDown();
          });
        }

        if (data.tagStats?.length) {
          doc.addPage();
          doc.fontSize(16).text('Tag Statistics', { underline: true });
          data.tagStats.forEach(tag => {
            doc.fontSize(12).text(`${tag.tag}: ${tag.count}`);
          });
        }

        if (data.trendingThreads?.length) {
          doc.addPage();
          doc.fontSize(16).text('Trending Threads', { underline: true });
          data.trendingThreads.forEach(thread => {
            doc.fontSize(12).text(`Thread ID: ${thread.threadId}`);
            doc.fontSize(10).text(`Engagement Score: ${thread.engagement}`);
            doc.moveDown();
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
} 