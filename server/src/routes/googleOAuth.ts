import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  testGoogleConfig,
  getGoogleOAuthStatus
} from '../controllers/googleOAuthController';

const router: express.Router = express.Router();

// Get Google OAuth authorization URL for business (member must be authenticated)
router.get('/business/:businessId/auth-url', authenticateJWT, getGoogleAuthUrl);

// Handle Google OAuth callback (public — OAuth provider redirects here)
router.get('/business/:businessId/callback', handleGoogleCallback);

// Test Google OAuth configuration
router.post('/business/:businessId/test-config', authenticateJWT, testGoogleConfig);

// Get Google OAuth status for business
router.get('/business/:businessId/status', authenticateJWT, getGoogleOAuthStatus);

export default router; 