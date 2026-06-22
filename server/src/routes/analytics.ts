import express from 'express';
import { 
  getPersonalAnalytics, 
  getModuleAnalytics, 
  exportAnalytics,
  getDashboardSummary,
} from '../controllers/analyticsController';

const router: express.Router = express.Router();

// Dashboard-scoped tenant summary (Analytics Capability — Package 3)
router.get('/dashboard-summary', getDashboardSummary);

// Get personal analytics for the current user
router.get('/personal', getPersonalAnalytics);

// Get module-specific analytics
router.get('/modules/:moduleId', getModuleAnalytics);

// Export analytics data
router.get('/export', exportAnalytics);

export default router; 