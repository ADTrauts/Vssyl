import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { PlaceServiceError } from './placeErrors';
import { assertCanReadListingAdmin } from './placePermissionService';
import { evaluatePlacePolicyDual } from './placePolicyDual';
import * as placeActivity from './placeActivityService';
import * as placeDomain from './placeDomainEventService';
import {
  unlinkPlaceListingFromAllVLinks,
  unlinkPlaceMeetingFromAllVLinks,
} from './placeVlinkLifecycleService';

export class PlaceTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'PlaceTrashError';
  }
}

export type PlaceTrashItemType = 'listing' | 'meeting';

export interface PlaceTrashMutationInput {
  userId: string;
  type: PlaceTrashItemType;
  id: string;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: PlaceTrashItemType;
  moduleId: 'place';
  moduleName: 'Place';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

function mapPlaceServiceError(error: unknown): never {
  if (error instanceof PlaceServiceError) {
    if (error.code === 'forbidden') {
      throw new PlaceTrashError('Forbidden', 'forbidden');
    }
    if (error.code === 'not_found' || error.code === 'listing_not_found') {
      throw new PlaceTrashError('Not found', 'not_found');
    }
  }
  throw error;
}

type ListingTrashPolicyAction =
  | typeof POLICY_ACTIONS.PLACE_LISTING_TRASH
  | typeof POLICY_ACTIONS.PLACE_LISTING_RESTORE
  | typeof POLICY_ACTIONS.PLACE_LISTING_PERMANENT_DELETE;

async function assertListingTrashPolicy(
  userId: string,
  businessId: string,
  action: ListingTrashPolicyAction
): Promise<void> {
  await assertCanReadListingAdmin(userId, businessId);
  const policy = await evaluatePlacePolicyDual({
    userId,
    action,
    resourceType: 'place_listing',
    resourceId: businessId,
  });
  if (policy.blocked) {
    throw new PlaceTrashError('Forbidden', 'forbidden');
  }
}

async function assertMeetingTrashPolicy(
  userId: string,
  meetingId: string,
  action:
    | typeof POLICY_ACTIONS.PLACE_MEETING_TRASH
    | typeof POLICY_ACTIONS.PLACE_MEETING_RESTORE
    | typeof POLICY_ACTIONS.PLACE_MEETING_PERMANENT_DELETE
): Promise<void> {
  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    select: { creatorId: true },
  });
  if (!meeting || meeting.creatorId !== userId) {
    throw new PlaceTrashError('Not found', 'not_found');
  }
  const policy = await evaluatePlacePolicyDual({
    userId,
    action,
    resourceType: 'place_meeting',
    resourceId: meetingId,
  });
  if (policy.blocked) {
    throw new PlaceTrashError('Forbidden', 'forbidden');
  }
}

export async function softTrashListing(params: { userId: string; listingId: string }) {
  const listing = await prisma.businessPlaceListing.findFirst({
    where: { id: params.listingId, trashedAt: null },
    include: { business: { select: { name: true } } },
  });
  if (!listing) {
    throw new PlaceTrashError('Listing not found or already trashed', 'not_found');
  }

  try {
    await assertListingTrashPolicy(
      params.userId,
      listing.businessId,
      POLICY_ACTIONS.PLACE_LISTING_TRASH
    );
  } catch (error: unknown) {
    mapPlaceServiceError(error);
  }

  const updated = await prisma.businessPlaceListing.updateMany({
    where: { id: params.listingId, trashedAt: null },
    data: { trashedAt: new Date() },
  });
  if (updated.count === 0) {
    throw new PlaceTrashError('Listing not found or already trashed', 'not_found');
  }

  await placeActivity.recordListingTrashed({
    actorUserId: params.userId,
    listingId: listing.id,
    businessId: listing.businessId,
  });
  placeDomain.recordListingTrashedDomainEvent({
    actorUserId: params.userId,
    listingId: listing.id,
    businessId: listing.businessId,
  });

  return { success: true as const };
}

export async function restoreListing(params: { userId: string; listingId: string }): Promise<boolean> {
  const listing = await prisma.businessPlaceListing.findFirst({
    where: { id: params.listingId, trashedAt: { not: null } },
  });
  if (!listing) {
    return false;
  }

  try {
    await assertListingTrashPolicy(
      params.userId,
      listing.businessId,
      POLICY_ACTIONS.PLACE_LISTING_RESTORE
    );
  } catch (error: unknown) {
    mapPlaceServiceError(error);
  }

  const updated = await prisma.businessPlaceListing.updateMany({
    where: { id: params.listingId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });
  if (updated.count === 0) {
    return false;
  }

  await placeActivity.recordListingRestored({
    actorUserId: params.userId,
    listingId: listing.id,
    businessId: listing.businessId,
  });
  placeDomain.recordListingRestoredDomainEvent({
    actorUserId: params.userId,
    listingId: listing.id,
    businessId: listing.businessId,
  });

  return true;
}

export async function permanentlyDeleteListing(params: {
  userId: string;
  listingId: string;
}): Promise<boolean> {
  const listing = await prisma.businessPlaceListing.findFirst({
    where: { id: params.listingId, trashedAt: { not: null } },
  });
  if (!listing) {
    return false;
  }

  try {
    await assertListingTrashPolicy(
      params.userId,
      listing.businessId,
      POLICY_ACTIONS.PLACE_LISTING_PERMANENT_DELETE
    );
  } catch (error: unknown) {
    mapPlaceServiceError(error);
  }

  await unlinkPlaceListingFromAllVLinks({
    actorUserId: params.userId,
    listingId: listing.id,
  });

  const deleted = await prisma.businessPlaceListing.deleteMany({
    where: { id: params.listingId, trashedAt: { not: null } },
  });
  if (deleted.count === 0) {
    return false;
  }

  await placeActivity.recordListingPermanentlyDeleted({
    actorUserId: params.userId,
    listingId: listing.id,
    businessId: listing.businessId,
  });
  placeDomain.recordListingPermanentlyDeletedDomainEvent({
    actorUserId: params.userId,
    listingId: listing.id,
    businessId: listing.businessId,
  });

  return true;
}

export async function softTrashMeeting(params: { userId: string; meetingId: string }) {
  const meeting = await prisma.placeMeetingPlace.findFirst({
    where: { id: params.meetingId, trashedAt: null },
  });
  if (!meeting) {
    throw new PlaceTrashError('Meeting not found or already trashed', 'not_found');
  }

  await assertMeetingTrashPolicy(
    params.userId,
    params.meetingId,
    POLICY_ACTIONS.PLACE_MEETING_TRASH
  );

  const updated = await prisma.placeMeetingPlace.updateMany({
    where: { id: params.meetingId, trashedAt: null },
    data: { trashedAt: new Date() },
  });
  if (updated.count === 0) {
    throw new PlaceTrashError('Meeting not found or already trashed', 'not_found');
  }

  await placeActivity.recordMeetingTrashed({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });
  placeDomain.recordMeetingTrashedDomainEvent({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });

  return { success: true as const };
}

export async function restoreMeeting(params: { userId: string; meetingId: string }): Promise<boolean> {
  const meeting = await prisma.placeMeetingPlace.findFirst({
    where: { id: params.meetingId, trashedAt: { not: null } },
  });
  if (!meeting) {
    return false;
  }

  await assertMeetingTrashPolicy(
    params.userId,
    params.meetingId,
    POLICY_ACTIONS.PLACE_MEETING_RESTORE
  );

  const updated = await prisma.placeMeetingPlace.updateMany({
    where: { id: params.meetingId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });
  if (updated.count === 0) {
    return false;
  }

  await placeActivity.recordMeetingRestored({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });
  placeDomain.recordMeetingRestoredDomainEvent({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });

  return true;
}

export async function permanentlyDeleteMeeting(params: {
  userId: string;
  meetingId: string;
}): Promise<boolean> {
  const meeting = await prisma.placeMeetingPlace.findFirst({
    where: { id: params.meetingId, trashedAt: { not: null } },
  });
  if (!meeting) {
    return false;
  }

  await assertMeetingTrashPolicy(
    params.userId,
    params.meetingId,
    POLICY_ACTIONS.PLACE_MEETING_PERMANENT_DELETE
  );

  await unlinkPlaceMeetingFromAllVLinks({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });

  const deleted = await prisma.placeMeetingPlace.deleteMany({
    where: { id: params.meetingId, trashedAt: { not: null } },
  });
  if (deleted.count === 0) {
    return false;
  }

  await placeActivity.recordMeetingPermanentlyDeleted({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });
  placeDomain.recordMeetingPermanentlyDeletedDomainEvent({
    actorUserId: params.userId,
    meetingId: params.meetingId,
  });

  return true;
}

export async function softTrashPlaceItem(input: PlaceTrashMutationInput): Promise<void> {
  if (input.type === 'listing') {
    await softTrashListing({ userId: input.userId, listingId: input.id });
    return;
  }
  if (input.type === 'meeting') {
    await softTrashMeeting({ userId: input.userId, meetingId: input.id });
    return;
  }
  throw new PlaceTrashError(`Unsupported place trash type: ${input.type}`, 'invalid');
}

export async function restorePlaceItem(input: PlaceTrashMutationInput): Promise<boolean> {
  if (input.type === 'listing') {
    return restoreListing({ userId: input.userId, listingId: input.id });
  }
  if (input.type === 'meeting') {
    return restoreMeeting({ userId: input.userId, meetingId: input.id });
  }
  return false;
}

export async function permanentlyDeletePlaceItem(input: PlaceTrashMutationInput): Promise<boolean> {
  if (input.type === 'listing') {
    return permanentlyDeleteListing({ userId: input.userId, listingId: input.id });
  }
  if (input.type === 'meeting') {
    return permanentlyDeleteMeeting({ userId: input.userId, meetingId: input.id });
  }
  return false;
}

export async function listTrashedPlaceItems(userId: string): Promise<GlobalTrashListItem[]> {
  const adminMemberships = await prisma.businessMember.findMany({
    where: {
      userId,
      isActive: true,
      role: { in: ['ADMIN', 'MANAGER'] },
    },
    select: { businessId: true },
  });
  const businessIds = adminMemberships.map((m) => m.businessId);

  const [listings, meetings] = await Promise.all([
    businessIds.length > 0
      ? prisma.businessPlaceListing.findMany({
          where: { businessId: { in: businessIds }, trashedAt: { not: null } },
          include: { business: { select: { name: true } } },
          orderBy: { trashedAt: 'desc' },
        })
      : [],
    prisma.placeMeetingPlace.findMany({
      where: { creatorId: userId, trashedAt: { not: null } },
      orderBy: { trashedAt: 'desc' },
    }),
  ]);

  const listingItems: GlobalTrashListItem[] = listings.map((l) => ({
    id: l.id,
    name: l.displayName || l.business.name,
    type: 'listing',
    moduleId: 'place',
    moduleName: 'Place',
    trashedAt: l.trashedAt,
    metadata: { businessId: l.businessId, listingId: l.id },
  }));

  const meetingItems: GlobalTrashListItem[] = meetings.map((m) => ({
    id: m.id,
    name: m.locationName,
    type: 'meeting',
    moduleId: 'place',
    moduleName: 'Place',
    trashedAt: m.trashedAt,
    metadata: { meetingId: m.id },
  }));

  return [...listingItems, ...meetingItems].sort(
    (a, b) => new Date(b.trashedAt!).getTime() - new Date(a.trashedAt!).getTime()
  );
}

export async function emptyPlaceTrash(input: { userId: string }): Promise<number> {
  const items = await listTrashedPlaceItems(input.userId);
  let deletedCount = 0;
  for (const item of items) {
    const deleted = await permanentlyDeletePlaceItem({
      userId: input.userId,
      type: item.type,
      id: item.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }
  return deletedCount;
}

/** Alias for Global Trash registry */
export const listTrashedPlaceItemsForGlobalTrash = listTrashedPlaceItems;
