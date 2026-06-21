import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getProfile, updateProfile } from '../controllers/profileController';

const router: express.Router = express.Router();

router.get('/', authenticateJWT, asyncHandler(getProfile));
router.put('/', authenticateJWT, asyncHandler(updateProfile));

export default router;
