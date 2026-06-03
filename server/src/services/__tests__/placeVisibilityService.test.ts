import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placePolicyDual from '../place/placePolicyDual';
import {
  exploreListings,
  getBusinessProfile,
  getEnrichedPlaceGraph,
  getForYouSuggestions,
  getListingForAdmin,
  getMeetingIfAccessible,
  getPersonalAnalytics,
  getActivityFeed,
  listMeetingsForUser,
  searchListingsForUser,
  validateAccessibleListingIds,
} from '../place/placeVisibilityService';
import { PlaceServiceError } from '../place/placeErrors';
import * as placePermission from '../place/placePermissionService';
import * as placeService from '../place/placeService';

describe('placeVisibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
  });

  it('explore returns published/EIN verified only', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findMany').mockResolvedValue([
      { id: 'l1', businessId: 'biz-1' },
    ] as never);
    vi.spyOn(prisma.businessPlaceListing, 'count').mockResolvedValue(1 as never);

    await exploreListings('u1', {});

    expect(prisma.businessPlaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isEnabled: true,
          isPublished: true,
          business: { einVerified: true },
        }),
      })
    );
  });

  it('getBusinessProfile does not include follower count', async () => {
    vi.spyOn(placePermission, 'assertCanReadPublishedListingProfile').mockResolvedValue(undefined);
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'l1',
      businessId: 'biz-1',
      business: { einVerified: true },
      interactionLinks: [],
    } as never);

    const profile = await getBusinessProfile('u1', 'biz-1');
    expect(profile).not.toHaveProperty('followerCount');
  });

  it('admin can read own unpublished listing', async () => {
    vi.spyOn(placePermission, 'assertCanReadListingAdmin').mockResolvedValue({} as never);
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'l1',
      isPublished: false,
    } as never);

    const listing = await getListingForAdmin('u1', 'biz-1');
    expect(listing?.isPublished).toBe(false);
  });

  it('getForYouSuggestions excludes dismissed business ids', async () => {
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValue({
      interests: [],
      nodes: [],
    } as never);
    vi.spyOn(prisma.placeDismissedSuggestion, 'findMany').mockResolvedValue([
      { businessId: 'dismissed-1' },
    ] as never);
    vi.spyOn(prisma.businessPlaceListing, 'findMany').mockResolvedValue([] as never);

    await getForYouSuggestions('u1');

    expect(prisma.businessPlaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          business: expect.objectContaining({
            id: { notIn: ['dismissed-1'] },
          }),
        }),
      })
    );
  });

  it('listMeetings scopes to creator or invitee', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findMany').mockResolvedValue([] as never);

    await listMeetingsForUser('u1');

    expect(prisma.placeMeetingPlace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ creatorId: 'u1' }, { invites: { some: { inviteeId: 'u1' } } }],
        }),
      })
    );
  });

  it('denies inaccessible meeting', async () => {
    vi.spyOn(placePermission, 'assertCanReadMeeting').mockRejectedValue(
      new PlaceServiceError('Access denied', 'forbidden', 403)
    );

    await expect(getMeetingIfAccessible('u1', 'm1')).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('getPersonalAnalytics is user-scoped', async () => {
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValue({ nodes: [], interests: [] } as never);
    vi.spyOn(prisma.placeTransaction, 'aggregate').mockResolvedValue({
      _sum: { amount: 0 },
      _count: { id: 0 },
    } as never);
    vi.spyOn(prisma.placeTransaction, 'count').mockResolvedValue(0 as never);
    vi.spyOn(prisma.placeMeetingPlace, 'count').mockResolvedValue(0 as never);
    vi.spyOn(prisma.placeMeetingInvite, 'count').mockResolvedValue(0 as never);
    vi.spyOn(prisma.placeCommunityMember, 'count').mockResolvedValue(0 as never);
    vi.spyOn(prisma.placeTransaction, 'groupBy').mockResolvedValue([] as never);
    vi.spyOn(prisma.log, 'count').mockResolvedValue(0 as never);
    vi.spyOn(prisma.placeNode, 'findMany').mockResolvedValue([] as never);

    await getPersonalAnalytics('u1');

    expect(prisma.place.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    );
  });

  it('validateAccessibleListingIds allows published listing', async () => {
    vi.spyOn(placePermission, 'canReadPublishedListing').mockResolvedValue(true);

    const result = await validateAccessibleListingIds('u1', ['biz-1']);
    expect(result.allowed).toEqual(['biz-1']);
    expect(result.denied).toEqual([]);
  });

  it('validateAccessibleListingIds denies unpublished listing for non-admin', async () => {
    vi.spyOn(placePermission, 'canReadPublishedListing').mockResolvedValue(false);
    vi.spyOn(placePermission, 'findListingAdminMember').mockResolvedValue(null);

    const result = await validateAccessibleListingIds('u1', ['biz-2']);
    expect(result.denied).toEqual(['biz-2']);
  });

  it('searchListingsForUser filters with published listing where clause', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findMany').mockResolvedValue([] as never);

    await searchListingsForUser('u1', 'coffee');

    expect(prisma.businessPlaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isEnabled: true,
          isPublished: true,
          business: { einVerified: true },
        }),
      })
    );
  });

  it('getActivityFeed reads platform module activity only', async () => {
    vi.spyOn(prisma.relationship, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.log, 'findMany').mockResolvedValue([
      {
        id: 'log-1',
        userId: 'u1',
        createdAt: new Date('2026-06-01T12:00:00Z'),
        metadata: {
          eventId: 'evt-1',
          action: 'create',
          target: { type: 'node', id: 'node-1' },
          metadata: { nodeType: 'BUSINESS', entityId: 'biz-1' },
        },
      },
    ] as never);
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
      { id: 'u1', name: 'Alice', image: null },
    ] as never);

    const result = await getActivityFeed('u1', { limit: 10 });

    expect(prisma.log.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ operation: 'module_activity_event', module: 'place' }),
      })
    );
    expect(result.items[0]?.type).toBe('FOLLOWED_BUSINESS');
  });

  it('getEnrichedPlaceGraph preserves enriched node fields', async () => {
    vi.spyOn(placeService, 'getOrCreatePlace').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      nodes: [
        {
          id: 'node-1',
          nodeType: 'BUSINESS',
          entityId: 'biz-1',
          label: null,
        },
      ],
      settings: null,
      interests: [],
    } as never);
    vi.spyOn(prisma.business, 'findMany').mockResolvedValue([
      { id: 'biz-1', name: 'Cafe', einVerified: true, logo: 'logo.png' },
    ] as never);
    vi.spyOn(prisma.businessPlaceListing, 'findMany').mockResolvedValue([
      { businessId: 'biz-1', coverImage: 'cover.png', avatarImage: null },
    ] as never);

    const graph = await getEnrichedPlaceGraph('u1');

    expect(graph.nodes[0]?.label).toBe('Cafe');
    expect(graph.nodes[0]?.verified).toBe(true);
    expect(graph.nodes[0]?.imageUrl).toBe('cover.png');
  });
});
