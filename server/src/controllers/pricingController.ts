import { Request, Response } from 'express';
import { PricingService } from '../services/pricingService';
import { logger } from '../lib/logger';
import { sendPriceChangeNotification } from '../services/emailService';
import { prisma } from '../lib/prisma';
import { StripeService } from '../services/stripeService';
import { stripe, PRICING_CONFIG } from '../config/stripe';
import { getStripeProductIdForTier, getTierProductConfigKey } from '../lib/getStripeProductIdForTier';
import { getUserFromRequest } from '../middleware/auth';

/**
 * GET /api/pricing
 * Get all active pricing configurations
 */
export const getAllPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const pricing = await PricingService.getAllActivePricing();
    // Serialize dates to ISO strings for JSON response
    const serializedPricing = pricing.map(p => ({
      ...p,
      effectiveDate: p.effectiveDate.toISOString(),
      endDate: p.endDate?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    res.json({ pricing: serializedPricing });
  } catch (error) {
    await logger.error('Failed to get all pricing', {
      operation: 'pricing_get_all',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get pricing' });
  }
};

/**
 * GET /api/pricing/:tier
 * Get pricing for a specific tier
 */
export const getPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier } = req.params;
    const { billingCycle } = req.query;

    const cycle = (billingCycle as string) === 'yearly' ? 'yearly' : 'monthly';
    const pricing = await PricingService.getPricing(tier, cycle).catch(() => null);

    if (!pricing) {
      res.status(404).json({ error: 'Pricing not found for tier' });
      return;
    }

    // Serialize dates to ISO strings for JSON response
    const serializedPricing = {
      ...pricing,
      effectiveDate: pricing.effectiveDate.toISOString(),
      endDate: pricing.endDate?.toISOString() || null,
      createdAt: pricing.createdAt.toISOString(),
      updatedAt: pricing.updatedAt.toISOString(),
    };
    res.json({ pricing: serializedPricing });
  } catch (error) {
    await logger.error('Failed to get pricing', {
      operation: 'pricing_get',
      tier: req.params.tier,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get pricing' });
  }
};

/**
 * GET /api/pricing/:tier/info
 * Get pricing info in compatible format
 */
export const getPricingInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier } = req.params;
    const pricingInfo = await PricingService.getPricingInfo(tier);

    if (!pricingInfo) {
      res.status(404).json({ error: 'Pricing not found for tier' });
      return;
    }

    res.json({ pricing: pricingInfo });
  } catch (error) {
    await logger.error('Failed to get pricing info', {
      operation: 'pricing_get_info',
      tier: req.params.tier,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get pricing info' });
  }
};

/**
 * POST /api/pricing
 * Create or update pricing configuration (admin only)
 */
export const upsertPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { tier, billingCycle, basePrice: basePriceRaw, perEmployeePrice, includedEmployees, queryPackSmall, queryPackMedium, queryPackLarge, queryPackEnterprise, baseAIAllowance, stripePriceId, perEmployeeStripePriceId, effectiveDate, updateExistingSubscriptions } = req.body;

    const basePrice = typeof basePriceRaw === 'string' ? parseFloat(basePriceRaw) : Number(basePriceRaw);

    // Normalize query pack prices
    const normalizedQueryPackSmall = queryPackSmall !== undefined && queryPackSmall !== null ? (typeof queryPackSmall === 'string' ? parseFloat(queryPackSmall) : Number(queryPackSmall)) : undefined;
    const normalizedQueryPackMedium = queryPackMedium !== undefined && queryPackMedium !== null ? (typeof queryPackMedium === 'string' ? parseFloat(queryPackMedium) : Number(queryPackMedium)) : undefined;
    const normalizedQueryPackLarge = queryPackLarge !== undefined && queryPackLarge !== null ? (typeof queryPackLarge === 'string' ? parseFloat(queryPackLarge) : Number(queryPackLarge)) : undefined;
    const normalizedQueryPackEnterprise = queryPackEnterprise !== undefined && queryPackEnterprise !== null ? (typeof queryPackEnterprise === 'string' ? parseFloat(queryPackEnterprise) : Number(queryPackEnterprise)) : undefined;

    // Ensure fresh DB value for comparison (avoid stale cache when deciding to create Stripe price)
    PricingService.clearCache();
    const currentPricing = await PricingService.getPricing(tier, billingCycle);
    const oldPrice = currentPricing?.basePrice ?? 0;
    const oldPerEmployeePrice = currentPricing?.perEmployeePrice ?? null;
    const oldQueryPackSmall = currentPricing?.queryPackSmall ?? null;
    const oldQueryPackMedium = currentPricing?.queryPackMedium ?? null;
    const oldQueryPackLarge = currentPricing?.queryPackLarge ?? null;
    const oldQueryPackEnterprise = currentPricing?.queryPackEnterprise ?? null;

    // Record price change if price changed
    if (currentPricing && basePrice !== oldPrice) {
      await PricingService.recordPriceChange(
        currentPricing.id,
        'base_price',
        oldPrice,
        basePrice,
        req.body.reason || null,
        user.id
      );
    }

    const effectiveDateObj = effectiveDate ? new Date(effectiveDate) : new Date();

    // Resolve Stripe product ID (built-in tiers or admin-created tiers from SystemConfig)
    const productIdForTier = await getStripeProductIdForTier(tier);

    // Track Stripe outcome for API response (so admin UI can show why Stripe did/didn't update)
    let stripeBasePriceOutcome: 'created' | 'skipped_not_configured' | 'skipped_no_product' | 'skipped_no_change' | 'error' = 'skipped_no_change';
    let stripeBasePriceMessage: string | undefined;

    // Automatically create/update Stripe price if basePrice changed and tier is paid
    let updatedStripePriceId = stripePriceId;
    if (basePrice > 0 && basePrice !== oldPrice) {
      if (!productIdForTier) {
        stripeBasePriceOutcome = 'skipped_no_product';
        stripeBasePriceMessage = `No Stripe product for tier "${tier}". Add product in Stripe or create tier via Admin.`;
      } else {
        try {
          const { isStripeConfigured } = await import('../config/stripe');
          if (!isStripeConfigured()) {
            stripeBasePriceOutcome = 'skipped_not_configured';
            stripeBasePriceMessage = 'Stripe not configured (STRIPE_SECRET_KEY). Set in production env/secrets.';
            await logger.warn('Stripe not configured, skipping price creation', {
              operation: 'pricing_create_stripe_price',
              tier,
              billingCycle,
            });
          } else {
            const productId = productIdForTier;
            const interval = billingCycle === 'monthly' ? 'month' : 'year';
            const amountInCents = Math.round(basePrice * 100);

            const newStripePrice = await StripeService.createPrice(
              productId,
              amountInCents,
              'usd',
              { 
                interval: interval as 'month' | 'year',
                metadata: { type: 'base', tier, billingCycle }
              }
            );

            updatedStripePriceId = newStripePrice.id;
            stripeBasePriceOutcome = 'created';
            stripeBasePriceMessage = `New Stripe price created: ${newStripePrice.id}`;

            await logger.info('Created new Stripe price', {
              operation: 'pricing_create_stripe_price',
              tier,
              billingCycle,
              oldPrice,
              newPrice: basePrice,
              stripePriceId: newStripePrice.id,
            });
          }
        } catch (error: unknown) {
          stripeBasePriceOutcome = 'error';
          const err = error as Error & { type?: string; code?: string; cause?: Error };
          const detail = [
            err.message,
            err.type ? `(type: ${err.type})` : '',
            err.code ? `(code: ${err.code})` : '',
            err.cause?.message ? `(cause: ${err.cause.message})` : '',
          ].filter(Boolean).join(' ');
          stripeBasePriceMessage = detail || 'Unknown error';
          await logger.error('Failed to create Stripe price', {
            operation: 'pricing_create_stripe_price',
            tier,
            billingCycle,
            error: {
              message: err.message,
              stack: err.stack,
              code: err.code,
            },
            stripeErrorType: err.type,
            stripeErrorCause: err.cause?.message,
          });
        }
      }
    }
    // Preserve existing base Stripe price ID when we didn't create a new one and body didn't send one
    if (updatedStripePriceId === undefined || updatedStripePriceId === null) {
      updatedStripePriceId = currentPricing?.stripePriceId ?? undefined;
    }

    // Automatically create/update Stripe per-employee price if perEmployeePrice changed and tier is paid
    let updatedPerEmployeeStripePriceId = perEmployeeStripePriceId;
    if (perEmployeePrice !== undefined && perEmployeePrice !== null && perEmployeePrice > 0 && productIdForTier && perEmployeePrice !== oldPerEmployeePrice) {
      try {
        // Check if Stripe is configured
        const { isStripeConfigured } = await import('../config/stripe');
        if (!isStripeConfigured()) {
          await logger.warn('Stripe not configured, skipping per-employee price creation', {
            operation: 'pricing_create_per_employee_stripe_price',
            tier,
            billingCycle,
          });
        } else {
          const productId = productIdForTier;
          const interval = billingCycle === 'monthly' ? 'month' : 'year';
          const amountInCents = Math.round(perEmployeePrice * 100);

          // Create new Stripe price for per-employee charges
          // Use a separate product for per-employee pricing to keep it organized
          // Or use the same product with a different price
          const perEmployeePriceObj = await StripeService.createPrice(
            productId,
            amountInCents,
            'usd',
            { 
              interval: interval as 'month' | 'year',
              // Add metadata to identify this as per-employee pricing
              metadata: { type: 'per_employee', tier, billingCycle }
            }
          );

          updatedPerEmployeeStripePriceId = perEmployeePriceObj.id;

          await logger.info('Created new Stripe per-employee price', {
            operation: 'pricing_create_per_employee_stripe_price',
            tier,
            billingCycle,
            oldPerEmployeePrice,
            newPerEmployeePrice: perEmployeePrice,
            stripePriceId: perEmployeePriceObj.id,
          });
        }
      } catch (error) {
        // Log error but don't fail the request - pricing will still be saved
        await logger.error('Failed to create Stripe per-employee price', {
          operation: 'pricing_create_per_employee_stripe_price',
          tier,
          billingCycle,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
        // Continue with existing perEmployeeStripePriceId if provided
      }
    } else if (perEmployeePrice === null || perEmployeePrice === 0) {
      // If per-employee price is removed, clear the Stripe price ID
      updatedPerEmployeeStripePriceId = null;
    } else {
      // Preserve existing per-employee Stripe price ID when we didn't create/clear and body didn't send one
      updatedPerEmployeeStripePriceId = currentPricing?.perEmployeeStripePriceId ?? updatedPerEmployeeStripePriceId;
    }

    // Create/update Stripe prices for query packs if prices changed (query packs are global, not tier-specific)
    // Note: Query pack prices are stored per-tier in DB but should be the same across tiers
    // We create Stripe prices when any tier's query pack prices change
    const queryPackChanges: Array<{ packType: 'small' | 'medium' | 'large' | 'enterprise'; oldPrice: number | null; newPrice: number | undefined; stripePriceId?: string }> = [];
    
    if (normalizedQueryPackSmall !== undefined && normalizedQueryPackSmall !== oldQueryPackSmall && normalizedQueryPackSmall > 0) {
      queryPackChanges.push({ packType: 'small', oldPrice: oldQueryPackSmall, newPrice: normalizedQueryPackSmall });
    }
    if (normalizedQueryPackMedium !== undefined && normalizedQueryPackMedium !== oldQueryPackMedium && normalizedQueryPackMedium > 0) {
      queryPackChanges.push({ packType: 'medium', oldPrice: oldQueryPackMedium, newPrice: normalizedQueryPackMedium });
    }
    if (normalizedQueryPackLarge !== undefined && normalizedQueryPackLarge !== oldQueryPackLarge && normalizedQueryPackLarge > 0) {
      queryPackChanges.push({ packType: 'large', oldPrice: oldQueryPackLarge, newPrice: normalizedQueryPackLarge });
    }
    if (normalizedQueryPackEnterprise !== undefined && normalizedQueryPackEnterprise !== oldQueryPackEnterprise && normalizedQueryPackEnterprise > 0) {
      queryPackChanges.push({ packType: 'enterprise', oldPrice: oldQueryPackEnterprise, newPrice: normalizedQueryPackEnterprise });
    }

    // Create Stripe prices for changed query packs
    const { STRIPE_PRODUCTS } = await import('../config/stripe');
    const queryPackProductId = STRIPE_PRODUCTS.AI_QUERY_PACKS;
    const queryPackStripeResults: Array<{ packType: string; outcome: string; message: string; stripePriceId?: string }> = [];

    for (const change of queryPackChanges) {
      try {
        const { isStripeConfigured } = await import('../config/stripe');
        if (!isStripeConfigured()) {
          queryPackStripeResults.push({
            packType: change.packType,
            outcome: 'skipped_not_configured',
            message: 'Stripe not configured',
          });
          continue;
        }

        if (!queryPackProductId) {
          queryPackStripeResults.push({
            packType: change.packType,
            outcome: 'skipped_no_product',
            message: 'AI Query Packs product not found in Stripe',
          });
          continue;
        }

        const amountInCents = Math.round(change.newPrice! * 100);
        const newStripePrice = await StripeService.createPrice(
          queryPackProductId,
          amountInCents,
          'usd',
          {
            metadata: {
              type: 'ai_query_pack',
              packType: change.packType,
            },
          }
        );

        queryPackStripeResults.push({
          packType: change.packType,
          outcome: 'created',
          message: `Stripe price created: ${newStripePrice.id}`,
          stripePriceId: newStripePrice.id,
        });

        await logger.info('Created new Stripe price for query pack', {
          operation: 'pricing_create_query_pack_stripe_price',
          packType: change.packType,
          oldPrice: change.oldPrice,
          newPrice: change.newPrice,
          stripePriceId: newStripePrice.id,
        });
      } catch (error: unknown) {
        const err = error as Error & { type?: string; code?: string; cause?: Error };
        const detail = [
          err.message,
          err.type ? `(type: ${err.type})` : '',
          err.code ? `(code: ${err.code})` : '',
          err.cause?.message ? `(cause: ${err.cause.message})` : '',
        ].filter(Boolean).join(' ');
        queryPackStripeResults.push({
          packType: change.packType,
          outcome: 'error',
          message: detail || 'Unknown error',
        });
        await logger.error('Failed to create Stripe price for query pack', {
          operation: 'pricing_create_query_pack_stripe_price',
          packType: change.packType,
          error: {
            message: err.message,
            stack: err.stack,
            code: err.code,
          },
          stripeErrorType: err.type,
          stripeErrorCause: err.cause?.message,
        });
      }
    }

    const pricing = await PricingService.upsertPricing(
      tier,
      billingCycle,
      {
        basePrice,
        perEmployeePrice,
        includedEmployees,
        queryPackSmall,
        queryPackMedium,
        queryPackLarge,
        queryPackEnterprise,
        baseAIAllowance,
        stripePriceId: updatedStripePriceId,
        perEmployeeStripePriceId: updatedPerEmployeeStripePriceId,
        effectiveDate: effectiveDateObj,
        createdBy: user.id,
      }
    );

    // Update existing subscriptions to new price if requested
    if (updateExistingSubscriptions && basePrice !== oldPrice && updatedStripePriceId && oldPrice > 0) {
      try {
        const { SubscriptionService } = await import('../services/subscriptionService');
        const subscriptionService = new SubscriptionService();
        
        // Get all active subscriptions for this tier
        const subscriptions = await prisma.subscription.findMany({
          where: {
            tier,
            status: 'active',
            stripeSubscriptionId: { not: null },
          },
        });

        let updated = 0;
        let failed = 0;

        for (const subscription of subscriptions) {
          try {
            if (subscription.stripeSubscriptionId && stripe) {
              // Update Stripe subscription to use new price
              const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
              const subscriptionItemId = stripeSubscription.items.data[0]?.id;

              if (subscriptionItemId) {
                await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                  items: [
                    {
                      id: subscriptionItemId,
                      price: updatedStripePriceId,
                    },
                  ],
                  proration_behavior: 'none', // No proration - change takes effect on next billing cycle
                });

                updated++;
                await logger.info('Updated existing subscription to new price', {
                  operation: 'pricing_update_existing_subscription',
                  subscriptionId: subscription.id,
                  tier,
                  oldPrice,
                  newPrice: basePrice,
                  stripePriceId: updatedStripePriceId,
                });
              }
            }
          } catch (error) {
            failed++;
            await logger.error('Failed to update existing subscription', {
              operation: 'pricing_update_existing_subscription',
              subscriptionId: subscription.id,
              tier,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
          }
        }

        await logger.info('Updated existing subscriptions to new price', {
          operation: 'pricing_update_all_subscriptions',
          tier,
          total: subscriptions.length,
          updated,
          failed,
        });
      } catch (error) {
        // Log but don't fail the request
        await logger.error('Failed to update existing subscriptions', {
          operation: 'pricing_update_all_subscriptions',
          tier,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
      }
    }

    // Send email notifications if requested and price changed
    if (req.body.sendNotifications && basePrice !== oldPrice && oldPrice > 0) {
      try {
        // Get all active subscriptions for this tier
        const subscriptions = await prisma.subscription.findMany({
          where: {
            tier,
            status: 'active',
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        // Send notifications (non-blocking)
        Promise.all(
          subscriptions.map((sub) =>
            sendPriceChangeNotification({
              toEmail: sub.user.email,
              tier,
              billingCycle,
              oldPrice,
              newPrice: basePrice,
              effectiveDate: effectiveDateObj,
              userName: sub.user.name || undefined,
            }).catch((err) => {
              console.error(`Failed to send notification to ${sub.user.email}:`, err);
            })
          )
        ).catch((err) => {
          console.error('Error sending price change notifications:', err);
        });

        // Mark price change as notification sent
        if (currentPricing) {
          await prisma.priceChange.updateMany({
            where: {
              pricingConfigId: currentPricing.id,
              changeType: 'base_price',
              oldValue: oldPrice,
              newValue: basePrice,
            },
            data: {
              notificationSent: true,
              notificationSentAt: new Date(),
            },
          });
        }
      } catch (error) {
        // Log but don't fail the request
        await logger.error('Failed to send price change notifications', {
          operation: 'pricing_send_notifications',
          tier,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // Serialize dates to ISO strings for JSON response
    const serializedPricing = {
      ...pricing,
      effectiveDate: pricing.effectiveDate.toISOString(),
      endDate: pricing.endDate?.toISOString() || null,
      createdAt: pricing.createdAt.toISOString(),
      updatedAt: pricing.updatedAt.toISOString(),
    };
    const json: { 
      pricing: typeof serializedPricing; 
      stripe?: { 
        basePriceOutcome: string; 
        message?: string;
        queryPacks?: Array<{ packType: string; outcome: string; message: string; stripePriceId?: string }>;
      } 
    } = { pricing: serializedPricing };
    
    if (basePrice !== oldPrice && basePrice > 0) {
      json.stripe = { basePriceOutcome: stripeBasePriceOutcome, message: stripeBasePriceMessage };
    }
    
    if (queryPackStripeResults.length > 0) {
      if (!json.stripe) json.stripe = { basePriceOutcome: 'skipped_no_change' };
      json.stripe.queryPacks = queryPackStripeResults;
    }
    
    res.json(json);
  } catch (error) {
    await logger.error('Failed to upsert pricing', {
      operation: 'pricing_upsert',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to update pricing' });
  }
};

/**
 * POST /api/pricing/tiers
 * Create a new tier with Stripe product and monthly/yearly pricing (admin only)
 */
export const createTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { tier, displayName, basePriceMonthly, basePriceYearly, perEmployeePrice, includedEmployees } = req.body;

    const tierSlug = String(tier).trim().toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-z0-9_]+$/.test(tierSlug)) {
      res.status(400).json({ error: 'Tier must be a slug: lowercase letters, numbers, underscores only' });
      return;
    }
    const monthly = Number(basePriceMonthly);
    const yearly = Number(basePriceYearly);

    // Reject if tier already has a Stripe product (built-in or previously created)
    const existingProductId = await getStripeProductIdForTier(tierSlug);
    if (existingProductId) {
      res.status(400).json({ error: `Tier "${tierSlug}" already exists. Use Pricing Management to edit it.` });
      return;
    }

    // Reject if tier already has pricing configs
    const existingPricing = await PricingService.getPricing(tierSlug, 'monthly');
    if (existingPricing) {
      res.status(400).json({ error: `Tier "${tierSlug}" already has pricing. Use Pricing Management to edit it.` });
      return;
    }

    const { isStripeConfigured } = await import('../config/stripe');
    let stripeProductId: string | null = null;

    if (isStripeConfigured()) {
      const product = await StripeService.createProduct(
        displayName,
        `Subscription plan: ${displayName}`,
        { tier: tierSlug }
      );
      stripeProductId = product.id;
      await prisma.systemConfig.upsert({
        where: { configKey: getTierProductConfigKey(tierSlug) },
        create: {
          configKey: getTierProductConfigKey(tierSlug),
          configValue: stripeProductId,
          updatedBy: user.id,
        },
        update: {
          configValue: stripeProductId,
          updatedBy: user.id,
        },
      });
      await logger.info('Created Stripe product for new tier', {
        operation: 'pricing_create_tier',
        tier: tierSlug,
        stripeProductId,
      });
    }

    const effectiveDateObj = new Date();
    const perEmp = perEmployeePrice != null ? Number(perEmployeePrice) : undefined;
    const incl = includedEmployees != null ? Number(includedEmployees) : undefined;

    // Create Stripe prices for the new tier so we can pass stripePriceId to upsertPricing
    let monthlyStripePriceId: string | undefined;
    let yearlyStripePriceId: string | undefined;
    const productIdForTier = await getStripeProductIdForTier(tierSlug);
    if (productIdForTier && isStripeConfigured() && monthly > 0) {
      const monthlyPrice = await StripeService.createPrice(
        productIdForTier,
        Math.round(monthly * 100),
        'usd',
        { interval: 'month', metadata: { type: 'base', tier: tierSlug, billingCycle: 'monthly' } }
      );
      monthlyStripePriceId = monthlyPrice.id;
    }
    if (productIdForTier && isStripeConfigured() && yearly > 0) {
      const yearlyPrice = await StripeService.createPrice(
        productIdForTier,
        Math.round(yearly * 100),
        'usd',
        { interval: 'year', metadata: { type: 'base', tier: tierSlug, billingCycle: 'yearly' } }
      );
      yearlyStripePriceId = yearlyPrice.id;
    }

    const monthlyPricing = await PricingService.upsertPricing(
      tierSlug,
      'monthly',
      {
        basePrice: monthly,
        perEmployeePrice: Number.isNaN(perEmp) ? undefined : perEmp,
        includedEmployees: Number.isNaN(incl) ? undefined : incl,
        stripePriceId: monthlyStripePriceId,
        effectiveDate: effectiveDateObj,
        createdBy: user.id,
      }
    );
    const yearlyPricing = await PricingService.upsertPricing(
      tierSlug,
      'yearly',
      {
        basePrice: yearly,
        perEmployeePrice: Number.isNaN(perEmp) ? undefined : perEmp,
        includedEmployees: Number.isNaN(incl) ? undefined : incl,
        stripePriceId: yearlyStripePriceId,
        effectiveDate: effectiveDateObj,
        createdBy: user.id,
      }
    );

    const serialize = (p: { effectiveDate: Date; endDate?: Date | null; createdAt: Date; updatedAt: Date }) => ({
      ...p,
      effectiveDate: p.effectiveDate.toISOString(),
      endDate: p.endDate != null ? p.endDate.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });
    res.status(201).json({
      tier: tierSlug,
      displayName,
      stripeProductId: stripeProductId ?? undefined,
      pricing: {
        monthly: serialize(monthlyPricing),
        yearly: serialize(yearlyPricing),
      },
    });
  } catch (error) {
    await logger.error('Failed to create tier', {
      operation: 'pricing_create_tier',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to create tier' });
  }
};

/**
 * GET /api/pricing/:pricingConfigId/history
 * Get price change history for a pricing config
 */
export const getPriceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pricingConfigId } = req.params;
    const history = await PricingService.getPriceHistory(pricingConfigId);
    // Serialize dates to ISO strings for JSON response
    const serializedHistory = history.map(h => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
      notificationSentAt: h.notificationSentAt?.toISOString() || null,
    }));
    res.json({ history: serializedHistory });
  } catch (error) {
    await logger.error('Failed to get price history', {
      operation: 'pricing_get_history',
      pricingConfigId: req.params.pricingConfigId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get price history' });
  }
};

/**
 * POST /api/pricing/clear-cache
 * Clear pricing cache (admin only)
 */
export const clearPricingCache = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    PricingService.clearCache();
    res.json({ message: 'Pricing cache cleared' });
  } catch (error) {
    await logger.error('Failed to clear pricing cache', {
      operation: 'pricing_clear_cache',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};

/**
 * POST /api/pricing/calculate-impact
 * Calculate impact of a price change (admin only)
 */
export const calculatePriceImpact = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { tier, newBasePrice, billingCycle } = req.body as {
      tier: string;
      newBasePrice: number;
      billingCycle?: string;
    };

    const impact = await PricingService.calculatePriceChangeImpact(
      tier,
      typeof newBasePrice === 'number' ? newBasePrice : Number(newBasePrice),
      (billingCycle === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly'
    );

    res.json({ impact });
  } catch (error) {
    await logger.error('Failed to calculate price impact', {
      operation: 'pricing_calculate_impact',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to calculate impact' });
  }
};

/**
 * GET /api/pricing/history/all
 * Get all price change history (admin only)
 */
export const getAllPriceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { prisma } = await import('../lib/prisma');
    const history = await prisma.priceChange.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pricingConfig: {
          select: {
            tier: true,
            billingCycle: true,
          },
        },
      },
      take: 100, // Limit to last 100 changes
    }).catch(() => []); // Return empty array if query fails

    // Serialize dates to ISO strings for JSON response
    const serializedHistory = history.map(h => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
      notificationSentAt: h.notificationSentAt?.toISOString() || null,
    }));

    res.json({ history: serializedHistory });
  } catch (error) {
    await logger.error('Failed to get all price history', {
      operation: 'pricing_get_all_history',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({ error: 'Failed to get price history' });
  }
};

/**
 * GET /api/pricing/stripe-status
 * Admin-only: test Stripe connectivity (e.g. from Cloud Run). Runs both Stripe SDK and raw HTTPS
 * so you can see if the failure is SDK vs network (egress to api.stripe.com).
 */
export const stripeStatus = async (req: Request, res: Response): Promise<void> => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    res.json({ ok: false, reason: 'not_configured', message: 'STRIPE_SECRET_KEY not set', sdk: null, raw: null });
    return;
  }

  // 1) Raw HTTPS to api.stripe.com (tests egress / DNS / TLS)
  let rawResult: { ok: boolean; status?: number; error?: string } = { ok: false };
  try {
    const rawRes = await fetch('https://api.stripe.com/v1/products?limit=1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    rawResult = { ok: rawRes.ok, status: rawRes.status, error: rawRes.ok ? undefined : `HTTP ${rawRes.status}` };
  } catch (rawErr: unknown) {
    const e = rawErr as Error;
    rawResult = { ok: false, error: e.message || 'Request failed' };
  }

  // 2) Stripe SDK (same call – if raw works but SDK fails, it's SDK/env; if both fail, it's network)
  let sdkResult: { ok: boolean; error?: string; type?: string; cause?: string } = { ok: false };
  if (stripe) {
    try {
      await stripe.products.list({ limit: 1 });
      sdkResult = { ok: true };
    } catch (sdkErr: unknown) {
      const e = sdkErr as Error & { type?: string; cause?: Error };
      sdkResult = {
        ok: false,
        error: e.message,
        type: e.type,
        cause: e.cause?.message,
      };
    }
  } else {
    sdkResult = { ok: false, error: 'Stripe client not initialized' };
  }

  const ok = rawResult.ok && sdkResult.ok;
  if (!ok) {
    await logger.error('Stripe status check failed', {
      operation: 'pricing_stripe_status',
      raw: rawResult,
      sdk: sdkResult,
    });
  }
  res.json({
    ok,
    message: ok ? 'Stripe API reachable (SDK + raw)' : 'One or both checks failed',
    raw: rawResult,
    sdk: sdkResult,
    hint: !rawResult.ok
      ? 'Raw HTTPS to api.stripe.com failed – check Cloud Run egress, VPC/Cloud NAT if using all-traffic-through-vpc, and firewall.'
      : !sdkResult.ok
        ? 'Raw HTTPS succeeded but Stripe SDK failed – possible SDK/config issue.'
        : undefined,
  });
};

/**
 * POST /api/pricing/seed
 * Seed pricing configs from PRICING_CONFIG (admin only). Runs on the server so it
 * uses the production DB directly—no proxy or local script needed.
 */
export const seedPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const adminUserId = user.id;
    const now = new Date();
    const tiers = ['FREE', 'PRO', 'BUSINESS_BASIC', 'BUSINESS_ADVANCED', 'ENTERPRISE'] as const;
    const created: string[] = [];

    // Query pack default prices (same for all tiers; used when seeding)
    const { AI_QUERY_PACKS } = await import('../config/aiQueryPacks');
    const queryPackDefaults = {
      queryPackSmall: AI_QUERY_PACKS.small.price,
      queryPackMedium: AI_QUERY_PACKS.medium.price,
      queryPackLarge: AI_QUERY_PACKS.large.price,
      queryPackEnterprise: AI_QUERY_PACKS.enterprise.price,
    };

    for (const tier of tiers) {
      const config = PRICING_CONFIG[tier] as { monthly?: number; yearly?: number; perEmployee?: number; includedEmployees?: number } | undefined;
      if (!config) continue;

      // Deactivate any existing active pricing for this tier/cycle
      await prisma.pricingConfig.updateMany({
        where: {
          tier: tier.toLowerCase(),
          billingCycle: 'monthly',
          isActive: true,
        },
        data: { isActive: false, endDate: now },
      });
      await prisma.pricingConfig.updateMany({
        where: {
          tier: tier.toLowerCase(),
          billingCycle: 'yearly',
          isActive: true,
        },
        data: { isActive: false, endDate: now },
      });

      if (config.monthly !== undefined) {
        await prisma.pricingConfig.create({
          data: {
            tier: tier.toLowerCase(),
            billingCycle: 'monthly',
            basePrice: config.monthly,
            perEmployeePrice: config.perEmployee ?? null,
            includedEmployees: config.includedEmployees ?? null,
            ...queryPackDefaults,
            effectiveDate: now,
            isActive: true,
            createdBy: adminUserId,
          },
        });
        created.push(`${tier} monthly $${config.monthly}`);
      }
      if (config.yearly !== undefined) {
        await prisma.pricingConfig.create({
          data: {
            tier: tier.toLowerCase(),
            billingCycle: 'yearly',
            basePrice: config.yearly,
            perEmployeePrice: config.perEmployee ?? null,
            includedEmployees: config.includedEmployees ?? null,
            ...queryPackDefaults,
            effectiveDate: now,
            isActive: true,
            createdBy: adminUserId,
          },
        });
        created.push(`${tier} yearly $${config.yearly}`);
      }
    }

    await logger.info('Pricing seed completed', {
      operation: 'pricing_seed',
      userId: adminUserId,
      created: created.length,
    });
    res.json({ success: true, message: 'Pricing seeded', created });
  } catch (error) {
    await logger.error('Pricing seed failed', {
      operation: 'pricing_seed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    res.status(500).json({
      error: 'Failed to seed pricing',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

