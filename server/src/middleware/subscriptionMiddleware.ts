import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AuthenticatedRequest, getUserFromRequest } from './auth';
import { resolveTier } from '../services/account/entitlementService';
import { normalizeTier } from '../services/account/entitlementTypes';

export interface SubscriptionTier {
  tier: 'free' | 'standard' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
}

export interface ModuleAccess {
  moduleId: string;
  hasAccess: boolean;
  tier: 'free' | 'premium' | 'enterprise';
}

// Extend AuthenticatedRequest with subscription properties
export interface SubscriptionRequest extends AuthenticatedRequest {
  subscription?: any;
  userTier?: string;
  moduleAccess?: ModuleAccess;
  usageInfo?: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export class SubscriptionMiddleware {
  /**
   * Check if user has access to a specific feature based on subscription tier
   */
  static async checkFeatureAccess(
    req: Request,
    res: Response,
    next: NextFunction,
    requiredTier: 'free' | 'standard' | 'enterprise',
    feature: string
  ) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const resolution = await resolveTier({ userId });
      const userTier = resolution.tier;
      const hasAccess = this.compareTiers(userTier, requiredTier);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Insufficient subscription tier',
          requiredTier,
          currentTier: userTier,
          feature,
        });
      }

      // Add subscription info to request for downstream use
      (req as SubscriptionRequest).userTier = userTier;
      
      next();
    } catch (error: unknown) {
      const err = error as Error;
      await logger.error('Error checking feature access', {
        operation: 'subscription_middleware_check_feature',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to check subscription access' });
    }
  }

  /**
   * Check if user has access to a specific module
   */
  static async checkModuleAccess(
    req: Request,
    res: Response,
    next: NextFunction,
    moduleId: string
  ) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has active subscription to this module
      const moduleSubscription = await prisma.moduleSubscription.findFirst({
        where: {
          userId,
          moduleId,
          status: 'active',
        },
      });

      // Check if module is free
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }

      const hasAccess = module.pricingTier === 'free' || moduleSubscription;

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Module access required',
          moduleId,
          moduleName: module.name,
          pricingTier: module.pricingTier,
        });
      }

      // Add module access info to request
      (req as SubscriptionRequest).moduleAccess = {
        moduleId,
        hasAccess: true,
        tier: module.pricingTier as 'free' | 'premium' | 'enterprise',
      };
      
      next();
    } catch (error: unknown) {
      const err = error as Error;
      await logger.error('Error checking module access', {
        operation: 'subscription_middleware_check_module',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to check module access' });
    }
  }

  /**
   * Check usage limits for a specific metric
   */
  static async checkUsageLimit(
    req: Request,
    res: Response,
    next: NextFunction,
    metric: string,
    limit: number
  ) {
    try {
      const userId = getUserFromRequest(req)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get current period usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usage = await prisma.usageRecord.aggregate({
        where: {
          userId,
          metric,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
        _sum: {
          quantity: true,
        },
      });

      const currentUsage = usage._sum.quantity || 0;

      if (currentUsage >= limit) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          metric,
          currentUsage,
          limit,
        });
      }

      // Add usage info to request
      req.usageInfo = {
        metric,
        currentUsage,
        limit,
        remaining: limit - currentUsage,
      };
      
      next();
    } catch (error: unknown) {
      const err = error as Error;
      await logger.error('Error checking usage limit', {
        operation: 'subscription_middleware_check_usage_limit',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to check usage limit' });
    }
  }

  /**
   * Compare subscription tiers to determine access
   */
  private static compareTiers(userTier: string, requiredTier: string): boolean {
    const tierHierarchy = {
      free: 0,
      standard: 1,
      pro: 1,
      business_basic: 2,
      business_advanced: 3,
      enterprise: 4,
    };

    const normalizedUser = normalizeTier(userTier, false);
    const normalizedRequired = normalizeTier(requiredTier, false);
    const userLevel = tierHierarchy[normalizedUser as keyof typeof tierHierarchy] ?? tierHierarchy[userTier as keyof typeof tierHierarchy] ?? 0;
    const requiredLevel = tierHierarchy[normalizedRequired as keyof typeof tierHierarchy] ?? tierHierarchy[requiredTier as keyof typeof tierHierarchy] ?? 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Get user's subscription info
   */
  static async getUserSubscription(userId: string): Promise<SubscriptionTier | null> {
    const resolution = await resolveTier({ userId });
    if (resolution.source === 'default') {
      return null;
    }
    return {
      tier: resolution.tier as SubscriptionTier['tier'],
      status: 'active',
    };
  }

  /**
   * Get user's module access info
   */
  static async getUserModuleAccess(userId: string): Promise<ModuleAccess[]> {
    const moduleSubscriptions = await prisma.moduleSubscription.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        module: true,
      },
    });

    // Get all modules
    const allModules = await prisma.module.findMany();

    return allModules.map(module => {
      const subscription = moduleSubscriptions.find(sub => sub.moduleId === module.id);
      return {
        moduleId: module.id,
        hasAccess: module.pricingTier === 'free' || !!subscription,
        tier: module.pricingTier as 'free' | 'premium' | 'enterprise',
      };
    });
  }
} 