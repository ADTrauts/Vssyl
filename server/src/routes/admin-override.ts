/**
 * ADMIN OVERRIDE ENDPOINTS
 * 
 * Allows super admins to manually:
 * - Grant/revoke admin access to users
 * - Set business subscription tiers without payment
 * - Override feature access for testing
 * 
 * SECURITY: Requires ADMIN role
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

// Helper to check if user is admin
const requireAdmin = (req: any, res: Response, next: any) => {
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * Get all users (for admin management)
 * GET /api/admin-override/users
 */
router.get('/users', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            businesses: true,
            subscriptions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    logSrvErr('admin_override_error_fetching_users', 'Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * Grant admin access to a user
 * POST /api/admin-override/users/:userId/make-admin
 */
router.post('/users/:userId/make-admin', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' }
    });

    res.json({
      success: true,
      message: `User ${updatedUser.email} is now an admin`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    logSrvErr('admin_override_error_granting_admin_access', 'Error granting admin access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant admin access'
    });
  }
});

/**
 * Revoke admin access from a user
 * POST /api/admin-override/users/:userId/revoke-admin
 */
router.post('/users/:userId/revoke-admin', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' }
    });

    res.json({
      success: true,
      message: `Admin access revoked for ${updatedUser.email}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    logSrvErr('admin_override_error_revoking_admin_access', 'Error revoking admin access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke admin access'
    });
  }
});

/**
 * Get all businesses (for admin management)
 * GET /api/admin-override/businesses
 */
router.get('/businesses', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        ein: true,
        tier: true,
        industry: true,
        size: true,
        createdAt: true,
        subscriptions: {
          where: { status: 'active' },
          select: {
            id: true,
            tier: true,
            status: true
          }
        },
        _count: {
          select: {
            members: { where: { isActive: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json({
      success: true,
      count: businesses.length,
      businesses: businesses.map(b => ({
        id: b.id,
        name: b.name,
        ein: b.ein,
        tier: b.tier,
        effectiveTier: b.subscriptions[0]?.tier || b.tier || 'free',
        industry: b.industry,
        size: b.size,
        memberCount: b._count.members,
        hasActiveSubscription: b.subscriptions.length > 0,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    logSrvErr('admin_override_error_fetching_businesses', 'Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch businesses'
    });
  }
});

/**
 * Set business tier (without payment)
 * POST /api/admin-override/businesses/:businessId/set-tier
 * Body: { tier: 'free' | 'business_basic' | 'business_advanced' | 'enterprise' }
 */
router.post('/businesses/:businessId/set-tier', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { tier } = req.body;

    logSrvDebug('admin_override_set_tier', 'Setting tier', { businessId, tier });

    const validTiers = ['free', 'business_basic', 'business_advanced', 'enterprise'];

    if (!tier || !validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
        validTiers
      });
    }

    // Simply update the business.tier field - that's all we need
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { tier },
      select: {
        id: true,
        name: true,
        tier: true
      }
    });

    logSrvDebug('admin_override_tier_updated', 'Business tier updated successfully', {
      business: business as Record<string, unknown>,
    });

    res.json({
      success: true,
      message: `Business tier set to ${tier}`,
      business: {
        id: business.id,
        name: business.name,
        tier: business.tier
      }
    });
  } catch (error: unknown) {
    logSrvErr('admin_override_error_setting_business_tier', 'Error setting business tier', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Failed to set business tier',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

/**
 * Quick fix: Set specific business to enterprise
 * POST /api/admin-override/quick-fix-tier
 * Body: { businessId: string }
 */
router.post('/quick-fix-tier', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'businessId required'
      });
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { tier: 'enterprise' }
    });

    res.json({
      success: true,
      message: `Business ${business.name} is now on Enterprise tier (complimentary)`,
      business: {
        id: business.id,
        name: business.name,
        tier: business.tier
      },
      note: 'Business tier updated. HR module and other enterprise features are now available.'
    });
  } catch (error) {
    logSrvErr('admin_override_error_setting_tier', 'Error setting tier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set tier',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

