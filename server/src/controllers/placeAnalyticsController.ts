import { Request, Response } from 'express';
import { Prisma, PlaceActivityType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

/**
 * GET /api/place/feed
 * Get user's activity feed (their own + public activity from connections)
 */
export async function getActivityFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { limit, offset, type } = req.query;
    const take = Math.min(parseInt(limit as string) || 30, 100);
    const skip = parseInt(offset as string) || 0;

    // Get user's connections for feed visibility
    const connections = await prisma.relationship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const connectionIds = connections.map(c =>
      c.senderId === userId ? c.receiverId : c.senderId
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { userId },
        { userId: { in: connectionIds }, isPrivate: false },
      ],
    };
    if (type && typeof type === 'string') where.type = type;

    const [items, total] = await Promise.all([
      prisma.placeActivityFeedItem.findMany({
        where,
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.placeActivityFeedItem.count({ where }),
    ]);

    res.json({ success: true, data: items, pagination: { total, limit: take, offset: skip } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching feed:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
}

/**
 * Helper: Record an activity feed item (called from other controllers)
 */
export async function recordActivity(
  userId: string,
  type: PlaceActivityType,
  title: string,
  options?: {
    description?: string;
    businessId?: string;
    targetUserId?: string;
    meetingId?: string;
    transactionId?: string;
    communityId?: string;
    metadata?: Record<string, unknown>;
    isPrivate?: boolean;
  }
): Promise<void> {
  try {
    await prisma.placeActivityFeedItem.create({
      data: {
        userId,
        type,
        title,
        description: options?.description || null,
        businessId: options?.businessId || null,
        targetUserId: options?.targetUserId || null,
        meetingId: options?.meetingId || null,
        transactionId: options?.transactionId || null,
        communityId: options?.communityId || null,
        metadata: options?.metadata ? (options.metadata as Prisma.InputJsonValue) : undefined,
        isPrivate: options?.isPrivate ?? false,
      },
    });
  } catch {
    // Non-critical — don't fail parent operations
  }
}

// ============================================================================
// PERSONAL ANALYTICS
// ============================================================================

/**
 * GET /api/place/analytics
 * Get comprehensive personal analytics for the user's Place activity
 */
export async function getPersonalAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { period } = req.query; // 'week' | 'month' | 'all'
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date('2020-01-01');
    }

    const [
      place,
      transactionStats,
      externalClicks,
      meetingsCreated,
      meetingsAttended,
      communitiesJoined,
      topCategoryData,
      recentActivity,
      networkGrowth,
    ] = await Promise.all([
      prisma.place.findUnique({
        where: { userId },
        include: { nodes: true, interests: true },
      }),
      prisma.placeTransaction.aggregate({
        where: { userId, type: 'PURCHASE', status: 'COMPLETED', createdAt: { gte: periodStart } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.placeTransaction.count({
        where: { userId, type: 'EXTERNAL_CLICK', createdAt: { gte: periodStart } },
      }),
      prisma.placeMeetingPlace.count({
        where: { creatorId: userId, createdAt: { gte: periodStart } },
      }),
      prisma.placeMeetingInvite.count({
        where: { inviteeId: userId, status: 'ACCEPTED', respondedAt: { gte: periodStart } },
      }),
      prisma.placeCommunityMember.count({ where: { userId } }),
      prisma.placeTransaction.groupBy({
        by: ['businessId'],
        where: { userId, createdAt: { gte: periodStart } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.placeActivityFeedItem.findMany({
        where: { userId, createdAt: { gte: periodStart } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Network growth: count nodes added per week for last 4 weeks
      prisma.placeNode.findMany({
        where: {
          place: { userId },
          createdAt: { gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Enrich top categories with business names
    const topBizIds = topCategoryData.map(t => t.businessId);
    const topBusinesses = topBizIds.length > 0
      ? await prisma.businessPlaceListing.findMany({
          where: { businessId: { in: topBizIds } },
          select: { businessId: true, category: true, displayName: true, business: { select: { name: true } } },
        })
      : [];
    const bizMap = Object.fromEntries(topBusinesses.map(b => [b.businessId, b]));

    // Build weekly growth data
    const weeklyGrowth = [0, 0, 0, 0];
    for (const node of networkGrowth) {
      const weeksAgo = Math.floor((now.getTime() - node.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksAgo >= 0 && weeksAgo < 4) weeklyGrowth[3 - weeksAgo]++;
    }

    // Category breakdown
    const categoryCount: Record<string, number> = {};
    for (const td of topCategoryData) {
      const cat = bizMap[td.businessId]?.category || 'OTHER';
      categoryCount[cat] = (categoryCount[cat] || 0) + td._count.id;
    }

    const businessNodes = (place?.nodes || []).filter(n => n.nodeType === 'BUSINESS');
    const userNodes = (place?.nodes || []).filter(n => n.nodeType === 'USER');

    res.json({
      success: true,
      data: {
        network: {
          totalNodes: (place?.nodes || []).length,
          businessNodes: businessNodes.length,
          userConnections: userNodes.length,
          interests: (place?.interests || []).length,
          communitiesJoined,
          weeklyGrowth,
        },
        spending: {
          totalSpent: transactionStats._sum.amount || 0,
          purchaseCount: transactionStats._count.id,
          externalClicks,
          topCategories: Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => ({ category, count })),
        },
        engagement: {
          meetingsCreated,
          meetingsAttended,
          totalActivity: recentActivity.length,
        },
        topBusinesses: topCategoryData.map(td => ({
          businessId: td.businessId,
          name: bizMap[td.businessId]?.displayName || bizMap[td.businessId]?.business?.name || 'Unknown',
          category: bizMap[td.businessId]?.category || 'OTHER',
          interactions: td._count.id,
        })),
        period: period || 'all',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching analytics:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
}

// ============================================================================
// DATA EXPORT (GDPR)
// ============================================================================

/**
 * GET /api/place/export
 * Export all user Place data as JSON (GDPR-compliant)
 */
export async function exportUserData(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const [place, transactions, meetings, invites, communities, feed, dismissed, locationPrivacy, followVisibility] = await Promise.all([
      prisma.place.findUnique({
        where: { userId },
        include: { nodes: true, interests: true, settings: true },
      }),
      prisma.placeTransaction.findMany({
        where: { userId },
        include: { business: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.placeMeetingPlace.findMany({
        where: { creatorId: userId },
        include: { invites: true },
      }),
      prisma.placeMeetingInvite.findMany({
        where: { inviteeId: userId },
        include: { meetingPlace: { select: { locationName: true, scheduledAt: true } } },
      }),
      prisma.placeCommunityMember.findMany({
        where: { userId },
        include: { community: { select: { name: true, type: true } } },
      }),
      prisma.placeActivityFeedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.placeDismissedSuggestion.findMany({ where: { userId } }),
      prisma.placeLocationPrivacy.findUnique({ where: { userId } }),
      prisma.placeFollowVisibility.findMany({ where: { userId } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      place: place ? {
        name: place.name,
        isSetupComplete: place.isSetupComplete,
        nodes: place.nodes.map(n => ({
          nodeType: n.nodeType,
          entityId: n.entityId,
          label: n.label,
          position: { x: n.positionX, y: n.positionY },
          color: n.color,
        })),
        interests: place.interests.map(i => i.category),
        settings: place.settings,
      } : null,
      transactions: transactions.map(t => ({
        type: t.type,
        status: t.status,
        amount: t.amount,
        currency: t.currency,
        description: t.description,
        businessName: t.business.name,
        externalService: t.externalService,
        isPrivate: t.isPrivate,
        createdAt: t.createdAt,
      })),
      meetings: meetings.map(m => ({
        locationName: m.locationName,
        scheduledAt: m.scheduledAt,
        status: m.status,
        note: m.note,
        inviteCount: m.invites.length,
        createdAt: m.createdAt,
      })),
      meetingInvites: invites.map(i => ({
        locationName: i.meetingPlace.locationName,
        scheduledAt: i.meetingPlace.scheduledAt,
        rsvpStatus: i.status,
      })),
      communities: communities.map(c => ({
        name: c.community.name,
        type: c.community.type,
        role: c.role,
        joinedAt: c.joinedAt,
      })),
      activityCount: feed.length,
      dismissedSuggestions: dismissed.length,
      privacySettings: {
        location: locationPrivacy,
        followVisibility: followVisibility.map(fv => ({
          businessId: fv.businessId,
          isVisible: fv.isVisible,
        })),
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="vssyl-place-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error exporting data:', err.message);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
}

// ============================================================================
// AI CONTEXT — ANALYTICS SUMMARY
// ============================================================================

/**
 * GET /api/place/ai/context/analytics
 * AI context provider for user analytics
 */
export async function getPlaceAnalyticsContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [place, purchases, clicks, communities, meetings] = await Promise.all([
      prisma.place.findUnique({
        where: { userId },
        include: { nodes: true, interests: true },
      }),
      prisma.placeTransaction.aggregate({
        where: { userId, type: 'PURCHASE', status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.placeTransaction.count({
        where: { userId, type: 'EXTERNAL_CLICK', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.placeCommunityMember.count({ where: { userId } }),
      prisma.placeMeetingPlace.count({
        where: {
          OR: [{ creatorId: userId }, { invites: { some: { inviteeId: userId } } }],
          status: { in: ['PROPOSED', 'CONFIRMED'] },
        },
      }),
    ]);

    res.json({
      success: true,
      context: {
        summary: {
          totalNodes: (place?.nodes || []).length,
          businessesFollowed: (place?.nodes || []).filter(n => n.nodeType === 'BUSINESS').length,
          userConnections: (place?.nodes || []).filter(n => n.nodeType === 'USER').length,
          interests: (place?.interests || []).map(i => i.category),
          recentPurchases: purchases._count.id,
          recentSpent: purchases._sum.amount || 0,
          externalClicks: clicks,
          communities,
          upcomingMeetings: meetings,
          engagementLevel: clicks + purchases._count.id > 10 ? 'high' :
            clicks + purchases._count.id > 3 ? 'moderate' : 'low',
        },
      },
      metadata: {
        provider: 'place',
        endpoint: 'analytics',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching analytics context:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics context' });
  }
}
