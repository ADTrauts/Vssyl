import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { evaluatePlacePolicyDual } from './placePolicyDual';
import {
  assertCanReadListingAdmin,
  canReadPublishedListing,
  findListingAdminMember,
  PUBLISHED_LISTING_WHERE,
} from './placePermissionService';
import { resolveCalendarEventForVLink } from '../calendarVlinkAccessService';

export type PlaceVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface PlaceVlinkAccessResult {
  allowed: boolean;
  state: PlaceVlinkEntityState;
  title?: string;
  url?: string;
}

async function passesListingReadPolicy(userId: string, businessId: string): Promise<boolean> {
  const policy = await evaluatePlacePolicyDual({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_READ,
    resourceType: 'place_listing',
    resourceId: businessId,
  });
  return !policy.blocked;
}

/**
 * V_Link access for Place listings (Wave 2A).
 * Published+EIN+not trashed OR business admin; Policy Engine must pass.
 */
export async function resolvePlaceListingForVLink(
  userId: string,
  listingId: string
): Promise<PlaceVlinkAccessResult> {
  const listing = await prisma.businessPlaceListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      businessId: true,
      displayName: true,
      trashedAt: true,
      isEnabled: true,
      isPublished: true,
      business: { select: { name: true, einVerified: true } },
    },
  });

  if (!listing) {
    return { allowed: false, state: 'deleted' };
  }

  if (listing.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: listing.displayName || listing.business.name,
    };
  }

  const isPublic =
    listing.isEnabled &&
    listing.isPublished &&
    listing.business.einVerified;

  if (!isPublic) {
    const member = await findListingAdminMember(userId, listing.businessId);
    if (!member) {
      return {
        allowed: false,
        state: 'active',
        title: listing.displayName || listing.business.name,
      };
    }
  }

  try {
    if (!(await passesListingReadPolicy(userId, listing.businessId))) {
      return {
        allowed: false,
        state: 'active',
        title: listing.displayName || listing.business.name,
      };
    }
  } catch {
    return {
      allowed: false,
      state: 'active',
      title: listing.displayName || listing.business.name,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: listing.displayName || listing.business.name,
    url: `/place?business=${listing.businessId}`,
  };
}

async function userCanReadMeeting(userId: string, meetingId: string): Promise<boolean> {
  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    select: {
      creatorId: true,
      status: true,
      eventId: true,
      invites: { select: { inviteeId: true, status: true } },
    },
  });
  if (!meeting) return false;
  if (meeting.creatorId === userId) return true;
  if (meeting.invites.some((i) => i.inviteeId === userId && i.status === 'ACCEPTED')) {
    return true;
  }
  if (meeting.eventId) {
    const eventAccess = await resolveCalendarEventForVLink(userId, meeting.eventId);
    if (eventAccess.allowed) return true;
  }
  return false;
}

export async function resolvePlaceMeetingForVLink(
  userId: string,
  meetingId: string
): Promise<PlaceVlinkAccessResult> {
  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      locationName: true,
      trashedAt: true,
      status: true,
      creatorId: true,
    },
  });

  if (!meeting) {
    return { allowed: false, state: 'deleted' };
  }

  if (meeting.trashedAt) {
    return { allowed: false, state: 'trashed', title: meeting.locationName };
  }

  if (meeting.status === 'CANCELLED') {
    return { allowed: false, state: 'active', title: meeting.locationName };
  }

  if (!(await userCanReadMeeting(userId, meetingId))) {
    return { allowed: false, state: 'active', title: meeting.locationName };
  }

  const policy = await evaluatePlacePolicyDual({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_READ,
    resourceType: 'place_meeting',
    resourceId: meetingId,
  });
  if (policy.blocked) {
    return { allowed: false, state: 'active', title: meeting.locationName };
  }

  return {
    allowed: true,
    state: 'active',
    title: meeting.locationName,
    url: `/place?tab=meetings&meeting=${meeting.id}`,
  };
}

export async function userCanLinkPlaceListing(userId: string, listingId: string): Promise<boolean> {
  const result = await resolvePlaceListingForVLink(userId, listingId);
  return result.allowed;
}

export async function userCanLinkPlaceMeeting(userId: string, meetingId: string): Promise<boolean> {
  const result = await resolvePlaceMeetingForVLink(userId, meetingId);
  return result.allowed;
}

/** Notebook PLACE_LISTING validation — resolves listing id or businessId target. */
export async function assertNotebookListingTargetReadable(
  userId: string,
  targetId: string
): Promise<{ listingId: string; businessId: string; title: string }> {
  let listing = await prisma.businessPlaceListing.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      businessId: true,
      displayName: true,
      trashedAt: true,
      business: { select: { name: true } },
    },
  });

  if (!listing) {
    listing = await prisma.businessPlaceListing.findUnique({
      where: { businessId: targetId },
      select: {
        id: true,
        businessId: true,
        displayName: true,
        trashedAt: true,
        business: { select: { name: true } },
      },
    });
  }

  if (!listing || listing.trashedAt) {
    throw new Error('Listing not found');
  }

  const { validateAccessibleListingIds } = await import('./placeVisibilityService.js');
  const { allowed, denied } = await validateAccessibleListingIds(userId, [listing.businessId]);
  if (denied.includes(listing.businessId) || !allowed.includes(listing.businessId)) {
    throw new Error('Listing not accessible');
  }

  return {
    listingId: listing.id,
    businessId: listing.businessId,
    title: listing.displayName || listing.business.name,
  };
}

export { PUBLISHED_LISTING_WHERE, canReadPublishedListing, assertCanReadListingAdmin };
