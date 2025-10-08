import { prisma } from '../lib/prisma';

export interface FeatureConfig {
  name: string;
  requiredTier: 'free' | 'pro' | 'business_basic' | 'business_advanced' | 'enterprise';
  module: string;
  category: 'personal' | 'business';
  description: string;
  usageLimit?: number;
  usageMetric?: string;
}

export interface UsageLimit {
  metric: string;
  limit: number;
  currentUsage: number;
  remaining: number;
}

export class FeatureGatingService {
  // Simplified feature configurations - Personal vs Business context
  private static readonly FEATURES: Record<string, FeatureConfig> = {
    // ===== AI FEATURES =====
    'ai_basic': {
      name: 'Basic AI',
      requiredTier: 'free',
      module: 'ai',
      category: 'personal',
      description: 'Limited AI interactions (taste of AI)',
      usageLimit: 10,
      usageMetric: 'ai_messages',
    },
    'ai_unlimited': {
      name: 'Unlimited AI',
      requiredTier: 'pro',
      module: 'ai',
      category: 'personal',
      description: 'Unlimited AI chat and features',
    },
    'ai_business_basic': {
      name: 'Business AI - Basic',
      requiredTier: 'business_basic',
      module: 'ai',
      category: 'business',
      description: 'Basic AI settings for business context',
    },
    'ai_business_advanced': {
      name: 'Business AI - Advanced',
      requiredTier: 'business_advanced',
      module: 'ai',
      category: 'business',
      description: 'Advanced AI settings and business intelligence',
    },

    // ===== MODULE ACCESS =====
    'modules_all': {
      name: 'All Modules',
      requiredTier: 'free',
      module: 'platform',
      category: 'personal',
      description: 'Access to Chat, Drive, Calendar, Dashboard modules',
    },
    
    // ===== BUSINESS FEATURES =====
    'team_management': {
      name: 'Team Management',
      requiredTier: 'business_basic',
      module: 'business',
      category: 'business',
      description: 'Manage team members and basic permissions',
    },
    'enterprise_features': {
      name: 'Enterprise Features',
      requiredTier: 'business_basic',
      module: 'business',
      category: 'business',
      description: 'Advanced business features and compliance',
    },
    'advanced_analytics': {
      name: 'Advanced Analytics',
      requiredTier: 'business_advanced',
      module: 'analytics',
      category: 'business',
      description: 'Business intelligence and advanced reporting',
    },
    'custom_integrations': {
      name: 'Custom Integrations',
      requiredTier: 'enterprise',
      module: 'integrations',
      category: 'business',
      description: 'Custom API integrations and webhooks',
    },
    'dedicated_support': {
      name: 'Dedicated Support',
      requiredTier: 'enterprise',
      module: 'support',
      category: 'business',
      description: 'Dedicated customer success and technical support',
    },

    // ===== ADS =====
    'ads_free': {
      name: 'Ad-Free Experience',
      requiredTier: 'pro',
      module: 'platform',
      category: 'personal',
      description: 'Remove ads from the platform',
    },
  };

  /**
   * Get all available features
   */
  static getAllFeatures(): Record<string, FeatureConfig> {
    return this.FEATURES;
  }

  /**
   * Get features by category
   */
  static getFeaturesByCategory(category: 'personal' | 'business'): Record<string, FeatureConfig> {
    const filtered: Record<string, FeatureConfig> = {};
    Object.entries(this.FEATURES).forEach(([key, feature]) => {
      if (feature.category === category) {
        filtered[key] = feature;
      }
    });
    return filtered;
  }

  /**
   * Check if user has access to a specific feature
   */
  static async checkFeatureAccess(
    userId: string,
    featureName: string,
    businessId?: string
  ): Promise<{ hasAccess: boolean; reason?: string; usageInfo?: UsageLimit }> {
    const feature = this.FEATURES[featureName];
    if (!feature) {
      return { hasAccess: false, reason: 'Feature not found' };
    }

    // Get user's subscription
    let subscription;
    if (businessId) {
      // Check business subscription
      subscription = await prisma.subscription.findFirst({
        where: {
          businessId: businessId,
          status: 'active'
        }
      });
    } else {
      // Check personal subscription
      subscription = await prisma.subscription.findFirst({
        where: {
          userId: userId,
          businessId: null,
          status: 'active'
        }
      });
    }

    const userTier = subscription?.tier || 'free';

    // Check tier access
    const tierHierarchy = ['free', 'pro', 'business_basic', 'business_advanced', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(feature.requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return { 
        hasAccess: false, 
        reason: `Requires ${feature.requiredTier} tier or higher` 
      };
    }

    // Check usage limits if applicable
    if (feature.usageLimit && feature.usageMetric) {
      const usageInfo = await this.getUsageInfo(userId, feature.usageMetric, businessId);
      if (usageInfo.currentUsage >= usageInfo.limit) {
        return {
          hasAccess: false,
          reason: 'Usage limit exceeded',
          usageInfo
        };
      }
      return { hasAccess: true, usageInfo };
    }

    return { hasAccess: true };
  }

  /**
   * Get usage information for a specific metric
   */
  static async getUsageInfo(userId: string, metric: string, businessId?: string): Promise<UsageLimit> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const usage = await prisma.usageRecord.aggregate({
      where: {
        userId: userId,
        businessId: businessId,
        metric: metric,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      },
      _sum: {
        quantity: true
      }
    });

    const currentUsage = usage._sum.quantity || 0;
    
    // Get feature limit
    const feature = Object.values(this.FEATURES).find(f => f.usageMetric === metric);
    const limit = feature?.usageLimit || 0;

    return {
      metric,
      limit,
      currentUsage,
      remaining: Math.max(0, limit - currentUsage)
    };
  }

  /**
   * Record usage for a feature
   */
  static async recordUsage(
    userId: string,
    metric: string,
    quantity: number = 1,
    businessId?: string
  ): Promise<void> {
    const now = new Date();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    await prisma.usageRecord.create({
      data: {
        userId,
        businessId,
        metric,
        quantity,
        cost: 0, // Could be calculated based on pricing
        periodStart: startOfMonth,
        periodEnd: endOfMonth
      }
    });
  }

  /**
   * Get user's effective tier (considering business context)
   */
  static async getUserTier(userId: string, businessId?: string): Promise<string> {
    let subscription;
    
    if (businessId) {
      // Check business subscription first
      subscription = await prisma.subscription.findFirst({
        where: {
          businessId: businessId,
          status: 'active'
        }
      });
    }
    
    if (!subscription) {
      // Fall back to personal subscription
      subscription = await prisma.subscription.findFirst({
        where: {
          userId: userId,
          businessId: null,
          status: 'active'
        }
      });
    }

    return subscription?.tier || 'free';
  }

  /**
   * Check if user has access to business features
   */
  static async hasBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        businessId: businessId,
        status: 'active'
      }
    });

    return subscription?.tier && ['business_basic', 'business_advanced', 'enterprise'].includes(subscription.tier) || false;
  }

  /**
   * Get features available to user in current context
   */
  static async getAvailableFeatures(
    userId: string,
    businessId?: string
  ): Promise<{ personal: string[]; business: string[] }> {
    const userTier = await this.getUserTier(userId, businessId);
    const hasBusinessSub = businessId ? await this.hasBusinessAccess(userId, businessId) : false;

    const tierHierarchy = ['free', 'pro', 'business_basic', 'business_advanced', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);

    const availableFeatures = {
      personal: [] as string[],
      business: [] as string[]
    };

    Object.entries(this.FEATURES).forEach(([key, feature]) => {
      const requiredTierIndex = tierHierarchy.indexOf(feature.requiredTier);
      
      if (feature.category === 'personal' && userTierIndex >= requiredTierIndex) {
        availableFeatures.personal.push(key);
      } else if (feature.category === 'business' && hasBusinessSub && userTierIndex >= requiredTierIndex) {
        availableFeatures.business.push(key);
      }
    });

    return availableFeatures;
  }
}
