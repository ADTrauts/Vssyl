import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

const VSSYL_FEE_RATE = 0.029; // 2.9% platform fee (Shopify-style)

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * POST /api/place/transactions
 * Create a new Place transaction (purchase or external click)
 */
export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId, type, amount, currency, description, externalService, externalUrl, interactionLinkId } = req.body;

    if (!businessId || !type) {
      res.status(400).json({ success: false, error: 'businessId and type are required' });
      return;
    }

    const vssylFee = type === 'PURCHASE' && amount ? Math.round(amount * VSSYL_FEE_RATE * 100) / 100 : null;

    const transaction = await prisma.placeTransaction.create({
      data: {
        userId,
        businessId,
        type,
        amount: amount || null,
        currency: currency || 'USD',
        vssylFee,
        description: description || null,
        externalService: externalService || null,
        externalUrl: externalUrl || null,
        interactionLinkId: interactionLinkId || null,
        status: type === 'EXTERNAL_CLICK' ? 'COMPLETED' : 'PENDING',
        completedAt: type === 'EXTERNAL_CLICK' ? new Date() : null,
      },
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating transaction:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
}

/**
 * GET /api/place/transactions
 * Get the current user's transaction history
 */
export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { limit, offset, type, businessId } = req.query;
    const take = Math.min(parseInt(limit as string) || 30, 100);
    const skip = parseInt(offset as string) || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };
    if (type && typeof type === 'string') where.type = type;
    if (businessId && typeof businessId === 'string') where.businessId = businessId;

    const [transactions, total] = await Promise.all([
      prisma.placeTransaction.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, logo: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.placeTransaction.count({ where }),
    ]);

    res.json({ success: true, data: transactions, pagination: { total, limit: take, offset: skip } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
}

/**
 * GET /api/place/transactions/:transactionId
 * Get a single transaction with receipt data
 */
export async function getTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { transactionId } = req.params;

    const transaction = await prisma.placeTransaction.findUnique({
      where: { id: transactionId },
      include: {
        business: { select: { id: true, name: true, logo: true, email: true } },
      },
    });

    if (!transaction || transaction.userId !== userId) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching transaction:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
}

/**
 * PUT /api/place/transactions/:transactionId/privacy
 * Toggle transaction privacy
 */
export async function updateTransactionPrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { transactionId } = req.params;
    const { isPrivate } = req.body;

    if (typeof isPrivate !== 'boolean') {
      res.status(400).json({ success: false, error: 'isPrivate must be a boolean' });
      return;
    }

    const transaction = await prisma.placeTransaction.findUnique({ where: { id: transactionId } });
    if (!transaction || transaction.userId !== userId) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    const updated = await prisma.placeTransaction.update({
      where: { id: transactionId },
      data: { isPrivate },
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating transaction privacy:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update privacy' });
  }
}

/**
 * GET /api/place/transactions/summary
 * Get transaction summary stats for the user
 */
export async function getTransactionSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const [totalCount, purchases, clicks] = await Promise.all([
      prisma.placeTransaction.count({ where: { userId } }),
      prisma.placeTransaction.aggregate({
        where: { userId, type: 'PURCHASE', status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.placeTransaction.count({ where: { userId, type: 'EXTERNAL_CLICK' } }),
    ]);

    // Top businesses by interaction
    const topBusinesses = await prisma.placeTransaction.groupBy({
      by: ['businessId'],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topIds = topBusinesses.map(t => t.businessId);
    const businesses = topIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: topIds } },
          select: { id: true, name: true, logo: true },
        })
      : [];

    const businessMap = Object.fromEntries(businesses.map(b => [b.id, b]));

    res.json({
      success: true,
      data: {
        totalTransactions: totalCount,
        totalSpent: purchases._sum.amount || 0,
        purchaseCount: purchases._count.id,
        externalClickCount: clicks,
        topBusinesses: topBusinesses.map(t => ({
          business: businessMap[t.businessId] || { id: t.businessId, name: 'Unknown' },
          interactionCount: t._count.id,
        })),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
}

// ============================================================================
// INTERACTION CLICK TRACKING
// ============================================================================

/**
 * POST /api/place/interactions/click
 * Track an interaction link click (analytics + creates EXTERNAL_CLICK transaction)
 */
export async function trackInteractionClick(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId, interactionLinkId, externalService, url } = req.body;

    if (!businessId || !url) {
      res.status(400).json({ success: false, error: 'businessId and url are required' });
      return;
    }

    // Record click
    await prisma.placeInteractionClick.create({
      data: {
        userId,
        businessId,
        interactionLinkId: interactionLinkId || '',
        externalService: externalService || 'CUSTOM',
        url,
      },
    });

    // Also create an EXTERNAL_CLICK transaction
    await prisma.placeTransaction.create({
      data: {
        userId,
        businessId,
        type: 'EXTERNAL_CLICK',
        status: 'COMPLETED',
        description: `Visited ${externalService || 'external link'}`,
        externalService: externalService || null,
        externalUrl: url,
        interactionLinkId: interactionLinkId || null,
        completedAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Click tracked' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error tracking click:', err.message);
    res.status(500).json({ success: false, error: 'Failed to track click' });
  }
}

/**
 * GET /api/place/interactions/stats/:businessId
 * Get interaction stats for a business (business admin view)
 */
export async function getInteractionStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;

    // Verify admin access
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!member || !member.isActive || (member.role !== 'ADMIN' && member.role !== 'MANAGER')) {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const [totalClicks, clicksByService, recentClicks] = await Promise.all([
      prisma.placeInteractionClick.count({ where: { businessId } }),
      prisma.placeInteractionClick.groupBy({
        by: ['externalService'],
        where: { businessId },
        _count: { id: true },
      }),
      prisma.placeInteractionClick.count({
        where: {
          businessId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const followerCount = await prisma.placeNode.count({
      where: { nodeType: 'BUSINESS', entityId: businessId },
    });

    res.json({
      success: true,
      data: {
        totalClicks,
        clicksLast7Days: recentClicks,
        followerCount,
        byService: clicksByService.map(c => ({ service: c.externalService, count: c._count.id })),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
}
