import { Request, Response } from 'express';
import { getUserFromRequest } from '../middleware/auth';
import { AdminService } from '../services/adminService';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * POST /api/content-reports
 */
export async function createContentReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserFromRequest(req)?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      contentId,
      contentType,
      reason,
      severity = 'medium',
      contentTitle,
      contentDescription,
      contentUrl,
    } = req.body as Record<string, unknown>;

    const report = await AdminService.createContentReport({
      reporterId: userId,
      contentId: String(contentId),
      contentType: String(contentType),
      reason: String(reason),
      severity: typeof severity === 'string' ? severity : 'medium',
      contentTitle: contentTitle != null ? String(contentTitle) : undefined,
      contentDescription: contentDescription != null ? String(contentDescription) : undefined,
      contentUrl: contentUrl != null ? String(contentUrl) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Content report submitted successfully',
      report: {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error creating content report', {
      operation: 'content_report_create',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create content report' });
  }
}

/**
 * GET /api/content-reports/my-reports
 */
export async function getMyContentReports(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserFromRequest(req)?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * take;

    const where: { reporterId: string; status?: string } = { reporterId: userId };
    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.contentReport.count({ where }),
    ]);

    res.json({
      reports,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error fetching user reports', {
      operation: 'content_report_my_reports',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}
