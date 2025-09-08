import express from 'express';
import { 
  getPersonalAnalytics, 
  getModuleAnalytics, 
  exportAnalytics 
} from '../controllers/analyticsController';

const router: express.Router = express.Router();

// Get personal analytics for the current user
router.get('/personal', getPersonalAnalytics);

// Get module-specific analytics
router.get('/modules/:moduleId', getModuleAnalytics);

// Export analytics data
router.get('/export', exportAnalytics);

export default router; 