import express from 'express';
import {
  getUserPrivacySettings,
  updateUserPrivacySettings,
  getUserConsents,
  grantConsent,
  revokeConsent,
  requestDataDeletion,
  getUserDeletionRequests,
  exportUserData
} from '../controllers/privacyController';

const router: express.Router = express.Router();

// Privacy settings
router.get('/settings', getUserPrivacySettings);
router.put('/settings', updateUserPrivacySettings);

// Consent management
router.get('/consents', getUserConsents);
router.post('/consents/grant', grantConsent);
router.post('/consents/revoke', revokeConsent);

// Data deletion
router.post('/deletion-request', requestDataDeletion);
router.get('/deletion-requests', getUserDeletionRequests);

// Data export
router.get('/export', exportUserData);

export default router; 