import { getChatSocketService } from '../chatSocketService';

export interface PlaceNodeRealtimePayload {
  nodeId: string;
  nodeType: string;
  entityId: string;
}

/** Adapter over chatSocketService — preserves legacy place websocket events. */
export function broadcastPlaceNodeAdded(userId: string, payload: PlaceNodeRealtimePayload): void {
  try {
    getChatSocketService().broadcastPlaceEvent(
      userId,
      'place:node:added',
      payload as unknown as Record<string, unknown>
    );
  } catch {
    /* socket not initialized in tests */
  }
}

export function broadcastPlaceNodeRemoved(userId: string, payload: PlaceNodeRealtimePayload): void {
  try {
    getChatSocketService().broadcastPlaceEvent(
      userId,
      'place:node:removed',
      payload as unknown as Record<string, unknown>
    );
  } catch {
    /* socket not initialized in tests */
  }
}

export function broadcastMeetingInvite(
  inviteeId: string,
  payload: {
    meetingId: string;
    locationName: string;
    creatorId: string;
  }
): void {
  try {
    getChatSocketService().broadcastPlaceEvent(inviteeId, 'place:connection:request', {
      type: 'meeting_invite',
      ...payload,
    });
  } catch {
    /* socket not initialized in tests */
  }
}

export function broadcastMeetingRsvp(
  creatorId: string,
  payload: {
    meetingId: string;
    inviteeId: string;
    rsvpStatus: string;
  }
): void {
  try {
    getChatSocketService().broadcastPlaceEvent(creatorId, 'place:connection:accepted', {
      type: 'meeting_rsvp',
      ...payload,
    });
  } catch {
    /* socket not initialized in tests */
  }
}

export function broadcastMeetingCreated(
  userIds: string[],
  payload: { meetingId: string; locationName: string; creatorId: string }
): void {
  const unique = [...new Set(userIds.filter(Boolean))];
  for (const userId of unique) {
    try {
      getChatSocketService().broadcastPlaceEvent(userId, 'place:meeting:created', payload);
    } catch {
      /* socket not initialized in tests */
    }
  }
}

export function broadcastMeetingUpdated(
  userIds: string[],
  payload: { meetingId: string; status?: string }
): void {
  const unique = [...new Set(userIds.filter(Boolean))];
  for (const userId of unique) {
    try {
      getChatSocketService().broadcastPlaceEvent(userId, 'place:meeting:updated', payload);
    } catch {
      /* socket not initialized in tests */
    }
  }
}

export function broadcastMeetingCancelled(
  userIds: string[],
  payload: { meetingId: string }
): void {
  const unique = [...new Set(userIds.filter(Boolean))];
  for (const userId of unique) {
    try {
      getChatSocketService().broadcastPlaceEvent(userId, 'place:meeting:cancelled', payload);
    } catch {
      /* socket not initialized in tests */
    }
  }
}

export function broadcastListingUpdated(
  businessId: string,
  payload: { listingId: string; businessId: string }
): void {
  try {
    getChatSocketService().broadcastPlaceEvent(businessId, 'place:listing:updated', payload);
  } catch {
    /* socket not initialized in tests */
  }
}

export function broadcastConnectionRequest(
  targetUserId: string,
  payload: { relationshipId: string; fromUserId: string }
): void {
  try {
    getChatSocketService().broadcastPlaceEvent(targetUserId, 'place:connection:request', payload);
  } catch {
    /* socket not initialized in tests */
  }
}

export function broadcastConnectionAccepted(
  userId: string,
  payload: { relationshipId: string; withUserId: string }
): void {
  try {
    getChatSocketService().broadcastPlaceEvent(userId, 'place:connection:accepted', payload);
  } catch {
    /* socket not initialized in tests */
  }
}
