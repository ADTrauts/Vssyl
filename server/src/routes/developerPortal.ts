import express from 'express';
import {
  getDeveloperStats,
  getModuleRevenue,
  getModuleAnalytics,
  requestPayout,
  getPayoutHistory,
  updateModulePricing,
  getDeveloperDashboard,
} from '../controllers/developerPortalController';

const router: express.Router = express.Router();

// Developer dashboard
router.get('/dashboard', getDeveloperDashboard);

// Developer statistics
router.get('/stats', getDeveloperStats);

// Module revenue
router.get('/revenue', getModuleRevenue);

// Module analytics
router.get('/modules/:moduleId/analytics', getModuleAnalytics);

// Update module pricing
router.put('/modules/:moduleId/pricing', updateModulePricing);

// Payout management
router.post('/payouts', requestPayout);
router.get('/payouts', getPayoutHistory);

export default router; 