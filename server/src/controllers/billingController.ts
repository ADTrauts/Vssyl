import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { ModuleSubscriptionService } from '../services/moduleSubscriptionService';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
const subscriptionService = new SubscriptionService();
const moduleSubscriptionService = new ModuleSubscriptionService();

// Core subscription endpoints

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { tier, businessId, stripeCustomerId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!tier || !['free', 'standard', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const subscription = await subscriptionService.createSubscription({
      userId,
      businessId,
      tier,
      stripeCustomerId,
    });

    res.status(201).json({ subscription });
  } catch (error) {
    await logger.error('Failed to create subscription', {
      operation: 'billing_create_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user has access to this subscription
    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ subscription });
  } catch (error) {
    await logger.error('Failed to get subscription', {
      operation: 'billing_get_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);

    res.json({ subscription });
  } catch (error) {
    await logger.error('Failed to get user subscription', {
      operation: 'billing_get_user_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get user subscription' });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tier, status, cancelAtPeriodEnd } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSubscription = await subscriptionService.updateSubscription({
      subscriptionId: id,
      tier,
      status,
      cancelAtPeriodEnd,
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    await logger.error('Failed to update subscription', {
      operation: 'billing_update_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cancelledSubscription = await subscriptionService.cancelSubscription(id);

    res.json({ subscription: cancelledSubscription });
  } catch (error) {
    await logger.error('Failed to cancel subscription', {
      operation: 'billing_cancel_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const reactivateSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reactivatedSubscription = await subscriptionService.reactivateSubscription(id);

    res.json({ subscription: reactivatedSubscription });
  } catch (error) {
    await logger.error('Failed to reactivate subscription', {
      operation: 'billing_reactivate_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
};

// Module subscription endpoints

export const createModuleSubscription = async (req: Request, res: Response) => {
  try {
    const { moduleId, tier, businessId, stripeCustomerId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!moduleId) {
      return res.status(400).json({ error: 'Module ID is required' });
    }

    if (!tier || !['premium', 'enterprise'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const subscription = await moduleSubscriptionService.createModuleSubscription({
      userId,
      businessId,
      moduleId,
      tier,
      stripeCustomerId,
    });

    res.status(201).json({ subscription });
  } catch (error) {
    await logger.error('Failed to create module subscription', {
      operation: 'billing_create_module_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to create module subscription' });
  }
};

export const getModuleSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await moduleSubscriptionService.getModuleSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Module subscription not found' });
    }

    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ subscription });
  } catch (error) {
    await logger.error('Failed to get module subscription', {
      operation: 'billing_get_module_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get module subscription' });
  }
};

export const getUserModuleSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptions = await moduleSubscriptionService.getUserModuleSubscriptions(userId);

    res.json({ subscriptions });
  } catch (error) {
    await logger.error('Failed to get user module subscriptions', {
      operation: 'billing_get_user_module_subscriptions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get user module subscriptions' });
  }
};

export const updateModuleSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tier, status } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await moduleSubscriptionService.getModuleSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Module subscription not found' });
    }

    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSubscription = await moduleSubscriptionService.updateModuleSubscription({
      subscriptionId: id,
      tier,
      status,
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    await logger.error('Failed to update module subscription', {
      operation: 'billing_update_module_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update module subscription' });
  }
};

export const cancelModuleSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await moduleSubscriptionService.getModuleSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: 'Module subscription not found' });
    }

    if (subscription.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cancelledSubscription = await moduleSubscriptionService.cancelModuleSubscription(id);

    res.json({ subscription: cancelledSubscription });
  } catch (error) {
    await logger.error('Failed to cancel module subscription', {
      operation: 'billing_cancel_module_subscription',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to cancel module subscription' });
  }
};

// Usage tracking endpoints

export const getUsage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { period } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current period if not specified
    const now = new Date();
    const periodStart = period ? new Date(period as string) : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

    // Get core subscription usage
    const coreSubscription = await subscriptionService.getUserSubscription(userId);
    let coreUsage: any[] = [];
    if (coreSubscription) {
      coreUsage = await subscriptionService.getSubscriptionUsage(coreSubscription.id);
    }

    // Get module subscription usage
    const moduleSubscriptions = await moduleSubscriptionService.getUserModuleSubscriptions(userId);
    const moduleUsage = await Promise.all(
      moduleSubscriptions.map(async (sub: Record<string, any>) => {
        const usage = await moduleSubscriptionService.getModuleSubscriptionUsage(sub.id);
        return {
          moduleId: sub.moduleId,
          moduleName: sub.module.name,
          usage,
        };
      })
    );

    res.json({
      coreUsage,
      moduleUsage,
      period: {
        start: periodStart,
        end: periodEnd,
      },
    });
  } catch (error) {
    await logger.error('Failed to get usage', {
      operation: 'billing_get_usage',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get usage' });
  }
};

export const recordUsage = async (req: Request, res: Response) => {
  try {
    const { subscriptionId, moduleSubscriptionId, metric, quantity, cost } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!metric || !quantity || cost === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let usageRecord;

    if (subscriptionId) {
      // Record usage for core subscription
      usageRecord = await subscriptionService.recordUsage(subscriptionId, metric, quantity, cost);
    } else if (moduleSubscriptionId) {
      // Record usage for module subscription
      usageRecord = await moduleSubscriptionService.recordModuleUsage(moduleSubscriptionId, metric, quantity, cost);
    } else {
      return res.status(400).json({ error: 'Either subscriptionId or moduleSubscriptionId is required' });
    }

    res.status(201).json({ usageRecord });
  } catch (error) {
    await logger.error('Failed to record usage', {
      operation: 'billing_record_usage',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to record usage' });
  }
};

// Invoice endpoints

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { userId },
          { subscription: { userId } },
          { moduleSubscription: { userId } },
        ],
      },
      include: {
        subscription: true,
        moduleSubscription: {
          include: { module: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ invoices });
  } catch (error) {
    await logger.error('Failed to get invoices', {
      operation: 'billing_get_invoices',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get invoices' });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: true,
        moduleSubscription: {
          include: { module: true },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check access
    const hasAccess = 
      invoice.userId === userId ||
      (invoice.subscription && invoice.subscription.userId === userId) ||
      (invoice.moduleSubscription && invoice.moduleSubscription.userId === userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ invoice });
  } catch (error) {
    await logger.error('Failed to get invoice', {
      operation: 'billing_get_invoice',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get invoice' });
  }
};

// Developer revenue endpoints

export const getDeveloperRevenue = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { periodStart, periodEnd } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const start = periodStart ? new Date(periodStart as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = periodEnd ? new Date(periodEnd as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const revenue = await moduleSubscriptionService.getDeveloperRevenue(userId, start, end);

    res.json({ revenue });
  } catch (error) {
    await logger.error('Failed to get developer revenue', {
      operation: 'billing_get_developer_revenue',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get developer revenue' });
  }
}; 