import express from 'express';
import { authenticate } from '../middleware/auth';
import { analyticsLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { AnalyticsService } from '../services/analyticsService';
import { AnalyticsExportService } from '../services/analyticsExportService';

const router = express.Router();
const analyticsService = new AnalyticsService();
const exportService = new AnalyticsExportService();

// Get thread analytics
router.get('/threads/:threadId', authenticate, analyticsLimiter, async (req, res) => {
  try {
    const { threadId } = req.params;
    const analytics = await analyticsService.getThreadAnalytics(threadId);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting thread analytics:', error);
    res.status(500).json({ error: 'Failed to get thread analytics' });
  }
});

// Get user analytics
router.get('/users/:userId', authenticate, analyticsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const timeRange = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        }
      : undefined;

    const analytics = await analyticsService.getUserAnalytics(userId, timeRange);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

// Get tag analytics
router.get('/tags', authenticate, analyticsLimiter, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const timeRange = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        }
      : undefined;

    const analytics = await analyticsService.getTagAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting tag analytics:', error);
    res.status(500).json({ error: 'Failed to get tag analytics' });
  }
});

// Get trending threads
router.get('/trending', authenticate, analyticsLimiter, async (req, res) => {
  try {
    const { limit } = req.query;
    const threads = await analyticsService.getTrendingThreads(
      limit ? parseInt(limit as string) : undefined
    );
    res.json(threads);
  } catch (error) {
    logger.error('Error getting trending threads:', error);
    res.status(500).json({ error: 'Failed to get trending threads' });
  }
});

// Export analytics data
router.post('/export', authenticate, analyticsLimiter, async (req, res) => {
  try {
    const { format, timeRange, include } = req.body;
    
    if (!format || !['csv', 'json', 'excel'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }

    const options = {
      format,
      timeRange: timeRange ? {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      } : undefined,
      include: {
        userStats: include?.userStats ?? true,
        threadStats: include?.threadStats ?? false,
        tagStats: include?.tagStats ?? true,
        trendingThreads: include?.trendingThreads ?? true
      }
    };

    const buffer = await exportService.exportAnalytics(req.user.id, options);

    // Set appropriate content type and headers
    const contentType = {
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }[format];

    const filename = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    logger.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

export default router; 