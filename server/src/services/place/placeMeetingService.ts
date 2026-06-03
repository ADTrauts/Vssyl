import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { CalendarServiceError } from '../calendar/calendarErrors';
import { createEvent } from '../calendarEventService';
import { userCanLinkCalendarEvent } from '../calendarVlinkAccessService';
import { PlaceServiceError } from './placeErrors';
import {
  assertCanCancelMeeting,
  assertCanCreateMeeting,
  assertCanLinkMeetingToCalendar,
  assertCanRsvpMeeting,
  assertCanUpdateMeeting,
} from './placePermissionService';
import { assertPlacePolicyAllowed } from './placePolicyDual';
import * as placeActivity from './placeActivityService';
import * as placeDomain from './placeDomainEventService';
import * as placeNotification from './placeNotificationService';
import * as placeRealtime from './placeRealtimeService';

const MEETING_INCLUDE = {
  invites: { include: { invitee: { select: { id: true, name: true, email: true } } } },
  creator: { select: { id: true, name: true } },
} as const;

function mapCalendarError(error: unknown): never {
  if (error instanceof CalendarServiceError) {
    const code =
      error.code === 'not_found'
        ? 'not_found'
        : error.code === 'forbidden'
          ? 'forbidden'
          : 'invalid';
    throw new PlaceServiceError(error.message, code, error.status);
  }
  throw error;
}

function meetingParticipantIds(meeting: {
  creatorId: string;
  invites: Array<{ inviteeId: string }>;
}): string[] {
  return [...new Set([meeting.creatorId, ...meeting.invites.map((i) => i.inviteeId)])];
}

export async function createMeeting(params: {
  userId: string;
  businessId?: string | null;
  locationName: string;
  locationAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  scheduledAt?: string | Date | null;
  duration?: number | null;
  note?: string | null;
  isPrivate?: boolean;
  inviteeIds?: string[];
}) {
  const { userId } = params;
  await assertCanCreateMeeting(userId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_CREATE,
    resourceType: 'place_meeting',
    resourceId: userId,
  });

  const meeting = await prisma.placeMeetingPlace.create({
    data: {
      creatorId: userId,
      businessId: params.businessId || null,
      locationName: params.locationName,
      locationAddress: params.locationAddress || null,
      latitude: params.latitude ?? null,
      longitude: params.longitude ?? null,
      scheduledAt: params.scheduledAt ? new Date(params.scheduledAt) : null,
      duration: params.duration ?? null,
      note: params.note || null,
      isPrivate: params.isPrivate ?? true,
    },
    include: MEETING_INCLUDE,
  });

  const inviteeIds = Array.isArray(params.inviteeIds) ? params.inviteeIds : [];
  const inviteData = inviteeIds
    .filter((id) => id !== userId)
    .map((inviteeId) => ({
      meetingPlaceId: meeting.id,
      inviteeId,
    }));

  if (inviteData.length > 0) {
    await prisma.placeMeetingInvite.createMany({ data: inviteData });

    for (const invite of inviteData) {
      placeRealtime.broadcastMeetingInvite(invite.inviteeId, {
        meetingId: meeting.id,
        locationName: params.locationName,
        creatorId: userId,
      });
      await placeNotification.notifyMeetingInvite({
        actorUserId: userId,
        inviteeId: invite.inviteeId,
        meetingId: meeting.id,
        locationName: params.locationName,
      });
    }
  }

  const full = await prisma.placeMeetingPlace.findUnique({
    where: { id: meeting.id },
    include: MEETING_INCLUDE,
  });

  await placeActivity.recordMeetingCreated({
    actorUserId: userId,
    meetingId: meeting.id,
    locationName: params.locationName,
  });
  placeDomain.recordMeetingCreatedDomainEvent({
    actorUserId: userId,
    meetingId: meeting.id,
    locationName: params.locationName,
  });

  if (full) {
    placeRealtime.broadcastMeetingCreated(meetingParticipantIds(full), {
      meetingId: full.id,
      locationName: full.locationName,
      creatorId: full.creatorId,
    });
  }

  return full ?? meeting;
}

export async function updateMeeting(params: {
  userId: string;
  meetingId: string;
  locationName?: string;
  locationAddress?: string | null;
  scheduledAt?: string | Date | null;
  duration?: number | null;
  note?: string | null;
  status?: string;
  isPrivate?: boolean;
}) {
  const { userId, meetingId } = params;
  await assertCanUpdateMeeting(meetingId, userId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_UPDATE,
    resourceType: 'place_meeting',
    resourceId: meetingId,
  });

  const data: Record<string, unknown> = {};
  if (params.locationName !== undefined) data.locationName = params.locationName;
  if (params.locationAddress !== undefined) data.locationAddress = params.locationAddress;
  if (params.scheduledAt !== undefined) {
    data.scheduledAt = params.scheduledAt ? new Date(params.scheduledAt) : null;
  }
  if (params.duration !== undefined) data.duration = params.duration;
  if (params.note !== undefined) data.note = params.note;
  if (params.status !== undefined) data.status = params.status;
  if (params.isPrivate !== undefined) data.isPrivate = params.isPrivate;

  const updated = await prisma.placeMeetingPlace.update({
    where: { id: meetingId },
    data,
    include: MEETING_INCLUDE,
  });

  await placeActivity.recordMeetingUpdated({
    actorUserId: userId,
    meetingId,
    status: params.status,
  });
  placeDomain.recordMeetingUpdatedDomainEvent({
    actorUserId: userId,
    meetingId,
    status: params.status,
  });

  placeRealtime.broadcastMeetingUpdated(meetingParticipantIds(updated), {
    meetingId: updated.id,
    status: updated.status,
  });

  return updated;
}

export async function cancelMeeting(params: { userId: string; meetingId: string }) {
  const { userId, meetingId } = params;
  await assertCanCancelMeeting(meetingId, userId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_CANCEL,
    resourceType: 'place_meeting',
    resourceId: meetingId,
  });

  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    include: { invites: { select: { inviteeId: true } } },
  });
  if (!meeting) {
    throw new PlaceServiceError('Meeting not found', 'meeting_not_found', 404);
  }

  await prisma.placeMeetingPlace.update({
    where: { id: meetingId },
    data: { status: 'CANCELLED' },
  });

  await placeActivity.recordMeetingCancelled({
    actorUserId: userId,
    meetingId,
  });
  placeDomain.recordMeetingCancelledDomainEvent({
    actorUserId: userId,
    meetingId,
  });

  placeRealtime.broadcastMeetingCancelled(meetingParticipantIds(meeting), { meetingId });

  return { meetingId, status: 'CANCELLED' as const };
}

export async function rsvpMeeting(params: {
  userId: string;
  meetingId: string;
  status: 'ACCEPTED' | 'DECLINED';
}) {
  const { userId, meetingId, status } = params;

  if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
    throw new PlaceServiceError('status must be ACCEPTED or DECLINED', 'invalid', 400);
  }

  await assertCanRsvpMeeting(meetingId, userId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_RSVP,
    resourceType: 'place_meeting',
    resourceId: meetingId,
  });

  const invite = await prisma.placeMeetingInvite.findUnique({
    where: { meetingPlaceId_inviteeId: { meetingPlaceId: meetingId, inviteeId: userId } },
  });
  if (!invite) {
    throw new PlaceServiceError('Invite not found', 'not_found', 404);
  }

  const updated = await prisma.placeMeetingInvite.update({
    where: { id: invite.id },
    data: { status, respondedAt: new Date() },
  });

  const allInvites = await prisma.placeMeetingInvite.findMany({
    where: { meetingPlaceId: meetingId },
  });
  const allResponded = allInvites.every((i) => i.status !== 'PENDING');
  const anyAccepted = allInvites.some((i) => i.status === 'ACCEPTED');

  if (allResponded && anyAccepted) {
    await prisma.placeMeetingPlace.update({
      where: { id: meetingId },
      data: { status: 'CONFIRMED' },
    });
  }

  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    include: { invites: { select: { inviteeId: true } } },
  });

  if (meeting) {
    placeRealtime.broadcastMeetingRsvp(meeting.creatorId, {
      meetingId,
      inviteeId: userId,
      rsvpStatus: status,
    });
    await placeNotification.notifyMeetingRsvp({
      actorUserId: userId,
      creatorId: meeting.creatorId,
      meetingId,
      rsvpStatus: status,
    });
    placeRealtime.broadcastMeetingUpdated(meetingParticipantIds(meeting), {
      meetingId,
      status: allResponded && anyAccepted ? 'CONFIRMED' : undefined,
    });
  }

  await placeActivity.recordMeetingRsvpUpdated({
    actorUserId: userId,
    meetingId,
    rsvpStatus: status,
  });
  placeDomain.recordMeetingRsvpUpdatedDomainEvent({
    actorUserId: userId,
    meetingId,
    inviteId: updated.id,
    rsvpStatus: status,
  });

  return updated;
}

export async function linkToCalendar(params: {
  userId: string;
  meetingId: string;
  calendarId?: string;
  existingEventId?: string | null;
}) {
  const { userId, meetingId } = params;

  if (params.existingEventId !== undefined && params.existingEventId !== null) {
    if (typeof params.existingEventId !== 'string' || params.existingEventId.trim() === '') {
      throw new PlaceServiceError(
        'existingEventId must be a non-empty string when provided',
        'invalid',
        400
      );
    }
  }

  await assertCanLinkMeetingToCalendar(meetingId, userId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_MEETING_LINK_CALENDAR,
    resourceType: 'place_meeting',
    resourceId: meetingId,
    metadata: { calendarId: params.calendarId, existingEventId: params.existingEventId },
  });

  const meeting = await prisma.placeMeetingPlace.findUnique({
    where: { id: meetingId },
    include: { invites: { include: { invitee: { select: { id: true, email: true } } } } },
  });

  if (!meeting) {
    throw new PlaceServiceError('Meeting not found', 'meeting_not_found', 404);
  }

  let eventId: string | undefined =
    typeof params.existingEventId === 'string' && params.existingEventId.trim() !== ''
      ? params.existingEventId
      : undefined;

  if (eventId) {
    const canLink = await userCanLinkCalendarEvent(userId, eventId);
    if (!canLink) {
      throw new PlaceServiceError('No access to this calendar event', 'forbidden', 403);
    }
  }

  if (!eventId) {
    if (!params.calendarId) {
      throw new PlaceServiceError('calendarId is required to create a new event', 'invalid', 400);
    }

    const startAt = meeting.scheduledAt || new Date();
    const endAt = new Date(startAt.getTime() + (meeting.duration || 60) * 60 * 1000);

    try {
      const { event } = await createEvent({
        userId,
        calendarId: params.calendarId,
        title: `Meeting at ${meeting.locationName}`,
        description: meeting.note || undefined,
        location: meeting.locationAddress || meeting.locationName,
        startAt,
        endAt,
        timezone: 'UTC',
      });
      eventId = event.id;
    } catch (error: unknown) {
      mapCalendarError(error);
    }
  }

  const updated = await prisma.placeMeetingPlace.update({
    where: { id: meetingId },
    data: { eventId },
  });

  await placeActivity.recordMeetingLinkedToCalendar({
    actorUserId: userId,
    meetingId,
    eventId: eventId!,
  });
  placeDomain.recordMeetingLinkedToCalendarDomainEvent({
    actorUserId: userId,
    meetingId,
    eventId: eventId!,
  });

  placeRealtime.broadcastMeetingUpdated(meetingParticipantIds(meeting), {
    meetingId,
    status: updated.status,
  });

  return { meetingId: updated.id, eventId: eventId! };
}

export async function getLocationPrivacy(userId: string) {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LOCATION_PRIVACY_READ,
    resourceType: 'place',
    resourceId: userId,
  });

  let privacy = await prisma.placeLocationPrivacy.findUnique({ where: { userId } });
  if (!privacy) {
    privacy = await prisma.placeLocationPrivacy.create({ data: { userId } });
  }
  return privacy;
}

export async function updateLocationPrivacy(params: {
  userId: string;
  shareLocationWithConnections?: boolean;
  showOnMeetingPlaces?: boolean;
}) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_LOCATION_PRIVACY_UPDATE,
    resourceType: 'place',
    resourceId: params.userId,
  });

  const data: Record<string, boolean> = {};
  if (typeof params.shareLocationWithConnections === 'boolean') {
    data.shareLocationWithConnections = params.shareLocationWithConnections;
  }
  if (typeof params.showOnMeetingPlaces === 'boolean') {
    data.showOnMeetingPlaces = params.showOnMeetingPlaces;
  }

  return prisma.placeLocationPrivacy.upsert({
    where: { userId: params.userId },
    update: data,
    create: { userId: params.userId, ...data },
  });
}
