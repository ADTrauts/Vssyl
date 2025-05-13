import express from 'express';
import { getActivities, createActivity } from '../controllers/activities';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get activities with optional filters
router.get('/', authenticateToken, getActivities);

// Create a new activity
router.post('/', authenticateToken, createActivity);

export default router; 