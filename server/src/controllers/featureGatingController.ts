import { Request, Response } from 'express';
import { FeatureGatingService } from '../services/featureGatingService';
import { SubscriptionMiddleware } from '../middleware/subscriptionMiddleware';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

function logFeatureGatingError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}


export const checkFeatureAccess = async (req: Request, res: Response) => {
  try {
    const { featureName } = req.params;
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;
    
    // Validate businessId query parameter
    const businessIdParam = req.query.businessId;
    const businessId = (businessIdParam && typeof businessIdParam === 'string') ? businessIdParam : undefined;

    const access = await FeatureGatingService.checkFeatureAccess(userId, featureName, businessId);

    res.json({
      featureName,
      hasAccess: access.hasAccess,
      reason: access.reason,
      usageInfo: access.usageInfo,
    });
  } catch (error) {
    logFeatureGatingError('Error checking feature access', 'features_check_access', error);
    res.status(500).json({ error: 'Failed to check feature access' });
  }
};

export const getUserFeatures = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;
    
    // Validate businessId query parameter
    const businessIdParam = req.query.businessId;
    const businessId = (businessIdParam && typeof businessIdParam === 'string') ? businessIdParam : undefined;

    const features = await FeatureGatingService.getUserFeatures(userId, businessId);

    res.json({ features });
  } catch (error) {
    logFeatureGatingError('Error getting user features', 'features_user_list', error);
    res.status(500).json({ error: 'Failed to get user features' });
  }
};

export const getUserUsage = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;
    
    // Validate businessId query parameter
    const businessIdParam = req.query.businessId;
    const businessId = (businessIdParam && typeof businessIdParam === 'string') ? businessIdParam : undefined;

    const usage = await FeatureGatingService.getUserUsage(userId, businessId);

    res.json({ usage });
  } catch (error) {
    logFeatureGatingError('Error getting user usage', 'features_usage', error);
    res.status(500).json({ error: 'Failed to get user usage' });
  }
};

export const recordUsage = async (req: Request, res: Response) => {
  try {
    const { metric, quantity = 1, cost = 0 } = req.body;
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;

    if (!metric) {
      return res.status(400).json({ error: 'Metric is required' });
    }

    await FeatureGatingService.recordUsage(userId, metric, quantity, cost);

    res.json({ success: true, message: 'Usage recorded successfully' });
  } catch (error) {
    logFeatureGatingError('Error recording usage', 'features_record_usage', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
};

export const getSubscriptionInfo = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = user.id;

    const subscription = await SubscriptionMiddleware.getUserSubscription(userId);
    const moduleAccess = await SubscriptionMiddleware.getUserModuleAccess(userId);

    res.json({
      subscription,
      moduleAccess,
    });
  } catch (error) {
    logFeatureGatingError('Error getting subscription info', 'features_subscription', error);
    res.status(500).json({ error: 'Failed to get subscription info' });
  }
}; 