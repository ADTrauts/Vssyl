import {
  emitPlaceConnectionAcceptedEvent,
  emitPlaceConnectionRequestedEvent,
  emitPlaceListingPublishedEvent,
  emitPlaceListingReportedEvent,
  emitPlaceListingUpdatedEvent,
  emitPlaceMeetingCancelledEvent,
  emitPlaceMeetingCreatedEvent,
  emitPlaceMeetingLinkedToCalendarEvent,
  emitPlaceMeetingRsvpUpdatedEvent,
  emitPlaceMeetingUpdatedEvent,
  emitPlaceNodeAddedEvent,
  emitPlaceNodeRemovedEvent,
  emitPlaceSetupCompletedEvent,
} from '../../events/domainEventEmitters';

export function recordNodeAddedDomainEvent(params: {
  actorUserId: string;
  nodeId: string;
  nodeType: string;
  entityId: string;
}): void {
  emitPlaceNodeAddedEvent(params);
}

export function recordNodeRemovedDomainEvent(params: {
  actorUserId: string;
  nodeId: string;
  nodeType: string;
  entityId: string;
}): void {
  emitPlaceNodeRemovedEvent(params);
}

export function recordListingUpdatedDomainEvent(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): void {
  emitPlaceListingUpdatedEvent(params);
}

export function recordListingPublishedDomainEvent(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): void {
  emitPlaceListingPublishedEvent(params);
}

export function recordListingReportedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  reason: string;
}): void {
  emitPlaceListingReportedEvent(params);
}

export function recordMeetingCreatedDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
  locationName: string;
}): void {
  emitPlaceMeetingCreatedEvent(params);
}

export function recordMeetingUpdatedDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
  status?: string;
}): void {
  emitPlaceMeetingUpdatedEvent(params);
}

export function recordMeetingCancelledDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
}): void {
  emitPlaceMeetingCancelledEvent(params);
}

export function recordMeetingRsvpUpdatedDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
  inviteId: string;
  rsvpStatus: string;
}): void {
  emitPlaceMeetingRsvpUpdatedEvent(params);
}

export function recordMeetingLinkedToCalendarDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
  eventId: string;
}): void {
  emitPlaceMeetingLinkedToCalendarEvent(params);
}

export function recordConnectionRequestedDomainEvent(params: {
  actorUserId: string;
  relationshipId: string;
  targetUserId: string;
}): void {
  emitPlaceConnectionRequestedEvent(params);
}

export function recordConnectionAcceptedDomainEvent(params: {
  actorUserId: string;
  relationshipId: string;
  withUserId: string;
}): void {
  emitPlaceConnectionAcceptedEvent(params);
}

export function recordSetupCompletedDomainEvent(params: {
  actorUserId: string;
  placeId: string;
}): void {
  emitPlaceSetupCompletedEvent(params);
}
