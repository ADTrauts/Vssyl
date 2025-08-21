import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  createSSOConfiguration,
  getSSOConfigurations,
  updateSSOConfiguration,
  deleteSSOConfiguration,
  generateWorkCredentialsForBusiness,
  verifyWorkCredentialsToken,
  getAvailableSSOProviders
} from '../controllers/ssoController';

const router = express.Router();

// SSO configuration routes (require authentication)
router.use(authenticateJWT);

// Get available SSO providers
router.get('/providers', getAvailableSSOProviders);

// Business-specific SSO routes
router.get('/business/:businessId', getSSOConfigurations);
router.post('/business/:businessId', createSSOConfiguration);
router.put('/:id', updateSSOConfiguration);
router.delete('/:id', deleteSSOConfiguration);

// Work credentials routes
router.post('/business/:businessId/work-credentials', generateWorkCredentialsForBusiness);
router.post('/verify-work-credentials', verifyWorkCredentialsToken);

export default router; 