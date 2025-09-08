import express from 'express';
import {
  checkFeatureAccess,
  getUserFeatures,
  getUserUsage,
  recordUsage,
  getSubscriptionInfo,
} from '../controllers/featureGatingController';
import { FeatureGatingService } from '../services/featureGatingService';

const router: express.Router = express.Router();

// Check access to a specific feature
router.get('/features/:featureName/access', checkFeatureAccess);

// Get all features for the current user
router.get('/features', getUserFeatures);

// Get usage information for the current user
router.get('/usage', getUserUsage);

// Record usage for a specific metric
router.post('/usage', recordUsage);

// Get subscription and module access information
router.get('/subscription', getSubscriptionInfo);

// Middleware for checking feature access in other routes
router.use('/check/:featureName', async (req, res, next) => {
  const { featureName } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const access = await FeatureGatingService.checkFeatureAccess(userId, featureName);
  
  if (!access.hasAccess) {
    return res.status(403).json({
      error: 'Feature access denied',
      reason: access.reason,
      usageInfo: access.usageInfo,
    });
  }

  // Add feature access info to request
  (req as any).featureAccess = {
    featureName,
    hasAccess: true,
    usageInfo: access.usageInfo,
  };

  next();
});

export default router; 