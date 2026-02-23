import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

// ============================================================================
// AI RECOMMENDATION ENGINE
// ============================================================================

/**
 * GET /api/place/ai/recommendations
 * Advanced AI-powered recommendations based on user behavior patterns
 */
export async function getAIRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    // Gather user behavior signals
    const [place, recentTransactions, dismissed] = await Promise.all([
      prisma.place.findUnique({
        where: { userId },
        include: {
          nodes: { where: { nodeType: 'BUSINESS' } },
          interests: true,
        },
      }),
      prisma.placeTransaction.findMany({
        where: { userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        include: { business: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.placeDismissedSuggestion.findMany({
        where: { userId },
        select: { businessId: true },
      }),
    ]);

    const followedIds = new Set((place?.nodes || []).map(n => n.entityId));
    const dismissedIds = new Set(dismissed.map(d => d.businessId));
    const excludeIds = [...followedIds, ...dismissedIds];
    const interestTags = (place?.interests || []).map(i => i.category.toLowerCase());

    // Score businesses: frequently-interacted categories get boosted
    const categoryFrequency: Record<string, number> = {};
    for (const tx of recentTransactions) {
      const listing = await prisma.businessPlaceListing.findUnique({
        where: { businessId: tx.businessId },
        select: { category: true },
      });
      if (listing) {
        categoryFrequency[listing.category] = (categoryFrequency[listing.category] || 0) + 1;
      }
    }

    // Fetch candidates
    const candidates = await prisma.businessPlaceListing.findMany({
      where: {
        isEnabled: true,
        isPublished: true,
        business: {
          einVerified: true,
          id: { notIn: excludeIds },
        },
      },
      include: {
        business: { select: { id: true, name: true, industry: true } },
      },
      take: 100,
    });

    // Score each candidate
    const scored = candidates.map(c => {
      let score = 0;
      let reasons: string[] = [];

      // Category match from transaction history
      if (categoryFrequency[c.category]) {
        score += categoryFrequency[c.category] * 3;
        reasons.push(`You frequently visit ${c.category.toLowerCase().replace('_', ' ')} places`);
      }

      // Interest match
      const tags = c.tags.map(t => t.toLowerCase());
      const matchingInterests = interestTags.filter(i => tags.includes(i));
      if (matchingInterests.length > 0) {
        score += matchingInterests.length * 5;
        reasons.push(`Matches your interest: ${matchingInterests.join(', ')}`);
      }

      // Tag overlap with followed businesses' tags
      if (score === 0 && c.shortDescription) {
        score += 1;
        reasons.push('Discover something new');
      }

      return { listing: c, score, reasons };
    });

    // Sort by score desc, take top 10
    scored.sort((a, b) => b.score - a.score);
    const recommendations = scored.slice(0, 10).map(s => ({
      businessId: s.listing.business.id,
      businessName: s.listing.displayName || s.listing.business.name,
      category: s.listing.category,
      description: s.listing.shortDescription,
      tags: s.listing.tags,
      score: s.score,
      reasons: s.reasons,
    }));

    res.json({ success: true, data: recommendations });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating AI recommendations:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
}

// ============================================================================
// AI PURCHASE ASSISTANT
// ============================================================================

/**
 * POST /api/place/ai/purchase-help
 * AI-assisted purchase: finds the best interaction link for what the user wants
 */
export async function getPurchaseHelp(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { query, businessId } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'query is required' });
      return;
    }

    const queryLower = query.toLowerCase();

    // If a specific business is targeted
    if (businessId && typeof businessId === 'string') {
      const listing = await prisma.businessPlaceListing.findUnique({
        where: { businessId },
        include: {
          interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          business: { select: { id: true, name: true } },
        },
      });

      if (!listing) {
        res.json({ success: true, data: { found: false, message: 'Business not found on Place' } });
        return;
      }

      // Match user intent to interaction link type
      const linkScores = listing.interactionLinks.map(link => {
        let score = 0;
        const labelLower = link.label.toLowerCase();
        const typeLower = link.type.toLowerCase();

        if (queryLower.includes('order') || queryLower.includes('delivery')) {
          if (['DOORDASH', 'UBEREATS', 'INSTACART'].includes(link.type)) score += 10;
          if (labelLower.includes('order') || labelLower.includes('deliver')) score += 5;
        }
        if (queryLower.includes('reserve') || queryLower.includes('book') || queryLower.includes('table')) {
          if (['OPENTABLE', 'RESY'].includes(link.type)) score += 10;
          if (labelLower.includes('reserv') || labelLower.includes('book')) score += 5;
        }
        if (queryLower.includes('menu') || queryLower.includes('website') || queryLower.includes('browse')) {
          if (link.type === 'WEBSITE') score += 8;
        }
        if (queryLower.includes('social') || queryLower.includes('follow')) {
          if (['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TIKTOK'].includes(link.type)) score += 6;
        }
        if (queryLower.includes('review') || queryLower.includes('rating')) {
          if (['YELP', 'GOOGLE_MAPS'].includes(link.type)) score += 8;
        }
        // Generic relevance from label
        if (labelLower.includes(queryLower) || typeLower.includes(queryLower)) score += 3;

        return { link, score };
      });

      linkScores.sort((a, b) => b.score - a.score);
      const bestMatch = linkScores[0];

      res.json({
        success: true,
        data: {
          found: true,
          businessName: listing.displayName || listing.business.name,
          recommendedLink: bestMatch ? {
            id: bestMatch.link.id,
            label: bestMatch.link.label,
            url: bestMatch.link.url,
            type: bestMatch.link.type,
            confidence: bestMatch.score > 5 ? 'high' : bestMatch.score > 0 ? 'medium' : 'low',
          } : null,
          allLinks: listing.interactionLinks.map(l => ({
            id: l.id, label: l.label, url: l.url, type: l.type,
          })),
          suggestion: bestMatch && bestMatch.score > 5
            ? `I recommend using "${bestMatch.link.label}" for ${listing.displayName || listing.business.name}`
            : `Here are the available ways to interact with ${listing.displayName || listing.business.name}`,
        },
      });
    } else {
      // Search across all followed businesses
      const place = await prisma.place.findUnique({
        where: { userId },
        include: { nodes: { where: { nodeType: 'BUSINESS' } } },
      });

      const businessIds = (place?.nodes || []).map(n => n.entityId);

      const listings = await prisma.businessPlaceListing.findMany({
        where: {
          businessId: { in: businessIds },
          isEnabled: true,
          isPublished: true,
        },
        include: {
          interactionLinks: { where: { isActive: true } },
          business: { select: { id: true, name: true } },
        },
      });

      // Simple text search across business names and descriptions
      const matches = listings.filter(l => {
        const text = [l.displayName, l.business.name, l.shortDescription, ...l.tags].join(' ').toLowerCase();
        return queryLower.split(' ').some(word => word.length > 2 && text.includes(word));
      });

      res.json({
        success: true,
        data: {
          found: matches.length > 0,
          businesses: matches.slice(0, 5).map(m => ({
            businessId: m.business.id,
            businessName: m.displayName || m.business.name,
            description: m.shortDescription,
            category: m.category,
            linkCount: m.interactionLinks.length,
          })),
          suggestion: matches.length > 0
            ? `I found ${matches.length} place${matches.length > 1 ? 's' : ''} on your Main Street that might help`
            : 'I couldn\'t find a matching business on your Main Street. Try exploring to add more places.',
        },
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in purchase help:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
}

// ============================================================================
// AI RESERVATION ASSISTANT
// ============================================================================

/**
 * POST /api/place/ai/reservation-help
 * AI-assisted reservation: finds OpenTable/Resy links and prepares info
 */
export async function getReservationHelp(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId, date, partySize } = req.body;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, error: 'businessId is required' });
      return;
    }

    const listing = await prisma.businessPlaceListing.findUnique({
      where: { businessId },
      include: {
        interactionLinks: { where: { isActive: true } },
        business: { select: { id: true, name: true } },
      },
    });

    if (!listing) {
      res.json({ success: true, data: { available: false, message: 'Business not found on Place' } });
      return;
    }

    // Find reservation-capable links
    const reservationLinks = listing.interactionLinks.filter(l =>
      ['OPENTABLE', 'RESY'].includes(l.type) ||
      l.label.toLowerCase().includes('reserv') ||
      l.label.toLowerCase().includes('book')
    );

    const websiteLink = listing.interactionLinks.find(l => l.type === 'WEBSITE');

    if (reservationLinks.length === 0) {
      res.json({
        success: true,
        data: {
          available: false,
          businessName: listing.displayName || listing.business.name,
          message: `${listing.displayName || listing.business.name} doesn't have online reservation links yet.`,
          alternativeLink: websiteLink ? { label: websiteLink.label, url: websiteLink.url } : null,
          suggestion: websiteLink
            ? 'You can check their website for reservation info'
            : 'Try calling them directly to make a reservation',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        available: true,
        businessName: listing.displayName || listing.business.name,
        reservationLinks: reservationLinks.map(l => ({
          id: l.id, label: l.label, url: l.url, type: l.type,
        })),
        requestDetails: {
          date: date || null,
          partySize: partySize || null,
        },
        suggestion: `I found ${reservationLinks.length} reservation option${reservationLinks.length > 1 ? 's' : ''} for ${listing.displayName || listing.business.name}. Click to book directly.`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in reservation help:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
}

// ============================================================================
// AI CONTEXT — TRANSACTION ACTIVITY
// ============================================================================

/**
 * GET /api/place/ai/context/activity
 * AI context provider: user transaction activity summary
 */
export async function getPlaceActivityContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalTransactions, recentPurchases, recentClicks, topBusinesses] = await Promise.all([
      prisma.placeTransaction.count({ where: { userId } }),
      prisma.placeTransaction.aggregate({
        where: { userId, type: 'PURCHASE', status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.placeTransaction.count({
        where: { userId, type: 'EXTERNAL_CLICK', createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.placeTransaction.groupBy({
        by: ['businessId'],
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const topIds = topBusinesses.map(t => t.businessId);
    const businesses = topIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: topIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameMap = Object.fromEntries(businesses.map(b => [b.id, b.name]));

    const meetingCount = await prisma.placeMeetingPlace.count({
      where: {
        OR: [
          { creatorId: userId },
          { invites: { some: { inviteeId: userId, status: 'ACCEPTED' } } },
        ],
        status: { in: ['PROPOSED', 'CONFIRMED'] },
      },
    });

    res.json({
      success: true,
      context: {
        summary: {
          totalTransactions,
          recentPurchases: recentPurchases._count.id,
          recentSpent: recentPurchases._sum.amount || 0,
          recentExternalClicks: recentClicks,
          upcomingMeetings: meetingCount,
          status: totalTransactions > 0 ? 'active' : 'new-user',
        },
        details: {
          topBusinesses: topBusinesses.map(t => ({
            businessId: t.businessId,
            name: nameMap[t.businessId] || 'Unknown',
            interactions: t._count.id,
          })),
        },
      },
      metadata: {
        provider: 'place',
        endpoint: 'activity',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching activity context:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch activity context' });
  }
}
