import type { PlaceCategory, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { geolocationService } from '../geolocationService';
import type { SearchResult } from 'shared/types/search';
import { PlaceServiceError } from './placeErrors';
import { PLACE_GRAPH_INCLUDE } from './placeIncludes';
import {
  assertCanReadListingAdmin,
  assertCanReadMeeting,
  assertCanReadPlaceConnection,
  assertCanReadPublishedListingProfile,
  canReadPublishedListing,
  findListingAdminMember,
  PUBLISHED_LISTING_WHERE,
} from './placePermissionService';
import { assertPlacePolicyAllowed } from './placePolicyDual';
import * as placeService from './placeService';
import type { PlaceGraphSnapshot } from './placeTypes';

interface SuggestionItem {
  listing: Record<string, unknown>;
  reason: string;
  score: number;
}

const PLACE_CATEGORY_OPTIONS = [
  { value: 'RESTAURANT', label: 'Restaurants & Dining' },
  { value: 'RETAIL', label: 'Retail & Shopping' },
  { value: 'GROCERY', label: 'Grocery & Markets' },
  { value: 'DIGITAL_SERVICE', label: 'Digital Services' },
  { value: 'DELIVERY', label: 'Delivery Services' },
  { value: 'LOCAL_SERVICE', label: 'Local Services' },
  { value: 'HEALTH_WELLNESS', label: 'Health & Wellness' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' },
] as const;

function requireUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  return userId;
}

async function assertDiscoveryRead(userId: string): Promise<void> {
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_DISCOVERY_READ,
    resourceType: 'place',
    resourceId: userId,
  });
}

async function assertListingCatalogRead(userId: string, scope: 'explore' | 'search'): Promise<void> {
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_READ,
    resourceType: 'place_listing',
    resourceId: scope,
  });
}

async function assertListingRead(userId: string, businessId: string): Promise<void> {
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_READ,
    resourceType: 'place_listing',
    resourceId: businessId,
  });
}

async function assertMeetingRead(userId: string, meetingId: string): Promise<void> {
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_READ,
    resourceType: 'place_meeting',
    resourceId: meetingId,
  });
}

export async function exploreListings(
  userId: string,
  params: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const uid = requireUserId(userId);
  await assertListingCatalogRead(uid, 'explore');

  const take = Math.min(params.limit ?? 30, 100);
  const skip = params.offset ?? 0;

  const where: Prisma.BusinessPlaceListingWhereInput = {
    ...PUBLISHED_LISTING_WHERE,
  };

  if (params.category) {
    where.category = params.category as Prisma.BusinessPlaceListingWhereInput['category'];
  }

  if (params.search) {
    where.OR = [
      { displayName: { contains: params.search, mode: 'insensitive' } },
      { shortDescription: { contains: params.search, mode: 'insensitive' } },
      { tags: { has: params.search.toLowerCase() } },
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.businessPlaceListing.findMany({
      where,
      include: {
        business: {
          select: { id: true, name: true, logo: true, einVerified: true, industry: true },
        },
        interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.businessPlaceListing.count({ where }),
  ]);

  return { listings, pagination: { total, limit: take, offset: skip } };
}

export async function getBusinessProfile(userId: string, businessId: string) {
  const uid = requireUserId(userId);
  await assertCanReadPublishedListingProfile(uid, businessId);
  await assertListingRead(uid, businessId);

  const listing = await prisma.businessPlaceListing.findUnique({
    where: { businessId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          logo: true,
          einVerified: true,
          industry: true,
          website: true,
          description: true,
        },
      },
      interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!listing) {
    throw new PlaceServiceError('Business listing not found', 'listing_not_found', 404);
  }

  return listing;
}

export async function getListingForAdmin(userId: string, businessId: string) {
  const uid = requireUserId(userId);
  await assertCanReadListingAdmin(uid, businessId);
  await assertListingRead(uid, businessId);

  const listing = await prisma.businessPlaceListing.findUnique({
    where: { businessId },
    include: { interactionLinks: { orderBy: { sortOrder: 'asc' } } },
  });

  return listing;
}

export function getPlaceCategories() {
  return PLACE_CATEGORY_OPTIONS;
}

export async function getLocalSuggestions(userId: string, clientIp: string) {
  const uid = requireUserId(userId);
  await assertDiscoveryRead(uid);

  const location = await geolocationService.detectUserLocation(clientIp);

  const dismissed = await prisma.placeDismissedSuggestion.findMany({
    where: { userId: uid },
    select: { businessId: true },
  });
  const dismissedIds = dismissed.map((d) => d.businessId);

  const followedNodes = await prisma.placeNode.findMany({
    where: { place: { userId: uid }, nodeType: 'BUSINESS' },
    select: { entityId: true },
  });
  const followedIds = followedNodes.map((n) => n.entityId);
  const excludeIds = [...dismissedIds, ...followedIds];

  const listings = await prisma.businessPlaceListing.findMany({
    where: {
      ...PUBLISHED_LISTING_WHERE,
      business: {
        einVerified: true,
        id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
      },
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          logo: true,
          einVerified: true,
          industry: true,
          address: true,
        },
      },
      interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  const results: SuggestionItem[] = listings.map((listing) => ({
    listing: listing as unknown as Record<string, unknown>,
    reason: `Near ${location.city}, ${location.region}`,
    score: 0.7,
  }));

  return {
    results,
    location: { city: location.city, region: location.region, country: location.country },
  };
}

export async function getForYouSuggestions(userId: string) {
  const uid = requireUserId(userId);
  await assertDiscoveryRead(uid);

  const place = await prisma.place.findUnique({
    where: { userId: uid },
    include: { interests: true, nodes: { where: { nodeType: 'BUSINESS' } } },
  });

  const interestCategories = (place?.interests || []).map((i) => i.category.toUpperCase());
  const followedIds = (place?.nodes || []).map((n) => n.entityId);

  const dismissed = await prisma.placeDismissedSuggestion.findMany({
    where: { userId: uid },
    select: { businessId: true },
  });
  const dismissedIds = dismissed.map((d) => d.businessId);
  const excludeIds = [...followedIds, ...dismissedIds];

  const interestWhere: Prisma.BusinessPlaceListingWhereInput = {
    ...PUBLISHED_LISTING_WHERE,
    business: {
      einVerified: true,
      ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
    },
  };

  if (interestCategories.length > 0) {
    interestWhere.category = { in: interestCategories as PlaceCategory[] };
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

  const followedListings =
    followedIds.length > 0
      ? await prisma.businessPlaceListing.findMany({
          where: { businessId: { in: followedIds } },
          select: { category: true, tags: true },
        })
      : [];

  const followedCategories = [...new Set(followedListings.map((l) => l.category))];
  const followedTags = [...new Set(followedListings.flatMap((l) => l.tags))];

  let similarListings: typeof interestListings = [];
  if (followedCategories.length > 0) {
    const alreadyFoundIds = interestListings.map((l) => l.business.id);
    const allExclude = [...excludeIds, ...alreadyFoundIds];

    similarListings = await prisma.businessPlaceListing.findMany({
      where: {
        ...PUBLISHED_LISTING_WHERE,
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

  const results: SuggestionItem[] = [
    ...interestListings.map((l) => ({
      listing: l as unknown as Record<string, unknown>,
      reason: `Matches your interest in ${l.category.replace('_', ' ').toLowerCase()}`,
      score: 0.9,
    })),
    ...similarListings.map((l) => ({
      listing: l as unknown as Record<string, unknown>,
      reason: 'Similar to businesses you follow',
      score: 0.75,
    })),
  ];

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 15);
}

/** Place-owned connection picker — reads Member `relationship` rows for accepted connections. */
export async function getConnections(userId: string) {
  const uid = requireUserId(userId);
  await assertCanReadPlaceConnection(uid);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const relationships = await prisma.relationship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ senderId: uid }, { receiverId: uid }],
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  return relationships.map((r) => {
    const other = r.senderId === uid ? r.receiver : r.sender;
    return {
      id: other.id,
      name: other.name,
      email: other.email,
      relationshipId: r.id,
      type: r.type,
    };
  });
}

/** Place "add people" search — broader than Member search; Place-owned UX boundary. */
export async function searchUsersForPlace(userId: string, query: string) {
  const uid = requireUserId(userId);
  await assertCanReadPlaceConnection(uid);

  if (!query || query.length < 2) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        { id: { not: uid } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
  });

  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [
        { senderId: uid, receiverId: { in: users.map((u) => u.id) } },
        { receiverId: uid, senderId: { in: users.map((u) => u.id) } },
      ],
    },
  });

  const statusMap: Record<string, string> = {};
  for (const r of relationships) {
    const otherId = r.senderId === uid ? r.receiverId : r.senderId;
    statusMap[otherId] = r.status;
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    relationshipStatus: statusMap[u.id] || null,
  }));
}

export async function listMeetingsForUser(userId: string, status?: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_MEETING_READ,
    resourceType: 'place_meeting',
    resourceId: uid,
    metadata: { scope: 'list' },
  });

  const where: Prisma.PlaceMeetingPlaceWhereInput = {
    OR: [{ creatorId: uid }, { invites: { some: { inviteeId: uid } } }],
  };

  if (status) {
    where.status = status as Prisma.EnumMeetingPlaceStatusFilter;
  }

  return prisma.placeMeetingPlace.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true } },
      invites: {
        include: { invitee: { select: { id: true, name: true } } },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function getMeetingIfAccessible(userId: string, meetingId: string) {
  const uid = requireUserId(userId);
  const meeting = await assertCanReadMeeting(meetingId, uid);
  await assertMeetingRead(uid, meetingId);
  return meeting;
}

export async function getActivityFeed(
  userId: string,
  params: { limit?: number; offset?: number; type?: string }
) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const take = Math.min(params.limit ?? 30, 100);
  const skip = params.offset ?? 0;

  const connections = await prisma.relationship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ senderId: uid }, { receiverId: uid }],
    },
    select: { senderId: true, receiverId: true },
  });
  const connectionIds = connections.map((c) =>
    c.senderId === uid ? c.receiverId : c.senderId
  );

  const visibleUserIds = [uid, ...connectionIds];

  const [platformItems, legacyItems] = await Promise.all([
    fetchPlatformActivityFeedItems(visibleUserIds, uid, params.type),
    fetchLegacyActivityFeedItems(uid, connectionIds, params.type),
  ]);

  const merged = [...platformItems, ...legacyItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = merged.length;
  const items = merged.slice(skip, skip + take);

  return { items, pagination: { total, limit: take, offset: skip } };
}

type FeedItemShape = {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string | null;
  businessId: string | null;
  targetUserId: string | null;
  meetingId: string | null;
  isPrivate: boolean;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
};

interface ModuleActivityEnvelope {
  eventId?: string;
  timestamp?: string;
  actor?: { userId?: string };
  action?: string;
  target?: { type?: string; id?: string };
  metadata?: Record<string, unknown>;
}

function mapModuleActivityToFeedType(
  action: string,
  targetType: string,
  metadata: Record<string, unknown>
): string | null {
  if (action === 'create' && targetType === 'node') {
    if (metadata.nodeType === 'BUSINESS') return 'FOLLOWED_BUSINESS';
    if (metadata.nodeType === 'USER') return 'ADDED_CONNECTION';
  }
  if (action === 'delete' && targetType === 'node' && metadata.nodeType === 'BUSINESS') {
    return 'UNFOLLOWED_BUSINESS';
  }
  if (action === 'create' && targetType === 'meeting') return 'MEETING_CREATED';
  if (action === 'accept' && targetType === 'connection') return 'ADDED_CONNECTION';
  if (action === 'complete_setup' && targetType === 'place') return 'PLACE_SETUP_COMPLETE';
  if (action === 'update' && targetType === 'interests') return 'INTEREST_ADDED';
  if (action === 'rsvp' && metadata.rsvpStatus === 'ACCEPTED') return 'MEETING_CONFIRMED';
  return null;
}

function feedTitleForType(type: string): string {
  const titles: Record<string, string> = {
    FOLLOWED_BUSINESS: 'Followed a business',
    UNFOLLOWED_BUSINESS: 'Unfollowed a business',
    ADDED_CONNECTION: 'Added a connection',
    MEETING_CREATED: 'Created a meeting',
    MEETING_CONFIRMED: 'Confirmed a meeting',
    PLACE_SETUP_COMPLETE: 'Completed Place setup',
    INTEREST_ADDED: 'Updated interests',
  };
  return titles[type] ?? 'Place activity';
}

async function fetchPlatformActivityFeedItems(
  visibleUserIds: string[],
  viewerUserId: string,
  typeFilter?: string
): Promise<FeedItemShape[]> {
  const logs = await prisma.log.findMany({
    where: {
      operation: 'module_activity_event',
      module: 'place',
      userId: { in: visibleUserIds },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const actorIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
  const users = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, image: true },
      })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const items: FeedItemShape[] = [];

  for (const log of logs) {
    const actorUserId = log.userId ?? '';
    if (actorUserId !== viewerUserId && !visibleUserIds.includes(actorUserId)) {
      continue;
    }

    const envelope = log.metadata as ModuleActivityEnvelope | null;
    if (!envelope?.action || !envelope.target?.type) continue;

    const metadata = (envelope.metadata ?? {}) as Record<string, unknown>;
    const feedType = mapModuleActivityToFeedType(
      envelope.action,
      envelope.target.type,
      metadata
    );
    if (!feedType) continue;
    if (typeFilter && feedType !== typeFilter) continue;

    const actor = userMap[actorUserId] ?? { id: actorUserId, name: null, image: null };

    items.push({
      id: envelope.eventId ?? log.id,
      userId: actorUserId,
      type: feedType,
      title: feedTitleForType(feedType),
      description: null,
      businessId:
        envelope.target.type === 'node' && metadata.nodeType === 'BUSINESS'
          ? typeof metadata.entityId === 'string'
            ? metadata.entityId
            : null
          : typeof metadata.businessId === 'string'
            ? metadata.businessId
            : null,
      targetUserId:
        typeof metadata.targetUserId === 'string'
          ? metadata.targetUserId
          : typeof metadata.withUserId === 'string'
            ? metadata.withUserId
            : envelope.target.type === 'node' && metadata.nodeType === 'USER'
              ? typeof metadata.entityId === 'string'
                ? metadata.entityId
                : null
              : null,
      meetingId: envelope.target.type === 'meeting' ? (envelope.target.id ?? null) : null,
      isPrivate: actorUserId === viewerUserId,
      createdAt: log.createdAt,
      user: actor,
    });
  }

  return items;
}

async function fetchLegacyActivityFeedItems(
  userId: string,
  connectionIds: string[],
  typeFilter?: string
): Promise<FeedItemShape[]> {
  const where: Prisma.PlaceActivityFeedItemWhereInput = {
    OR: [{ userId }, { userId: { in: connectionIds }, isPrivate: false }],
  };

  if (typeFilter) {
    where.type = typeFilter as Prisma.EnumPlaceActivityTypeFilter;
  }

  const legacy = await prisma.placeActivityFeedItem.findMany({
    where,
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return legacy.map((item) => ({
    id: item.id,
    userId: item.userId,
    type: item.type,
    title: item.title,
    description: item.description,
    businessId: item.businessId,
    targetUserId: item.targetUserId,
    meetingId: item.meetingId,
    isPrivate: item.isPrivate,
    createdAt: item.createdAt,
    user: item.user,
  }));
}

export async function getPersonalAnalytics(userId: string, period?: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

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
      where: { userId: uid },
      include: { nodes: true, interests: true },
    }),
    prisma.placeTransaction.aggregate({
      where: { userId: uid, type: 'PURCHASE', status: 'COMPLETED', createdAt: { gte: periodStart } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.placeTransaction.count({
      where: { userId: uid, type: 'EXTERNAL_CLICK', createdAt: { gte: periodStart } },
    }),
    prisma.placeMeetingPlace.count({
      where: { creatorId: uid, createdAt: { gte: periodStart } },
    }),
    prisma.placeMeetingInvite.count({
      where: { inviteeId: uid, status: 'ACCEPTED', respondedAt: { gte: periodStart } },
    }),
    prisma.placeCommunityMember.count({ where: { userId: uid } }),
    prisma.placeTransaction.groupBy({
      by: ['businessId'],
      where: { userId: uid, createdAt: { gte: periodStart } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.placeActivityFeedItem.findMany({
      where: { userId: uid, createdAt: { gte: periodStart } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.placeNode.findMany({
      where: {
        place: { userId: uid },
        createdAt: { gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const topBizIds = topCategoryData.map((t) => t.businessId);
  const topBusinesses =
    topBizIds.length > 0
      ? await prisma.businessPlaceListing.findMany({
          where: { businessId: { in: topBizIds } },
          select: {
            businessId: true,
            category: true,
            displayName: true,
            business: { select: { name: true } },
          },
        })
      : [];
  const bizMap = Object.fromEntries(topBusinesses.map((b) => [b.businessId, b]));

  const weeklyGrowth = [0, 0, 0, 0];
  for (const node of networkGrowth) {
    const weeksAgo = Math.floor(
      (now.getTime() - node.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (weeksAgo >= 0 && weeksAgo < 4) {
      weeklyGrowth[3 - weeksAgo]++;
    }
  }

  const categoryCount: Record<string, number> = {};
  for (const td of topCategoryData) {
    const cat = bizMap[td.businessId]?.category || 'OTHER';
    categoryCount[cat] = (categoryCount[cat] || 0) + td._count.id;
  }

  const businessNodes = (place?.nodes || []).filter((n) => n.nodeType === 'BUSINESS');
  const userNodes = (place?.nodes || []).filter((n) => n.nodeType === 'USER');

  return {
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
    topBusinesses: topCategoryData.map((td) => ({
      businessId: td.businessId,
      name:
        bizMap[td.businessId]?.displayName ||
        bizMap[td.businessId]?.business?.name ||
        'Unknown',
      category: bizMap[td.businessId]?.category || 'OTHER',
      interactions: td._count.id,
    })),
    period: period || 'all',
  };
}

export async function exportUserData(userId: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const [place, transactions, meetings, invites, communities, feed, dismissed, locationPrivacy, followVisibility] =
    await Promise.all([
      prisma.place.findUnique({
        where: { userId: uid },
        include: { nodes: true, interests: true, settings: true },
      }),
      prisma.placeTransaction.findMany({
        where: { userId: uid },
        include: { business: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.placeMeetingPlace.findMany({
        where: { creatorId: uid },
        include: { invites: true },
      }),
      prisma.placeMeetingInvite.findMany({
        where: { inviteeId: uid },
        include: { meetingPlace: { select: { locationName: true, scheduledAt: true } } },
      }),
      prisma.placeCommunityMember.findMany({
        where: { userId: uid },
        include: { community: { select: { name: true, type: true } } },
      }),
      prisma.placeActivityFeedItem.findMany({
        where: { userId: uid },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.placeDismissedSuggestion.findMany({ where: { userId: uid } }),
      prisma.placeLocationPrivacy.findUnique({ where: { userId: uid } }),
      prisma.placeFollowVisibility.findMany({ where: { userId: uid } }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    userId: uid,
    place: place
      ? {
          name: place.name,
          isSetupComplete: place.isSetupComplete,
          nodes: place.nodes.map((n) => ({
            nodeType: n.nodeType,
            entityId: n.entityId,
            label: n.label,
            position: { x: n.positionX, y: n.positionY },
            color: n.color,
          })),
          interests: place.interests.map((i) => i.category),
          settings: place.settings,
        }
      : null,
    transactions: transactions.map((t) => ({
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
    meetings: meetings.map((m) => ({
      locationName: m.locationName,
      scheduledAt: m.scheduledAt,
      status: m.status,
      note: m.note,
      inviteCount: m.invites.length,
      createdAt: m.createdAt,
    })),
    meetingInvites: invites.map((i) => ({
      locationName: i.meetingPlace.locationName,
      scheduledAt: i.meetingPlace.scheduledAt,
      rsvpStatus: i.status,
    })),
    communities: communities.map((c) => ({
      name: c.community.name,
      type: c.community.type,
      role: c.role,
      joinedAt: c.joinedAt,
    })),
    activityCount: feed.length,
    dismissedSuggestions: dismissed.length,
    privacySettings: {
      location: locationPrivacy,
      followVisibility: followVisibility.map((fv) => ({
        businessId: fv.businessId,
        isVisible: fv.isVisible,
      })),
    },
  };
}

export async function getPlaceContextOverview(userId: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const place = await prisma.place.findUnique({
    where: { userId: uid },
    include: PLACE_GRAPH_INCLUDE,
  });

  if (!place) {
    return {
      context: {
        summary: { totalNodes: 0, isSetup: false, status: 'not-created' },
        details: {},
      },
      metadata: {
        provider: 'place',
        endpoint: 'overview',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const businessNodes = place.nodes.filter((n) => n.nodeType === 'BUSINESS');
  const userNodes = place.nodes.filter((n) => n.nodeType === 'USER');

  return {
    context: {
      summary: {
        totalNodes: place.nodes.length,
        businessCount: businessNodes.length,
        userConnectionCount: userNodes.length,
        isSetup: place.isSetupComplete,
        interests: place.interests.map((i) => i.category),
        status: place.isSetupComplete ? 'active' : 'setup-pending',
      },
      details: {
        layoutMode: place.settings?.layoutMode || 'FORCE',
        localSuggestions: place.settings?.showLocalSuggestions ?? true,
      },
    },
    metadata: {
      provider: 'place',
      endpoint: 'overview',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function getPlaceConnectionsContext(userId: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const place = await prisma.place.findUnique({
    where: { userId: uid },
    include: { nodes: true, interests: true },
  });

  if (!place) {
    return {
      context: { summary: { totalConnections: 0, status: 'not-created' }, details: {} },
      metadata: { provider: 'place', endpoint: 'connections', timestamp: new Date().toISOString() },
    };
  }

  const businessNodes = place.nodes.filter((n) => n.nodeType === 'BUSINESS');
  const userNodes = place.nodes.filter((n) => n.nodeType === 'USER');

  const businessDetails =
    businessNodes.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: businessNodes.map((n) => n.entityId) } },
          select: { id: true, name: true, industry: true },
        })
      : [];

  return {
    context: {
      summary: {
        totalConnections: place.nodes.length,
        businessesFollowed: businessNodes.length,
        userConnections: userNodes.length,
        interests: place.interests.map((i) => i.category),
      },
      details: {
        businesses: businessDetails.map((b) => ({ name: b.name, industry: b.industry })),
      },
    },
    metadata: { provider: 'place', endpoint: 'connections', timestamp: new Date().toISOString() },
  };
}

export async function getPlaceDiscoveriesContext(userId: string) {
  const uid = requireUserId(userId);
  await assertDiscoveryRead(uid);

  const totalListings = await prisma.businessPlaceListing.count({
    where: PUBLISHED_LISTING_WHERE,
  });

  const categoryBreakdown = await prisma.businessPlaceListing.groupBy({
    by: ['category'],
    where: PUBLISHED_LISTING_WHERE,
    _count: { id: true },
  });

  const trending = await prisma.placeNode.groupBy({
    by: ['entityId'],
    where: { nodeType: 'BUSINESS' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const trendingIds = trending.map((t) => t.entityId);
  const trendingBusinesses =
    trendingIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: trendingIds } },
          select: { id: true, name: true, industry: true },
        })
      : [];

  return {
    context: {
      summary: {
        totalAvailableBusinesses: totalListings,
        categories: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })),
      },
      details: {
        trending: trendingBusinesses.map((b) => ({ name: b.name, industry: b.industry })),
      },
    },
    metadata: { provider: 'place', endpoint: 'discoveries', timestamp: new Date().toISOString() },
  };
}

export async function getPlaceActivityContext(userId: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalTransactions, recentPurchases, recentClicks, topBusinesses] = await Promise.all([
    prisma.placeTransaction.count({ where: { userId: uid } }),
    prisma.placeTransaction.aggregate({
      where: {
        userId: uid,
        type: 'PURCHASE',
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.placeTransaction.count({
      where: { userId: uid, type: 'EXTERNAL_CLICK', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.placeTransaction.groupBy({
      by: ['businessId'],
      where: { userId: uid, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const topIds = topBusinesses.map((t) => t.businessId);
  const businesses =
    topIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: topIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameMap = Object.fromEntries(businesses.map((b) => [b.id, b.name]));

  const meetingCount = await prisma.placeMeetingPlace.count({
    where: {
      OR: [
        { creatorId: uid },
        { invites: { some: { inviteeId: uid, status: 'ACCEPTED' } } },
      ],
      status: { in: ['PROPOSED', 'CONFIRMED'] },
    },
  });

  return {
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
        topBusinesses: topBusinesses.map((t) => ({
          businessId: t.businessId,
          name: nameMap[t.businessId] || 'Unknown',
          interactions: t._count.id,
        })),
      },
    },
    metadata: { provider: 'place', endpoint: 'activity', timestamp: new Date().toISOString() },
  };
}

export async function getPlaceAnalyticsContext(userId: string) {
  const uid = requireUserId(userId);
  await assertPlacePolicyAllowed({
    userId: uid,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: uid,
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [place, purchases, clicks, communities, meetings] = await Promise.all([
    prisma.place.findUnique({
      where: { userId: uid },
      include: { nodes: true, interests: true },
    }),
    prisma.placeTransaction.aggregate({
      where: {
        userId: uid,
        type: 'PURCHASE',
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.placeTransaction.count({
      where: { userId: uid, type: 'EXTERNAL_CLICK', createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.placeCommunityMember.count({ where: { userId: uid } }),
    prisma.placeMeetingPlace.count({
      where: {
        OR: [{ creatorId: uid }, { invites: { some: { inviteeId: uid } } }],
        status: { in: ['PROPOSED', 'CONFIRMED'] },
      },
    }),
  ]);

  return {
    context: {
      summary: {
        totalNodes: (place?.nodes || []).length,
        businessesFollowed: (place?.nodes || []).filter((n) => n.nodeType === 'BUSINESS').length,
        userConnections: (place?.nodes || []).filter((n) => n.nodeType === 'USER').length,
        interests: (place?.interests || []).map((i) => i.category),
        recentPurchases: purchases._count.id,
        recentSpent: purchases._sum.amount || 0,
        externalClicks: clicks,
        communities,
        upcomingMeetings: meetings,
        engagementLevel:
          clicks + purchases._count.id > 10
            ? 'high'
            : clicks + purchases._count.id > 3
              ? 'moderate'
              : 'low',
      },
    },
    metadata: { provider: 'place', endpoint: 'analytics', timestamp: new Date().toISOString() },
  };
}

export async function searchListingsForUser(
  userId: string,
  query: string
): Promise<SearchResult[]> {
  const uid = requireUserId(userId);
  await assertListingCatalogRead(uid, 'search');

  if (!query || query.length < 2) {
    return [];
  }

  const listings = await prisma.businessPlaceListing.findMany({
    where: {
      ...PUBLISHED_LISTING_WHERE,
      OR: [
        { displayName: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
        { business: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: { business: { select: { id: true, name: true, industry: true } } },
    take: 10,
  });

  return listings.map((l) => ({
    id: l.id,
    title: l.displayName || l.business.name,
    description: l.shortDescription || l.business.industry || 'Business on Vssyl Place',
    moduleId: 'place',
    moduleName: 'Place',
    url: `/place?business=${l.business.id}`,
    type: 'business_listing',
    metadata: { businessId: l.business.id, category: l.category } as Record<string, unknown>,
    permissions: [{ type: 'read' as const, granted: true }],
    lastModified: l.updatedAt,
    relevanceScore: 0.8,
  }));
}

/**
 * Conservative Notebook PLACE_LISTING validation — published+EIN or business admin only.
 * Phase 2A will extend for V_Link; fail closed on unpublished listings.
 */
export async function validateAccessibleListingIds(
  userId: string,
  businessIds: string[]
): Promise<{ allowed: string[]; denied: string[] }> {
  const uid = requireUserId(userId);
  const uniqueIds = [...new Set(businessIds.filter((id) => typeof id === 'string' && id.length > 0))];
  const allowed: string[] = [];
  const denied: string[] = [];

  for (const businessId of uniqueIds) {
    if (await canReadPublishedListing(businessId)) {
      allowed.push(businessId);
      continue;
    }

    const member = await findListingAdminMember(uid, businessId);
    if (member) {
      const listing = await prisma.businessPlaceListing.findUnique({
        where: { businessId },
        select: { id: true },
      });
      if (listing) {
        allowed.push(businessId);
      } else {
        denied.push(businessId);
      }
    } else {
      denied.push(businessId);
    }
  }

  return { allowed, denied };
}

export type EnrichedPlaceNode = PlaceGraphSnapshot['nodes'][number] & {
  verified?: boolean;
  imageUrl?: string | null;
};

export type EnrichedPlaceGraph = PlaceGraphSnapshot & {
  nodes: EnrichedPlaceNode[];
};

/**
 * Returns the user's Place graph with business/household node enrichment (Wave 1G).
 * Base graph from placeService; cross-entity reads stay in visibility layer.
 */
export async function getEnrichedPlaceGraph(userId: string): Promise<EnrichedPlaceGraph> {
  const place = await placeService.getOrCreatePlace(userId);

  const businessNodeIds = place.nodes
    .filter((n) => n.nodeType === 'BUSINESS')
    .map((n) => n.entityId);

  let verifiedMap: Record<string, boolean> = {};
  let businessNameMap: Record<string, string> = {};
  let businessImageMap: Record<string, string | null> = {};

  if (businessNodeIds.length > 0) {
    const [businesses, listings] = await Promise.all([
      prisma.business.findMany({
        where: { id: { in: businessNodeIds } },
        select: { id: true, name: true, einVerified: true, logo: true },
      }),
      prisma.businessPlaceListing.findMany({
        where: { businessId: { in: businessNodeIds } },
        select: { businessId: true, coverImage: true, avatarImage: true },
      }),
    ]);
    verifiedMap = Object.fromEntries(businesses.map((b) => [b.id, b.einVerified]));
    businessNameMap = Object.fromEntries(businesses.map((b) => [b.id, b.name]));
    const logoByBiz = Object.fromEntries(businesses.map((b) => [b.id, b.logo]));
    const listingByBiz = Object.fromEntries(listings.map((l) => [l.businessId, l]));
    businessImageMap = Object.fromEntries(
      businessNodeIds.map((id) => {
        const listing = listingByBiz[id];
        const img = listing ? (listing.avatarImage ?? listing.coverImage) : null;
        return [id, img || logoByBiz[id] || null];
      })
    );
  }

  const householdNodeIds = place.nodes
    .filter((n) => n.nodeType === 'HOUSEHOLD')
    .map((n) => n.entityId);

  let householdNameMap: Record<string, string> = {};
  if (householdNodeIds.length > 0) {
    const households = await prisma.household.findMany({
      where: { id: { in: householdNodeIds } },
      select: { id: true, name: true },
    });
    householdNameMap = Object.fromEntries(households.map((h) => [h.id, h.name]));
  }

  const enrichedNodes: EnrichedPlaceNode[] = place.nodes.map((n) => {
    let label = n.label;
    if (!label && n.nodeType === 'BUSINESS') label = businessNameMap[n.entityId] || null;
    if (!label && n.nodeType === 'HOUSEHOLD') label = householdNameMap[n.entityId] || null;

    return {
      ...n,
      label: label || n.label,
      verified: n.nodeType === 'BUSINESS' ? (verifiedMap[n.entityId] ?? false) : undefined,
      imageUrl: n.nodeType === 'BUSINESS' ? (businessImageMap[n.entityId] ?? null) : undefined,
    };
  });

  return { ...place, nodes: enrichedNodes };
}
