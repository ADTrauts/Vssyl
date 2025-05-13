import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getThreadInsights } from '../controllers/threadActivityInsights';

const router = express.Router();

// Get insights for a specific thread
router.get('/:threadId', authenticateToken, getThreadInsights);

export default router; 