import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { NotificationService } from '../notificationService';

/**
 * Runtime-backed Place notification types (Phase 1D):
 * - place_meeting_invite
 * - place_meeting_rsvp
 *
 * Deferred: place_listing_reported (no clear moderator recipient in product today).
 *
 * Phase 1E:
 * - place_connection_request
 * - place_connection_accepted
 */

export async function notifyConnectionRequest(params: {
  actorUserId: string;
  targetUserId: string;
  relationshipId: string;
}): Promise<void> {
  const { actorUserId, targetUserId, relationshipId } = params;
  if (!targetUserId || targetUserId === actorUserId) return;

  try {
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { name: true },
    });
    const actorName = actor?.name ?? 'Someone';

    await NotificationService.createNotification({
      userId: targetUserId,
      type: 'place_connection_request',
      title: 'Connection request',
      body: `${actorName} wants to connect on Place`,
      data: {
        relationshipId,
        moduleId: 'place',
        actorUserId,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to deliver place connection request notification', {
      operation: 'place_notification_connection_request',
      relationshipId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyConnectionAccepted(params: {
  actorUserId: string;
  requesterId: string;
  relationshipId: string;
}): Promise<void> {
  const { actorUserId, requesterId, relationshipId } = params;
  if (!requesterId || requesterId === actorUserId) return;

  try {
    const accepter = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { name: true },
    });
    const accepterName = accepter?.name ?? 'Someone';

    await NotificationService.createNotification({
      userId: requesterId,
      type: 'place_connection_accepted',
      title: 'Connection accepted',
      body: `${accepterName} accepted your connection request`,
      data: {
        relationshipId,
        moduleId: 'place',
        actorUserId,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to deliver place connection accepted notification', {
      operation: 'place_notification_connection_accepted',
      relationshipId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyMeetingInvite(params: {
  actorUserId: string;
  inviteeId: string;
  meetingId: string;
  locationName: string;
}): Promise<void> {
  const { actorUserId, inviteeId, meetingId, locationName } = params;
  if (!inviteeId || inviteeId === actorUserId) return;

  try {
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { name: true },
    });
    const actorName = actor?.name ?? 'Someone';

    await NotificationService.createNotification({
      userId: inviteeId,
      type: 'place_meeting_invite',
      title: 'Meeting invite',
      body: `${actorName} invited you to meet at ${locationName}`,
      data: {
        meetingId,
        moduleId: 'place',
        actorUserId,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to deliver place meeting invite notification', {
      operation: 'place_notification_meeting_invite',
      meetingId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyMeetingRsvp(params: {
  actorUserId: string;
  creatorId: string;
  meetingId: string;
  rsvpStatus: string;
}): Promise<void> {
  const { actorUserId, creatorId, meetingId, rsvpStatus } = params;
  if (!creatorId || creatorId === actorUserId) return;

  try {
    const invitee = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { name: true },
    });
    const inviteeName = invitee?.name ?? 'Someone';

    await NotificationService.createNotification({
      userId: creatorId,
      type: 'place_meeting_rsvp',
      title: 'Meeting RSVP',
      body: `${inviteeName} ${rsvpStatus === 'ACCEPTED' ? 'accepted' : 'declined'} your meeting invite`,
      data: {
        meetingId,
        moduleId: 'place',
        actorUserId,
        rsvpStatus,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to deliver place meeting RSVP notification', {
      operation: 'place_notification_meeting_rsvp',
      meetingId,
      error: { message: err.message, stack: err.stack },
    });
  }
}
