/**
 * DEBUG BUSINESS TIER ENDPOINT
 * 
 * Check and update business tier
 * No auth required for debugging
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

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
          take: 1
        }
      }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    const activeSub = business.subscriptions[0];
    const effectiveTier = activeSub?.tier || business.tier || 'free';
    
    res.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        tier: business.tier,
        activeSubscription: activeSub ? {
          tier: activeSub.tier,
          status: activeSub.status
        } : null,
        effectiveTier: effectiveTier
      },
      hrAccess: {
        canInstallHR: effectiveTier === 'business_advanced' || effectiveTier === 'enterprise',
        currentTier: effectiveTier,
        requiredTier: 'business_advanced or enterprise'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check tier',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Update business tier (for testing)
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
        validTiers
      });
    }
    
    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { tier }
    });
    
    res.json({
      success: true,
      message: `Business tier updated to ${tier}`,
      business: {
        id: updated.id,
        name: updated.name,
        tier: updated.tier
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update tier',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

