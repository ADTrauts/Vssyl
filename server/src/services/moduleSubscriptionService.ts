import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { RevenueSplitService } from './revenueSplitService';
import {
  moduleRequiresBusinessSubscription,
  upsertPaidBusinessModuleSubscription,
  updateBusinessModuleSubscriptionStatusByStripeId,
  ensureFreeBusinessModuleSubscription,
} from './businessModuleSubscriptionService.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil' as any, // TypeScript types may lag behind Stripe API versions
}) : null;

export interface CreateModuleSubscriptionParams {
  userId: string;
  businessId?: string;
  moduleId: string;
  tier: 'premium' | 'enterprise';
  stripeCustomerId?: string;
}

export interface UpdateModuleSubscriptionParams {
  subscriptionId: string;
  tier?: 'premium' | 'enterprise';
  status?: 'active' | 'cancelled' | 'past_due';
}

export class ModuleSubscriptionService {
  /**
   * Create a new module subscription
   */
  async createModuleSubscription(params: CreateModuleSubscriptionParams) {
    const { userId, businessId, moduleId, tier, stripeCustomerId } = params;

    // Get module details
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { developer: true },
    });

    if (!module) {
      throw new Error('Module not found');
    }

    if (businessId && moduleRequiresBusinessSubscription(module)) {
      if (!stripeCustomerId || !stripe) {
        throw new Error(
          'Paid business module subscription requires Stripe configuration and customer id'
        );
      }
    }

    // Set subscription period (monthly)
    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Calculate pricing
    const amount = tier === 'enterprise' ? module.enterprisePrice : module.basePrice;
    
    // Calculate revenue split using Apple-style model
    const revenueSplit = await RevenueSplitService.calculateDeveloperShare(
      moduleId,
      amount,
      0 // New subscription, 0 months old
    );
    
    const platformRevenue = revenueSplit.platformShare;
    const developerRevenue = revenueSplit.developerShare;

    if (amount > 0 && stripeCustomerId && stripe) {
      this.resolveStripePriceId(module, tier);
    }

    // Create subscription in database
    const subscription = await prisma.moduleSubscription.create({
      data: {
        userId,
        businessId,
        moduleId,
        tier,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
        stripeCustomerId,
        amount,
        platformRevenue,
        developerRevenue,
      },
      include: {
        user: true,
        business: true,
        module: {
          include: { developer: true },
        },
      },
    });

    // If this is a paid module, create Stripe subscription
    if (amount > 0 && stripeCustomerId && stripe) {
      try {
        const priceId = this.resolveStripePriceId(module, tier);
        const stripeSubscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price: priceId,
            },
          ],
          metadata: {
            subscriptionId: subscription.id,
            userId,
            businessId: businessId || '',
            moduleId,
            isProprietary: module.isProprietary.toString(),
            developerId: module.developerId,
          },
        });

        // Update subscription with Stripe ID
        await prisma.moduleSubscription.update({
          where: { id: subscription.id },
          data: {
            stripeSubscriptionId: stripeSubscription.id,
          },
        });

        if (businessId && moduleRequiresBusinessSubscription(module)) {
          await upsertPaidBusinessModuleSubscription({
            businessId,
            moduleId,
            tier,
            amount,
            status: 'active',
            stripeSubscriptionId: stripeSubscription.id,
            actorUserId: userId,
          });
        }
      } catch (error: unknown) {
        const err = error as Error;
        await prisma.moduleSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        void logger.error('Stripe module subscription creation failed; rolled back DB row', {
          operation: 'create_module_subscription',
          moduleId,
          userId,
          businessId,
          error: { message: err.message, stack: err.stack },
        });
        throw new Error(
          'Could not activate paid module subscription with Stripe. Check module Stripe price configuration.'
        );
      }
    } else if (businessId && amount === 0 && !moduleRequiresBusinessSubscription(module)) {
      await ensureFreeBusinessModuleSubscription({
        businessId,
        moduleId,
        actorUserId: userId,
      });
    }

    return subscription;
  }

  /**
   * Get module subscription by ID
   */
  async getModuleSubscription(subscriptionId: string) {
    return await prisma.moduleSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true,
        business: true,
        module: {
          include: { developer: true },
        },
        usageRecords: true,
        invoices: true,
      },
    });
  }

  /**
   * Get user's active module subscriptions
   */
  async getUserModuleSubscriptions(userId: string) {
    return await prisma.moduleSubscription.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        module: {
          include: { developer: true },
        },
        usageRecords: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get business module subscriptions
   */
  async getBusinessModuleSubscriptions(businessId: string) {
    return await prisma.moduleSubscription.findMany({
      where: {
        businessId,
        status: 'active',
      },
      include: {
        user: true,
        module: {
          include: { developer: true },
        },
        usageRecords: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update module subscription
   */
  async updateModuleSubscription(params: UpdateModuleSubscriptionParams) {
    const { subscriptionId, tier, status } = params;

    const subscription = await prisma.moduleSubscription.findUnique({
      where: { id: subscriptionId },
      include: { module: true },
    });

    if (!subscription) {
      throw new Error('Module subscription not found');
    }

    const updateData: Record<string, unknown> = {};
    if (tier) updateData.tier = tier;
    if (status) updateData.status = status;

    // Recalculate pricing if tier changed
    if (tier && tier !== subscription.tier) {
      const amount = tier === 'enterprise' ? subscription.module.enterprisePrice : subscription.module.basePrice;
      
      // Calculate subscription age for revenue split
      const subscriptionAgeMonths = RevenueSplitService.calculateSubscriptionAgeMonths(
        subscription.currentPeriodStart
      );
      
      // Calculate revenue split using Apple-style model
      const revenueSplit = await RevenueSplitService.calculateDeveloperShare(
        subscription.moduleId,
        amount,
        subscriptionAgeMonths
      );
      
      updateData.amount = amount;
      updateData.platformRevenue = revenueSplit.platformShare;
      updateData.developerRevenue = revenueSplit.developerShare;
    }

    // Update in database
    const updatedSubscription = await prisma.moduleSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        user: true,
        business: true,
        module: {
          include: { developer: true },
        },
      },
    });

    // Update Stripe subscription if it exists
    if (subscription.stripeSubscriptionId) {
      try {
        const priceId = this.resolveStripePriceId(subscription.module, tier || subscription.tier);
        await stripe!.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: (await stripe!.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
              price: priceId,
            },
          ],
        });
      } catch (error: unknown) {
        const err = error as Error;
        void logger.error('Error updating Stripe module subscription', {
          operation: 'update_module_subscription',
          subscriptionId,
          error: { message: err.message, stack: err.stack },
        });
      }
    }

    return updatedSubscription;
  }

  /**
   * Cancel module subscription
   */
  async cancelModuleSubscription(subscriptionId: string) {
    const subscription = await prisma.moduleSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Module subscription not found');
    }

    // Update database
    const updatedSubscription = await prisma.moduleSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
      },
      include: {
        user: true,
        business: true,
        module: {
          include: { developer: true },
        },
      },
    });

    // Cancel Stripe subscription if it exists
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe!.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (error: unknown) {
        const err = error as Error;
        void logger.error('Error cancelling Stripe module subscription', {
          operation: 'cancel_module_subscription',
          subscriptionId,
          error: { message: err.message, stack: err.stack },
        });
      }
    }

    return updatedSubscription;
  }

  /**
   * Get module subscription usage
   */
  async getModuleSubscriptionUsage(subscriptionId: string) {
    const usageRecords = await prisma.usageRecord.findMany({
      where: { moduleSubscriptionId: subscriptionId },
      orderBy: { periodStart: 'desc' },
    });

    return usageRecords;
  }

  /**
   * Record usage for module subscription
   */
  async recordModuleUsage(subscriptionId: string, metric: string, quantity: number, cost: number) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await prisma.usageRecord.create({
      data: {
        moduleSubscriptionId: subscriptionId,
        metric,
        quantity,
        cost,
        periodStart,
        periodEnd,
        userId: '', // Will be set by the calling service
        businessId: '', // Will be set by the calling service
      },
    });
  }

  /**
   * Get developer revenue for a period
   */
  async getDeveloperRevenue(developerId: string, periodStart: Date, periodEnd: Date) {
    const revenue = await prisma.developerRevenue.findMany({
      where: {
        developerId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      include: {
        module: true,
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    return revenue;
  }

  /**
   * Calculate and record developer revenue
   */
  async calculateDeveloperRevenue(periodStart: Date, periodEnd: Date) {
    // Get all module subscriptions for the period
    const subscriptions = await prisma.moduleSubscription.findMany({
      where: {
        status: 'active',
        currentPeriodStart: { gte: periodStart },
        currentPeriodEnd: { lte: periodEnd },
        developerRevenue: { gt: 0 },
      },
      include: {
        module: {
          include: { developer: true },
        },
      },
    });

    // Create developer revenue records with proper revenue split calculation
    // Group by developer+module first, then calculate split based on average subscription age
    const revenueByDeveloperModule: Record<string, {
      developerId: string;
      moduleId: string;
      totalAmount: number;
      subscriptions: Array<{ amount: number; ageMonths: number }>;
    }> = {};
    
    for (const subscription of subscriptions) {
      const developerId = subscription.module.developerId;
      const moduleId = subscription.moduleId;
      const key = `${developerId}:${moduleId}`;
      
      // Calculate subscription age for revenue split
      const subscriptionAgeMonths = RevenueSplitService.calculateSubscriptionAgeMonths(
        subscription.currentPeriodStart
      );
      
      if (!revenueByDeveloperModule[key]) {
        revenueByDeveloperModule[key] = {
          developerId,
          moduleId,
          totalAmount: 0,
          subscriptions: [],
        };
      }
      
      revenueByDeveloperModule[key].totalAmount += subscription.amount;
      revenueByDeveloperModule[key].subscriptions.push({
        amount: subscription.amount,
        ageMonths: subscriptionAgeMonths,
      });
    }
    
    // Create database records with revenue split calculation
    const createdRecords = [];
    for (const [key, data] of Object.entries(revenueByDeveloperModule)) {
      // Calculate average subscription age (weighted by amount)
      const totalAmount = data.totalAmount;
      const weightedAge = data.subscriptions.reduce((sum, sub) => {
        return sum + (sub.ageMonths * (sub.amount / totalAmount));
      }, 0);
      const avgAgeMonths = Math.round(weightedAge);
      
      // Calculate revenue split using Apple-style model
      const revenueSplit = await RevenueSplitService.calculateDeveloperShare(
        data.moduleId,
        data.totalAmount,
        avgAgeMonths
      );
      
      const created = await prisma.developerRevenue.create({
        data: {
          developerId: data.developerId,
          moduleId: data.moduleId,
          periodStart,
          periodEnd,
          totalRevenue: data.totalAmount,
          platformRevenue: revenueSplit.platformShare,
          developerRevenue: revenueSplit.developerShare,
          commissionRate: revenueSplit.commissionRate,
          commissionType: revenueSplit.commissionType,
          subscriptionAgeMonths: avgAgeMonths,
          isFirstYear: avgAgeMonths <= 12,
          payoutStatus: 'pending',
        },
      });
      createdRecords.push(created);
    }

    return createdRecords;
  }

  /**
   * Resolve Stripe Price ID for a module tier.
   * Priority: tier-specific env → `Module.stripePriceId` → generic env for module id.
   */
  private resolveStripePriceId(
    module: { id: string; stripePriceId: string | null },
    tier: string
  ): string {
    const safe = module.id.replace(/[^a-zA-Z0-9]/g, '_');
    const tierUpper = tier.toLowerCase() === 'enterprise' ? 'ENTERPRISE' : 'PREMIUM';
    const envTier = process.env[`STRIPE_MODULE_PRICE_${safe}_${tierUpper}`]?.trim();
    if (envTier) {
      return envTier;
    }
    if (module.stripePriceId?.trim()) {
      return module.stripePriceId.trim();
    }
    const envFallback = process.env[`STRIPE_MODULE_PRICE_${safe}`]?.trim();
    if (envFallback) {
      return envFallback;
    }
    throw new Error(
      `No Stripe price ID for module ${module.id} (${tier}). Set Module.stripePriceId in the database or env STRIPE_MODULE_PRICE_${safe}_${tierUpper}.`
    );
  }

  /**
   * Handle Stripe webhook events for module subscriptions
   */
  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handleModulePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleModulePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.handleModuleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleModulePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as { subscription?: string }).subscription;
    if (subscriptionId) {
      await prisma.moduleSubscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'active' },
      });
      await updateBusinessModuleSubscriptionStatusByStripeId(subscriptionId, 'active');
    }
  }

  private async handleModulePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as { subscription?: string }).subscription;
    if (subscriptionId) {
      await prisma.moduleSubscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'past_due' },
      });
      await updateBusinessModuleSubscriptionStatusByStripeId(subscriptionId, 'past_due');
    }
  }

  private async handleModuleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await prisma.moduleSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'cancelled' },
    });
    await updateBusinessModuleSubscriptionStatusByStripeId(subscription.id, 'cancelled');
  }
} 