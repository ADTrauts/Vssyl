import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  searchThreads,
  getThreadSuggestions,
  getTrendingThreads
} from '../controllers/threadSearch';

const router = express.Router();

// Search threads with filters
router.get('/', authenticateToken, searchThreads);

// Get thread suggestions
router.get('/suggestions', authenticateToken, getThreadSuggestions);

// Get trending threads
router.get('/trending', authenticateToken, getTrendingThreads);

export default router; 