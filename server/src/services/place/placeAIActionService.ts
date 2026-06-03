import { PlaceServiceError } from './placeErrors';
import * as placeVisibilityService from './placeVisibilityService';

export type PlaceAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

type InteractionLink = {
  id: string;
  label: string;
  url: string;
  type: string;
};

type ListingRecord = Record<string, unknown> & {
  business?: { id?: string; name?: string; industry?: string };
  displayName?: string | null;
  shortDescription?: string | null;
  category?: string;
  tags?: string[];
  interactionLinks?: InteractionLink[];
};

function toOutcome(error: unknown, fallback: string): PlaceAIActionOutcome {
  if (error instanceof PlaceServiceError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message || fallback };
  }
  return { success: false, error: fallback };
}

function listingBusinessName(listing: ListingRecord): string {
  return (listing.displayName || listing.business?.name || 'Business') as string;
}

function scorePurchaseLink(queryLower: string, link: InteractionLink): number {
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
  if (labelLower.includes(queryLower) || typeLower.includes(queryLower)) score += 3;

  return score;
}

function isReservationLink(link: InteractionLink): boolean {
  return (
    ['OPENTABLE', 'RESY'].includes(link.type) ||
    link.label.toLowerCase().includes('reserv') ||
    link.label.toLowerCase().includes('book')
  );
}

function formatRecommendation(item: { listing: Record<string, unknown>; reason: string; score: number }) {
  const listing = item.listing as ListingRecord;
  const business = listing.business ?? {};
  return {
    businessId: business.id,
    businessName: listing.displayName || business.name,
    category: listing.category,
    description: listing.shortDescription,
    tags: listing.tags ?? [],
    score: item.score,
    reasons: [item.reason],
  };
}

export async function getPlaceContext(
  userId: string,
  scope?: string | null
): Promise<PlaceAIActionOutcome> {
  try {
    const normalized = (scope ?? 'all').toLowerCase();
    const include = (name: string) =>
      normalized === 'all' || normalized === name || normalized === `${name}_context`;

    const tasks: Array<Promise<[string, unknown]>> = [];

    if (include('overview')) {
      tasks.push(
        placeVisibilityService.getPlaceContextOverview(userId).then((data) => ['overview', data] as const)
      );
    }
    if (include('connections')) {
      tasks.push(
        placeVisibilityService
          .getPlaceConnectionsContext(userId)
          .then((data) => ['connections', data] as const)
      );
    }
    if (include('discoveries')) {
      tasks.push(
        placeVisibilityService
          .getPlaceDiscoveriesContext(userId)
          .then((data) => ['discoveries', data] as const)
      );
    }
    if (include('activity')) {
      tasks.push(
        placeVisibilityService.getPlaceActivityContext(userId).then((data) => ['activity', data] as const)
      );
    }
    if (include('analytics')) {
      tasks.push(
        placeVisibilityService
          .getPlaceAnalyticsContext(userId)
          .then((data) => ['analytics', data] as const)
      );
    }

    if (tasks.length === 0) {
      return { success: false, error: `Unknown Place context scope: ${scope}` };
    }

    const entries = await Promise.all(tasks);
    const context = Object.fromEntries(entries);

    return { success: true, data: { scope: normalized, context } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to load Place context');
  }
}

export async function recommendPlaces(
  userId: string,
  params?: { limit?: number }
): Promise<PlaceAIActionOutcome> {
  try {
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 20);
    const suggestions = await placeVisibilityService.getForYouSuggestions(userId);
    const recommendations = suggestions.slice(0, limit).map(formatRecommendation);

    return { success: true, data: { recommendations } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to generate recommendations');
  }
}

export async function purchaseHelp(
  userId: string,
  params: { query: string; businessId?: string | null }
): Promise<PlaceAIActionOutcome> {
  try {
    const query = params.query?.trim();
    if (!query) {
      return { success: false, error: 'query is required' };
    }

    const queryLower = query.toLowerCase();

    if (params.businessId) {
      let listing: ListingRecord;
      try {
        listing = (await placeVisibilityService.getBusinessProfile(
          userId,
          params.businessId
        )) as ListingRecord;
      } catch (error: unknown) {
        if (error instanceof PlaceServiceError && error.code === 'listing_not_found') {
          return { success: true, data: { found: false, message: 'Business not found on Place' } };
        }
        throw error;
      }

      const links = listing.interactionLinks ?? [];
      const linkScores = links
        .map((link) => ({ link, score: scorePurchaseLink(queryLower, link) }))
        .sort((a, b) => b.score - a.score);
      const bestMatch = linkScores[0];
      const businessName = listingBusinessName(listing);

      return {
        success: true,
        data: {
          found: true,
          businessName,
          recommendedLink: bestMatch
            ? {
                id: bestMatch.link.id,
                label: bestMatch.link.label,
                url: bestMatch.link.url,
                type: bestMatch.link.type,
                confidence: bestMatch.score > 5 ? 'high' : bestMatch.score > 0 ? 'medium' : 'low',
              }
            : null,
          allLinks: links.map((l) => ({
            id: l.id,
            label: l.label,
            url: l.url,
            type: l.type,
          })),
          suggestion:
            bestMatch && bestMatch.score > 5
              ? `I recommend using "${bestMatch.link.label}" for ${businessName}`
              : `Here are the available ways to interact with ${businessName}`,
        },
      };
    }

    const searchResults = await placeVisibilityService.searchListingsForUser(userId, query);
    const businesses = searchResults.slice(0, 5).map((r) => ({
      businessId: (r.metadata as { businessId?: string })?.businessId,
      businessName: r.title,
      description: r.description,
      category: (r.metadata as { category?: string })?.category,
    }));

    return {
      success: true,
      data: {
        found: businesses.length > 0,
        businesses,
        suggestion:
          businesses.length > 0
            ? `I found ${businesses.length} place${businesses.length > 1 ? 's' : ''} that might help`
            : 'I could not find a matching business. Try exploring to add more places.',
      },
    };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to process purchase help');
  }
}

export async function reservationHelp(
  userId: string,
  params: { businessId: string; date?: string | null; partySize?: number | null }
): Promise<PlaceAIActionOutcome> {
  try {
    const businessId = params.businessId?.trim();
    if (!businessId) {
      return { success: false, error: 'businessId is required' };
    }

    let listing: ListingRecord;
    try {
      listing = (await placeVisibilityService.getBusinessProfile(userId, businessId)) as ListingRecord;
    } catch (error: unknown) {
      if (error instanceof PlaceServiceError && error.code === 'listing_not_found') {
        return { success: true, data: { available: false, message: 'Business not found on Place' } };
      }
      throw error;
    }

    const businessName = listingBusinessName(listing);
    const links = listing.interactionLinks ?? [];
    const reservationLinks = links.filter(isReservationLink);
    const websiteLink = links.find((l) => l.type === 'WEBSITE');

    if (reservationLinks.length === 0) {
      return {
        success: true,
        data: {
          available: false,
          businessName,
          message: `${businessName} doesn't have online reservation links yet.`,
          alternativeLink: websiteLink ? { label: websiteLink.label, url: websiteLink.url } : null,
          suggestion: websiteLink
            ? 'You can check their website for reservation info'
            : 'Try calling them directly to make a reservation',
        },
      };
    }

    return {
      success: true,
      data: {
        available: true,
        businessName,
        reservationLinks: reservationLinks.map((l) => ({
          id: l.id,
          label: l.label,
          url: l.url,
          type: l.type,
        })),
        requestDetails: {
          date: params.date ?? null,
          partySize: params.partySize ?? null,
        },
        suggestion: `I found ${reservationLinks.length} reservation option${reservationLinks.length > 1 ? 's' : ''} for ${businessName}. Use the link to book externally — no calendar event is created automatically.`,
      },
    };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to process reservation help');
  }
}

export async function searchPlaces(
  userId: string,
  query: string
): Promise<PlaceAIActionOutcome> {
  try {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'query must be at least 2 characters' };
    }

    const results = await placeVisibilityService.searchListingsForUser(userId, trimmed);
    return { success: true, data: { query: trimmed, results } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to search places');
  }
}

/** Read-only Place AI operations exposed to ActionExecutor / tools. */
export const PLACE_AI_READ_OPERATIONS = [
  'get_place_context',
  'recommend_places',
  'purchase_help',
  'reservation_help',
  'search_places',
] as const;

export type PlaceAIReadOperation = (typeof PLACE_AI_READ_OPERATIONS)[number];

export function isPlaceAIReadOperation(operation: string): operation is PlaceAIReadOperation {
  return (PLACE_AI_READ_OPERATIONS as readonly string[]).includes(operation);
}
