import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { PlaceServiceError } from './placeErrors';

export const PUBLISHED_LISTING_WHERE: Prisma.BusinessPlaceListingWhereInput = {
  isEnabled: true,
  isPublished: true,
  business: { einVerified: true },
};

export async function findPlaceByUserId(userId: string) {
  return prisma.place.findUnique({
    where: { userId },
    select: { id: true, userId: true, isSetupComplete: true },
  });
}

export async function findPlaceNodeWithOwner(nodeId: string) {
  return prisma.placeNode.findUnique({
    where: { id: nodeId },
    include: { place: { select: { id: true, userId: true } } },
  });
}

export async function findListingAdminMember(userId: string, businessId: string) {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
  });
  if (!member || !member.isActive) {
    return null;
  }
  if (member.role !== 'ADMIN' && member.role !== 'MANAGER') {
    return null;
  }
  return member;
}

export async function assertOwnsPlace(userId: string) {
  const place = await findPlaceByUserId(userId);
  if (!place) {
    throw new PlaceServiceError('Place not found', 'place_not_found', 404);
  }
  if (place.userId !== userId) {
    throw new PlaceServiceError('Not authorized', 'forbidden', 403);
  }
  return place;
}

export async function assertCanReadOwnPlace(userId: string) {
  return assertCanReadPlace(userId);
}

export async function assertCanReadPlace(userId: string) {
  return assertOwnsPlace(userId);
}

export async function assertCanWritePlace(userId: string) {
  return assertOwnsPlace(userId);
}

export async function assertCanUpdatePlaceSettings(userId: string) {
  return assertCanWritePlace(userId);
}

export async function assertCanCompleteSetup(userId: string) {
  return assertCanWritePlace(userId);
}

export async function assertCanUpdateInterests(userId: string) {
  return assertCanWritePlace(userId);
}

export async function assertCanUpdateFollowVisibility(userId: string) {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
}

export async function assertCanReadFollowVisibility(userId: string) {
  return assertCanUpdateFollowVisibility(userId);
}

export async function assertCanCreateNode(userId: string) {
  const place = await findPlaceByUserId(userId);
  if (!place) {
    throw new PlaceServiceError(
      'Place not found. Create your place first.',
      'place_not_found',
      404
    );
  }
  if (place.userId !== userId) {
    throw new PlaceServiceError('Not authorized', 'forbidden', 403);
  }
  return place;
}

export async function assertCanUpdateNode(nodeId: string, userId: string) {
  const node = await findPlaceNodeWithOwner(nodeId);
  if (!node || node.place.userId !== userId) {
    throw new PlaceServiceError('Node not found', 'not_found', 404);
  }
  return node;
}

export async function assertCanDeleteNode(nodeId: string, userId: string) {
  return assertCanUpdateNode(nodeId, userId);
}

export async function canReadPublishedListing(businessId: string): Promise<boolean> {
  const listing = await prisma.businessPlaceListing.findFirst({
    where: { businessId, ...PUBLISHED_LISTING_WHERE },
    select: { id: true },
  });
  return Boolean(listing);
}

export async function canReadListing(userId: string, businessId: string): Promise<boolean> {
  if (await canReadPublishedListing(businessId)) {
    return true;
  }
  const member = await findListingAdminMember(userId, businessId);
  return Boolean(member);
}

export async function assertCanReadListing(userId: string, businessId: string): Promise<void> {
  if (await canReadListing(userId, businessId)) {
    return;
  }
  const listing = await prisma.businessPlaceListing.findUnique({
    where: { businessId },
    select: { id: true },
  });
  if (!listing) {
    throw new PlaceServiceError('Business listing not found', 'listing_not_found', 404);
  }
  throw new PlaceServiceError('Not authorized', 'forbidden', 403);
}

export async function assertCanReadPublishedListingProfile(
  userId: string,
  businessId: string
): Promise<void> {
  const listing = await prisma.businessPlaceListing.findUnique({
    where: { businessId },
    include: {
      business: { select: { einVerified: true } },
    },
  });

  if (!listing || !listing.isEnabled || !listing.isPublished) {
    throw new PlaceServiceError('Business listing not found', 'listing_not_found', 404);
  }

  if (!listing.business.einVerified) {
    throw new PlaceServiceError('Business not yet verified', 'forbidden', 403);
  }
}

export async function assertCanReadListingAdmin(userId: string, businessId: string) {
  const member = await findListingAdminMember(userId, businessId);
  if (!member) {
    throw new PlaceServiceError('Admin access required', 'forbidden', 403);
  }
  return member;
}

export async function assertCanReadMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    include: {
      creator: { select: { id: true, name: true } },
      invites: {
        include: { invitee: { select: { id: true, name: true } } },
      },
    },
  });

  if (!meeting) {
    throw new PlaceServiceError('Meeting not found', 'meeting_not_found', 404);
  }

  const isParticipant =
    meeting.creatorId === userId ||
    meeting.invites.some((invite) => invite.inviteeId === userId);

  if (!isParticipant) {
    throw new PlaceServiceError('Access denied', 'forbidden', 403);
  }

  return meeting;
}

export async function assertCanReadPlaceConnection(userId: string): Promise<void> {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
}

export async function assertCanWriteListingAdmin(userId: string, businessId: string) {
  return assertCanReadListingAdmin(userId, businessId);
}

export async function assertCanPublishListing(userId: string, businessId: string) {
  await assertCanWriteListingAdmin(userId, businessId);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { einVerified: true },
  });
  if (!business) {
    throw new PlaceServiceError('Business not found', 'not_found', 404);
  }
  if (!business.einVerified) {
    throw new PlaceServiceError('Business must be EIN verified to publish', 'forbidden', 403);
  }
}

export async function assertCanCreateMeeting(userId: string) {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
}

export async function assertCanUpdateMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    select: { id: true, creatorId: true },
  });
  if (!meeting) {
    throw new PlaceServiceError('Meeting not found', 'meeting_not_found', 404);
  }
  if (meeting.creatorId !== userId) {
    throw new PlaceServiceError('Only the creator can update this meeting', 'forbidden', 403);
  }
  return meeting;
}

export async function assertCanCancelMeeting(meetingId: string, userId: string) {
  return assertCanUpdateMeeting(meetingId, userId);
}

export async function assertCanRsvpMeeting(meetingId: string, userId: string) {
  const invite = await prisma.placeMeetingInvite.findUnique({
    where: { meetingPlaceId_inviteeId: { meetingPlaceId: meetingId, inviteeId: userId } },
  });
  if (!invite) {
    throw new PlaceServiceError('Invite not found', 'not_found', 404);
  }
  return invite;
}

export async function assertCanLinkMeetingToCalendar(meetingId: string, userId: string) {
  return assertCanReadMeeting(meetingId, userId);
}
