/**
 * DEBUG BUSINESS TIER — admin-only, not mounted in production unless ENABLE_DEBUG_BUSINESS_TIER=true.
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  EntitlementServiceError,
  resolveBusinessTier,
  setBusinessTierAuthority,
} from '../services/account/entitlementService';
import { isPlatformTier } from '../services/account/entitlementTypes';

const router: express.Router = express.Router();

router.use(authenticateJWT, requireRole('ADMIN'));

/**
 * Get business tier information
 * GET /api/debug/business-tier/:businessId
 */
router.get('/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        tier: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    const resolution = await resolveBusinessTier(businessId);
    const activeSub = business.subscriptions[0];

    res.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        tier: business.tier,
        activeSubscription: activeSub
          ? {
              tier: activeSub.tier,
              status: activeSub.status,
            }
          : null,
        effectiveTier: resolution.tier,
        tierSource: resolution.source,
      },
      hrAccess: {
        canInstallHR:
          resolution.tier === 'business_advanced' || resolution.tier === 'enterprise',
        currentTier: resolution.tier,
        requiredTier: 'business_advanced or enterprise',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check tier',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Update business tier (for testing) — writes Subscription authority + syncs Business cache.
 * POST /api/debug/business-tier/:businessId
 * Body: { tier: 'free' | 'business_basic' | 'business_advanced' | 'enterprise' }
 */
router.post('/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { tier } = req.body;

    const validTiers = ['free', 'business_basic', 'business_advanced', 'enterprise'];

    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
        validTiers,
      });
    }

    if (!isPlatformTier(tier)) {
      return res.status(400).json({ success: false, error: 'Invalid tier' });
    }

    const actorUserId = req.user?.id;
    if (!actorUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await setBusinessTierAuthority({
      actorUserId,
      businessId,
      tier,
    });

    const updated = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, tier: true },
    });

    res.json({
      success: true,
      message: `Business tier updated to ${tier}`,
      business: {
        id: updated?.id,
        name: updated?.name,
        tier: updated?.tier,
      },
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    if (error instanceof EntitlementServiceError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update tier',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
