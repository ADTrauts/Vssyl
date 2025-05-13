import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getPersonalizedRecommendations,
  getTrendingThreads
} from '../controllers/threadRecommendation';
import { validateThreadRecommendation } from '../middleware/validation';
import { recommendationLimiter } from '../middleware/rateLimit';
import { cache } from '../middleware/cache';

const router = express.Router();

// Get personalized recommendations
router.get('/personalized', authenticateToken, recommendationLimiter, validateThreadRecommendation, cache(600), getPersonalizedRecommendations);

// Get trending threads
router.get('/trending', authenticateToken, recommendationLimiter, validateThreadRecommendation, cache(300), getTrendingThreads);

export default router; 