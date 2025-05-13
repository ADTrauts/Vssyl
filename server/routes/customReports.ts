import express from 'express';
import { authenticate } from '../middleware/auth';
import { customReportLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import { CustomReportService } from '../services/customReportService';

const router = express.Router();
const customReportService = new CustomReportService();

// Create a new custom report
router.post('/', authenticate, customReportLimiter, async (req, res) => {
  try {
    const report = await customReportService.createReport({
      ...req.body,
      createdBy: req.user.id
    });
    res.json(report);
  } catch (error) {
    logger.error('Error creating custom report:', error);
    res.status(500).json({ error: 'Failed to create custom report' });
  }
});

// Get a specific report
router.get('/:reportId', authenticate, customReportLimiter, async (req, res) => {
  try {
    const report = await customReportService.getReport(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    logger.error('Error getting custom report:', error);
    res.status(500).json({ error: 'Failed to get custom report' });
  }
});

// Get all reports for the current user
router.get('/', authenticate, customReportLimiter, async (req, res) => {
  try {
    const reports = await customReportService.getUserReports(req.user.id);
    res.json(reports);
  } catch (error) {
    logger.error('Error getting user reports:', error);
    res.status(500).json({ error: 'Failed to get user reports' });
  }
});

// Update a report
router.put('/:reportId', authenticate, customReportLimiter, async (req, res) => {
  try {
    const report = await customReportService.updateReport(req.params.reportId, req.body);
    res.json(report);
  } catch (error) {
    logger.error('Error updating custom report:', error);
    res.status(500).json({ error: 'Failed to update custom report' });
  }
});

// Delete a report
router.delete('/:reportId', authenticate, customReportLimiter, async (req, res) => {
  try {
    await customReportService.deleteReport(req.params.reportId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting custom report:', error);
    res.status(500).json({ error: 'Failed to delete custom report' });
  }
});

// Execute a report
router.post('/:reportId/execute', authenticate, customReportLimiter, async (req, res) => {
  try {
    const results = await customReportService.executeReport(req.params.reportId);
    res.json(results);
  } catch (error) {
    logger.error('Error executing custom report:', error);
    res.status(500).json({ error: 'Failed to execute custom report' });
  }
});

export default router; 