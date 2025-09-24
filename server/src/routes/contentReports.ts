import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { AdminService } from '../services/adminService';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

// Create a content report (public endpoint for users)
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      contentId,
      contentType,
      reason,
      severity = 'medium',
      contentTitle,
      contentDescription,
      contentUrl
    } = req.body;

    // Validate required fields
    if (!contentId || !contentType || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields: contentId, contentType, reason' 
      });
    }

    const report = await AdminService.createContentReport({
      reporterId: userId,
      contentId,
      contentType,
      reason,
      severity,
      contentTitle,
      contentDescription,
      contentUrl
    });

    res.status(201).json({
      success: true,
      message: 'Content report submitted successfully',
      report: {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating content report:', error);
    res.status(500).json({ error: 'Failed to create content report' });
  }
});

// Get user's own reports
router.get('/my-reports', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { reporterId: userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.contentReport.count({ where })
    ]);

    res.json({
      reports,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
