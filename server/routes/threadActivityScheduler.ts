import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createScheduledExport,
  updateScheduledExport,
  deleteScheduledExport,
  getUserScheduledExports,
  getExportResults
} from '../controllers/threadActivityScheduler';

const router = express.Router();

// Create a new scheduled export
router.post('/', authenticateToken, createScheduledExport);

// Update a scheduled export
router.put('/:id', authenticateToken, updateScheduledExport);

// Delete a scheduled export
router.delete('/:id', authenticateToken, deleteScheduledExport);

// Get user's scheduled exports
router.get('/', authenticateToken, getUserScheduledExports);

// Get export results for a scheduled export
router.get('/:id/results', authenticateToken, getExportResults);

export default router; 