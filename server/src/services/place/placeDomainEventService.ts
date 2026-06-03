import {
  emitPlaceConnectionAcceptedEvent,
  emitPlaceConnectionRequestedEvent,
  emitPlaceCommunityAutoClusteredEvent,
  emitPlaceCommunityCreatedEvent,
  emitPlaceCommunityJoinedEvent,
  emitPlaceCommunityLeftEvent,
  emitPlaceListingPublishedEvent,
  emitPlaceListingReportedEvent,
  emitPlaceListingTrashedEvent,
  emitPlaceListingRestoredEvent,
  emitPlaceListingPermanentlyDeletedEvent,
  emitPlaceListingUpdatedEvent,
  emitPlaceMeetingCancelledEvent,
  emitPlaceMeetingCreatedEvent,
  emitPlaceMeetingLinkedToCalendarEvent,
  emitPlaceMeetingTrashedEvent,
  emitPlaceMeetingRestoredEvent,
  emitPlaceMeetingPermanentlyDeletedEvent,
  emitPlaceMeetingRsvpUpdatedEvent,
  emitPlaceMeetingUpdatedEvent,
  emitPlaceNodeAddedEvent,
  emitPlaceNodeRemovedEvent,
  emitPlaceNodeUpdatedEvent,
  emitPlaceInterestsUpdatedEvent,
  emitPlaceFollowVisibilityUpdatedEvent,
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

export function recordNodeUpdatedDomainEvent(params: {
  actorUserId: string;
  nodeId: string;
  nodeType: string;
  entityId: string;
}): void {
  emitPlaceNodeUpdatedEvent(params);
}

export function recordInterestsUpdatedDomainEvent(params: {
  actorUserId: string;
  placeId: string;
  categories: string[];
}): void {
  emitPlaceInterestsUpdatedEvent(params);
}

export function recordFollowVisibilityUpdatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  isVisible: boolean;
}): void {
  emitPlaceFollowVisibilityUpdatedEvent(params);
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

export function recordListingTrashedDomainEvent(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): void {
  emitPlaceListingTrashedEvent(params);
}

export function recordListingRestoredDomainEvent(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): void {
  emitPlaceListingRestoredEvent(params);
}

export function recordListingPermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): void {
  emitPlaceListingPermanentlyDeletedEvent(params);
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

export function recordMeetingTrashedDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
}): void {
  emitPlaceMeetingTrashedEvent(params);
}

export function recordMeetingRestoredDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
}): void {
  emitPlaceMeetingRestoredEvent(params);
}

export function recordMeetingPermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  meetingId: string;
}): void {
  emitPlaceMeetingPermanentlyDeletedEvent(params);
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

export function recordCommunityCreatedDomainEvent(params: {
  actorUserId: string;
  communityId: string;
  communityName: string;
}): void {
  emitPlaceCommunityCreatedEvent(params);
}

export function recordCommunityJoinedDomainEvent(params: {
  actorUserId: string;
  communityId: string;
}): void {
  emitPlaceCommunityJoinedEvent(params);
}

export function recordCommunityLeftDomainEvent(params: {
  actorUserId: string;
  communityId: string;
}): void {
  emitPlaceCommunityLeftEvent(params);
}

export function recordCommunityAutoClusteredDomainEvent(params: {
  actorUserId: string;
  clustersCreated: number;
}): void {
  emitPlaceCommunityAutoClusteredEvent(params);
}
