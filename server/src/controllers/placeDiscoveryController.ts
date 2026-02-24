import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { geolocationService } from '../services/geolocationService';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

interface SuggestionItem {
  listing: Record<string, unknown>;
  reason: string;
  score: number;
}

// ============================================================================
// GEOGRAPHIC SUGGESTIONS
// ============================================================================

/**
 * GET /api/place/discover/local
 * Surface businesses geographically near the user
 */
export async function getLocalSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const clientIP = geolocationService.getClientIP(req);
    const location = await geolocationService.detectUserLocation(clientIP);

    // Get user's dismissed listings
    const dismissed = await prisma.placeDismissedSuggestion.findMany({
      where: { userId },
      select: { businessId: true },
    });
    const dismissedIds = dismissed.map(d => d.businessId);

    // Get already-followed businesses
    const followedNodes = await prisma.placeNode.findMany({
      where: { place: { userId }, nodeType: 'BUSINESS' },
      select: { entityId: true },
    });
    const followedIds = followedNodes.map(n => n.entityId);

    const excludeIds = [...dismissedIds, ...followedIds];

    // Find published, verified businesses in same region/city
    const listings = await prisma.businessPlaceListing.findMany({
      where: {
        isEnabled: true,
        isPublished: true,
        business: {
          einVerified: true,
          id: { notIn: excludeIds.length > 0 ? excludeIds : undefined },
        },
      },
      include: {
        business: {
          select: {
            id: true, name: true, logo: true, einVerified: true,
            industry: true, address: true,
          },
        },
        interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const results: SuggestionItem[] = listings.map(l => ({
      listing: l as unknown as Record<string, unknown>,
      reason: `Near ${location.city}, ${location.region}`,
      score: 0.7,
    }));

    res.json({
      success: true,
      data: results,
      location: { city: location.city, region: location.region, country: location.country },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching local suggestions:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch local suggestions' });
  }
}

// ============================================================================
// ALGORITHM-DRIVEN ("FOR YOU") SUGGESTIONS
// ============================================================================

/**
 * GET /api/place/discover/for-you
 * Personalized suggestions based on user interests & existing follows
 */
export async function getForYouSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    // 1. Gather user signals
    const place = await prisma.place.findUnique({
      where: { userId },
      include: { interests: true, nodes: { where: { nodeType: 'BUSINESS' } } },
    });

    const interestCategories = (place?.interests || []).map(i => i.category.toUpperCase());
    const followedIds = (place?.nodes || []).map(n => n.entityId);

    // Get dismissed
    const dismissed = await prisma.placeDismissedSuggestion.findMany({
      where: { userId },
      select: { businessId: true },
    });
    const dismissedIds = dismissed.map(d => d.businessId);

    const excludeIds = [...followedIds, ...dismissedIds];

    // 2. Find category matches from user interests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interestWhere: any = {
      isEnabled: true,
      isPublished: true,
      business: {
        einVerified: true,
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
      },
    };

    if (interestCategories.length > 0) {
      interestWhere.category = { in: interestCategories };
    }

    const interestListings = await prisma.businessPlaceListing.findMany({
      where: interestWhere,
      include: {
        business: { select: { id: true, name: true, logo: true, einVerified: true, industry: true } },
        interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // 3. Find "similar to what you follow" — same categories as followed businesses
    const followedListings = followedIds.length > 0
      ? await prisma.businessPlaceListing.findMany({
          where: { businessId: { in: followedIds } },
          select: { category: true, tags: true },
        })
      : [];

    const followedCategories = [...new Set(followedListings.map(l => l.category))];
    const followedTags = [...new Set(followedListings.flatMap(l => l.tags))];

    let similarListings: typeof interestListings = [];
    if (followedCategories.length > 0) {
      const alreadyFoundIds = interestListings.map(l => l.business.id);
      const allExclude = [...excludeIds, ...alreadyFoundIds];

      similarListings = await prisma.businessPlaceListing.findMany({
        where: {
          isEnabled: true,
          isPublished: true,
          business: {
            einVerified: true,
            ...(allExclude.length > 0 && { id: { notIn: allExclude } }),
          },
          OR: [
            { category: { in: followedCategories } },
            ...(followedTags.length > 0 ? [{ tags: { hasSome: followedTags } }] : []),
          ],
        },
        include: {
          business: { select: { id: true, name: true, logo: true, einVerified: true, industry: true } },
          interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }

    // 4. Combine with reasons
    const results: SuggestionItem[] = [
      ...interestListings.map(l => ({
        listing: l as unknown as Record<string, unknown>,
        reason: `Matches your interest in ${l.category.replace('_', ' ').toLowerCase()}`,
        score: 0.9,
      })),
      ...similarListings.map(l => ({
        listing: l as unknown as Record<string, unknown>,
        reason: 'Similar to businesses you follow',
        score: 0.75,
      })),
    ];

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    res.json({ success: true, data: results.slice(0, 15) });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching for-you suggestions:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
}

// ============================================================================
// USER CONTROLS
// ============================================================================

/**
 * POST /api/place/discover/dismiss/:businessId
 * Dismiss a suggestion (won't show again)
 */
export async function dismissSuggestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const { reason } = req.body;

    await prisma.placeDismissedSuggestion.upsert({
      where: { userId_businessId: { userId, businessId } },
      update: { reason: reason || 'dismissed' },
      create: { userId, businessId, reason: reason || 'dismissed' },
    });

    res.json({ success: true, message: 'Suggestion dismissed' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error dismissing suggestion:', err.message);
    res.status(500).json({ success: false, error: 'Failed to dismiss suggestion' });
  }
}

// ============================================================================
// AI CONTEXT PROVIDERS
// ============================================================================

/**
 * GET /api/place/ai/context/connections
 * AI Context: User's place connections summary
 */
export async function getPlaceConnectionsContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const place = await prisma.place.findUnique({
      where: { userId },
      include: { nodes: true, interests: true },
    });

    if (!place) {
      res.json({
        success: true,
        context: { summary: { totalConnections: 0, status: 'not-created' }, details: {} },
        metadata: { provider: 'place', endpoint: 'connections', timestamp: new Date().toISOString() },
      });
      return;
    }

    const businessNodes = place.nodes.filter(n => n.nodeType === 'BUSINESS');
    const userNodes = place.nodes.filter(n => n.nodeType === 'USER');

    // Get business names for context
    const businessDetails = businessNodes.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: businessNodes.map(n => n.entityId) } },
          select: { id: true, name: true, industry: true },
        })
      : [];

    res.json({
      success: true,
      context: {
        summary: {
          totalConnections: place.nodes.length,
          businessesFollowed: businessNodes.length,
          userConnections: userNodes.length,
          interests: place.interests.map(i => i.category),
        },
        details: {
          businesses: businessDetails.map(b => ({ name: b.name, industry: b.industry })),
        },
      },
      metadata: { provider: 'place', endpoint: 'connections', timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching connections context:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch connections context' });
  }
}

/**
 * GET /api/place/ai/context/discoveries
 * AI Context: Available discoveries and trending businesses
 */
export async function getPlaceDiscoveriesContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    // Total available businesses
    const totalListings = await prisma.businessPlaceListing.count({
      where: { isEnabled: true, isPublished: true, business: { einVerified: true } },
    });

    // Category breakdown
    const categoryBreakdown = await prisma.businessPlaceListing.groupBy({
      by: ['category'],
      where: { isEnabled: true, isPublished: true, business: { einVerified: true } },
      _count: { id: true },
    });

    // Most followed (trending)
    const trending = await prisma.placeNode.groupBy({
      by: ['entityId'],
      where: { nodeType: 'BUSINESS' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const trendingIds = trending.map(t => t.entityId);
    const trendingBusinesses = trendingIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: trendingIds } },
          select: { id: true, name: true, industry: true },
        })
      : [];

    res.json({
      success: true,
      context: {
        summary: {
          totalAvailableBusinesses: totalListings,
          categories: categoryBreakdown.map(c => ({ category: c.category, count: c._count.id })),
        },
        details: {
          trending: trendingBusinesses.map(b => ({ name: b.name, industry: b.industry })),
        },
      },
      metadata: { provider: 'place', endpoint: 'discoveries', timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching discoveries context:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch discoveries context' });
  }
}
