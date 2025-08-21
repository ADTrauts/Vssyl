import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SubscriptionTier {
  tier: 'free' | 'standard' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
}

export interface ModuleAccess {
  moduleId: string;
  hasAccess: boolean;
  tier: 'free' | 'premium' | 'enterprise';
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
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'active',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Default to free tier if no subscription found
      const userTier = subscription?.tier || 'free';
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
      (req as any).subscription = subscription;
      (req as any).userTier = userTier;
      
      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
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
      const userId = (req as any).user?.id;
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
      (req as any).moduleAccess = {
        moduleId,
        hasAccess: true,
        tier: module.pricingTier,
        subscription: moduleSubscription,
      };
      
      next();
    } catch (error) {
      console.error('Error checking module access:', error);
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
      const userId = (req as any).user?.id;
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
      (req as any).usageInfo = {
        metric,
        currentUsage,
        limit,
        remaining: limit - currentUsage,
      };
      
      next();
    } catch (error) {
      console.error('Error checking usage limit:', error);
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
      enterprise: 2,
    };

    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
    const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Get user's subscription info
   */
  static async getUserSubscription(userId: string): Promise<SubscriptionTier | null> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscription ? {
      tier: subscription.tier as 'free' | 'standard' | 'enterprise',
      status: subscription.status as 'active' | 'cancelled' | 'past_due' | 'unpaid',
    } : null;
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