import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getSettings,
  putSettings,
  getSettingsSections,
  getPreference,
  putPreference,
  deletePreferenceHandler,
} from '../controllers/settingsController';

const router: express.Router = express.Router();

router.get('/sections', authenticateJWT, asyncHandler(getSettingsSections));
router.get('/preferences/:key', authenticateJWT, asyncHandler(getPreference));
router.put('/preferences/:key', authenticateJWT, asyncHandler(putPreference));
router.delete('/preferences/:key', authenticateJWT, asyncHandler(deletePreferenceHandler));
router.get('/', authenticateJWT, asyncHandler(getSettings));
router.put('/', authenticateJWT, asyncHandler(putSettings));

export default router;
