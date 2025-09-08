import express, { Request, Response } from 'express';
import { FeatureGatingService } from '../services/featureGatingService';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * GET /api/features/all
 * Get all available feature configurations
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const features = FeatureGatingService.getAllFeatures();
    
    res.json({
      success: true,
      features
    });
  } catch (error) {
    console.error('Error getting all features:', error);
    res.status(500).json({
      error: 'Failed to get features',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/features/check?feature=<featureName>&businessId=<businessId>
 * Check if user has access to a specific feature
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const { feature, businessId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!feature || typeof feature !== 'string') {
      return res.status(400).json({ error: 'Feature parameter is required' });
    }

    const access = await FeatureGatingService.checkFeatureAccess(
      userId,
      feature,
      businessId as string | undefined
    );

    res.json({
      success: true,
      hasAccess: access.hasAccess,
      reason: access.reason,
      usageInfo: access.usageInfo
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({
      error: 'Failed to check feature access',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/features/module?module=<moduleName>&businessId=<businessId>
 * Get feature access summary for a specific module
 */
router.get('/module', async (req: Request, res: Response) => {
  try {
    const { module, businessId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!module || typeof module !== 'string') {
      return res.status(400).json({ error: 'Module parameter is required' });
    }

    const access = await FeatureGatingService.getModuleFeatureAccess(
      userId,
      module,
      businessId as string | undefined
    );

    res.json({
      success: true,
      module,
      access
    });
  } catch (error) {
    console.error('Error getting module feature access:', error);
    res.status(500).json({
      error: 'Failed to get module feature access',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/features/usage
 * Record feature usage
 */
router.post('/usage', async (req: Request, res: Response) => {
  try {
    const { feature, quantity = 1, businessId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!feature) {
      return res.status(400).json({ error: 'Feature parameter is required' });
    }

    // Get feature config to determine the metric
    const featureConfig = FeatureGatingService.getFeatureConfig(feature);
    if (!featureConfig || !featureConfig.usageMetric) {
      return res.status(400).json({ error: 'Feature does not track usage' });
    }

    await FeatureGatingService.recordUsage(
      userId,
      featureConfig.usageMetric,
      quantity,
      0, // cost
      businessId
    );

    res.json({
      success: true,
      message: 'Usage recorded successfully'
    });
  } catch (error) {
    console.error('Error recording feature usage:', error);
    res.status(500).json({
      error: 'Failed to record usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/features/by-category?category=<category>
 * Get features by category (core, premium, enterprise)
 */
router.get('/by-category', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    if (!['core', 'premium', 'enterprise'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be core, premium, or enterprise' });
    }

    const features = FeatureGatingService.getFeaturesByCategory(category as 'core' | 'premium' | 'enterprise');

    res.json({
      success: true,
      category,
      features
    });
  } catch (error) {
    console.error('Error getting features by category:', error);
    res.status(500).json({
      error: 'Failed to get features by category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/features/by-tier?tier=<tier>
 * Get features by subscription tier (free, standard, enterprise)
 */
router.get('/by-tier', async (req: Request, res: Response) => {
  try {
    const { tier } = req.query;

    if (!tier || typeof tier !== 'string') {
      return res.status(400).json({ error: 'Tier parameter is required' });
    }

    if (!['free', 'standard', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be free, standard, or enterprise' });
    }

    const features = FeatureGatingService.getFeaturesByTier(tier as 'free' | 'standard' | 'enterprise');

    res.json({
      success: true,
      tier,
      features
    });
  } catch (error) {
    console.error('Error getting features by tier:', error);
    res.status(500).json({
      error: 'Failed to get features by tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/features/user-summary?businessId=<businessId>
 * Get comprehensive feature access summary for user
 */
router.get('/user-summary', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's features across all modules
    const modules = ['drive', 'chat', 'calendar', 'dashboard', 'ai', 'business'];
    const moduleAccess: Record<string, any> = {};

    for (const module of modules) {
      try {
        moduleAccess[module] = await FeatureGatingService.getModuleFeatureAccess(
          userId,
          module,
          businessId as string | undefined
        );
      } catch (error) {
        console.error(`Failed to get access for module ${module}:`, error);
        moduleAccess[module] = {
          core: { available: [], locked: [] },
          premium: { available: [], locked: [] },
          enterprise: { available: [], locked: [] }
        };
      }
    }

    // Get usage information
    const usage = await FeatureGatingService.getUserUsage(userId, businessId as string | undefined);

    res.json({
      success: true,
      userId,
      businessId: businessId || null,
      moduleAccess,
      usage
    });
  } catch (error) {
    console.error('Error getting user feature summary:', error);
    res.status(500).json({
      error: 'Failed to get user feature summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
