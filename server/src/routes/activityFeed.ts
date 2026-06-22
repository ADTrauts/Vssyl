import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as activityFeedController from '../controllers/activityFeedController';

const router: express.Router = express.Router();

router.get('/', asyncHandler(activityFeedController.getActivityFeed));

export default router;
