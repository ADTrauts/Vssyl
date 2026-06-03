import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as placeVisibilityService from '../place/placeVisibilityService';
import * as placeAIActionService from '../place/placeAIActionService';
import { PlaceServiceError } from '../place/placeErrors';

const serviceSource = readFileSync(
  join(process.cwd(), 'src/services/place/placeAIActionService.ts'),
  'utf8'
);

describe('placeAIActionService (Wave 1F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has no direct Prisma usage', () => {
    expect(serviceSource).not.toMatch(/\bprisma\./);
    expect(serviceSource).toMatch(/placeVisibilityService/);
  });

  it('getPlaceContext delegates to visibility service', async () => {
    vi.spyOn(placeVisibilityService, 'getPlaceContextOverview').mockResolvedValue({
      context: { summary: { totalNodes: 1, isSetup: true, status: 'active' } },
      metadata: { provider: 'place', endpoint: 'overview', timestamp: '' },
    } as never);
    vi.spyOn(placeVisibilityService, 'getPlaceConnectionsContext').mockResolvedValue({
      context: { summary: { totalConnections: 0, status: 'active' } },
      metadata: { provider: 'place', endpoint: 'connections', timestamp: '' },
    } as never);
    vi.spyOn(placeVisibilityService, 'getPlaceDiscoveriesContext').mockResolvedValue({
      context: { summary: { totalAvailableBusinesses: 5, categories: [] } },
      metadata: { provider: 'place', endpoint: 'discoveries', timestamp: '' },
    } as never);
    vi.spyOn(placeVisibilityService, 'getPlaceActivityContext').mockResolvedValue({
      context: {
        summary: {
          totalTransactions: 0,
          recentPurchases: 0,
          recentSpent: 0,
          recentExternalClicks: 0,
          upcomingMeetings: 0,
          status: 'active',
        },
      },
      metadata: { provider: 'place', endpoint: 'activity', timestamp: '' },
    } as never);
    vi.spyOn(placeVisibilityService, 'getPlaceAnalyticsContext').mockResolvedValue({
      context: {
        summary: {
          totalNodes: 0,
          businessesFollowed: 0,
          userConnections: 0,
          interests: [],
          recentPurchases: 0,
          recentSpent: 0,
          externalClicks: 0,
          communities: 0,
          upcomingMeetings: 0,
          engagementLevel: 'low',
        },
      },
      metadata: { provider: 'place', endpoint: 'analytics', timestamp: '' },
    } as never);

    const outcome = await placeAIActionService.getPlaceContext('user-1', 'all');

    expect(outcome.success).toBe(true);
    expect(placeVisibilityService.getPlaceContextOverview).toHaveBeenCalledWith('user-1');
    expect(placeVisibilityService.getPlaceDiscoveriesContext).toHaveBeenCalledWith('user-1');
  });

  it('recommendPlaces delegates to getForYouSuggestions', async () => {
    vi.spyOn(placeVisibilityService, 'getForYouSuggestions').mockResolvedValue([
      {
        listing: {
          business: { id: 'biz-1', name: 'Cafe' },
          category: 'RESTAURANT',
          shortDescription: 'Coffee',
          tags: ['coffee'],
        },
        reason: 'Matches your interest',
        score: 0.9,
      },
    ]);

    const outcome = await placeAIActionService.recommendPlaces('user-1', { limit: 5 });

    expect(outcome.success).toBe(true);
    expect(placeVisibilityService.getForYouSuggestions).toHaveBeenCalledWith('user-1');
    const data = outcome.success ? (outcome.data as { recommendations: unknown[] }) : null;
    expect(data?.recommendations).toHaveLength(1);
  });

  it('purchaseHelp returns links only for targeted business', async () => {
    vi.spyOn(placeVisibilityService, 'getBusinessProfile').mockResolvedValue({
      displayName: 'Pizza Place',
      business: { id: 'biz-1', name: 'Pizza Place' },
      interactionLinks: [
        { id: 'l1', label: 'Order on DoorDash', url: 'https://doordash.example', type: 'DOORDASH' },
      ],
    } as never);

    const outcome = await placeAIActionService.purchaseHelp('user-1', {
      query: 'order delivery',
      businessId: 'biz-1',
    });

    expect(outcome.success).toBe(true);
    const data = outcome.success ? (outcome.data as { recommendedLink?: { url: string } }) : null;
    expect(data?.recommendedLink?.url).toBe('https://doordash.example');
    expect(serviceSource).not.toMatch(/placeTransaction\.create/);
  });

  it('purchaseHelp searches listings when no businessId', async () => {
    vi.spyOn(placeVisibilityService, 'searchListingsForUser').mockResolvedValue([
      {
        id: 'listing-1',
        title: 'Bakery',
        description: 'Fresh bread',
        moduleId: 'place',
        moduleName: 'Place',
        url: '/place?business=biz-2',
        type: 'business_listing',
        metadata: { businessId: 'biz-2', category: 'GROCERY' },
        permissions: [{ type: 'read', granted: true }],
        lastModified: new Date(),
        relevanceScore: 0.8,
      },
    ]);

    const outcome = await placeAIActionService.purchaseHelp('user-1', { query: 'bakery' });

    expect(outcome.success).toBe(true);
    expect(placeVisibilityService.searchListingsForUser).toHaveBeenCalledWith('user-1', 'bakery');
  });

  it('reservationHelp returns guidance only', async () => {
    vi.spyOn(placeVisibilityService, 'getBusinessProfile').mockResolvedValue({
      displayName: 'Bistro',
      business: { id: 'biz-3', name: 'Bistro' },
      interactionLinks: [
        { id: 'r1', label: 'Reserve on OpenTable', url: 'https://opentable.example', type: 'OPENTABLE' },
      ],
    } as never);

    const outcome = await placeAIActionService.reservationHelp('user-1', {
      businessId: 'biz-3',
      date: '2026-06-10',
      partySize: 4,
    });

    expect(outcome.success).toBe(true);
    const data = outcome.success
      ? (outcome.data as { available: boolean; reservationLinks: unknown[]; suggestion: string })
      : null;
    expect(data?.available).toBe(true);
    expect(data?.reservationLinks).toHaveLength(1);
    expect(data?.suggestion).toMatch(/no calendar event/i);
    expect(serviceSource).not.toMatch(/calendarEventService/);
    expect(serviceSource).not.toMatch(/placeMeetingPlace\.create/);
  });

  it('searchPlaces filters via visibility searchListingsForUser', async () => {
    vi.spyOn(placeVisibilityService, 'searchListingsForUser').mockResolvedValue([]);

    const outcome = await placeAIActionService.searchPlaces('user-1', 'sushi');

    expect(outcome.success).toBe(true);
    expect(placeVisibilityService.searchListingsForUser).toHaveBeenCalledWith('user-1', 'sushi');
  });

  it('denied user context fails closed', async () => {
    vi.spyOn(placeVisibilityService, 'getForYouSuggestions').mockRejectedValue(
      new PlaceServiceError('Forbidden', 'forbidden', 403)
    );

    const outcome = await placeAIActionService.recommendPlaces('denied-user');

    expect(outcome.success).toBe(false);
    if (!outcome.success) {
      expect(outcome.error).toMatch(/Forbidden/i);
    }
  });
});
