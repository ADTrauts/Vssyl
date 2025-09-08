import express from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  testGoogleConfig,
  getGoogleOAuthStatus
} from '../controllers/googleOAuthController';

const router: express.Router = express.Router();

// Get Google OAuth authorization URL for business
router.get('/business/:businessId/auth-url', getGoogleAuthUrl);

// Handle Google OAuth callback
router.get('/business/:businessId/callback', handleGoogleCallback);

// Test Google OAuth configuration
router.post('/business/:businessId/test-config', testGoogleConfig);

// Get Google OAuth status for business
router.get('/business/:businessId/status', getGoogleOAuthStatus);

export default router; 