import { emitModuleActivityEvent } from '../moduleActivityService';

/**
 * Platform module activity only (Option A). Local `PlaceActivityFeedItem` is not written here;
 * Feed tab UI may still read legacy table until a read adapter is added (Phase 1E+).
 */

export async function recordNodeAdded(params: {
  actorUserId: string;
  nodeId: string;
  nodeType: string;
  entityId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'create',
    targetType: 'node',
    targetId: params.nodeId,
    metadata: { nodeType: params.nodeType, entityId: params.entityId },
  });
}

export async function recordNodeRemoved(params: {
  actorUserId: string;
  nodeId: string;
  nodeType: string;
  entityId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'delete',
    targetType: 'node',
    targetId: params.nodeId,
    metadata: { nodeType: params.nodeType, entityId: params.entityId },
  });
}

export async function recordListingUpdated(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'update',
    targetType: 'listing',
    targetId: params.listingId,
    businessId: params.businessId,
    metadata: { businessId: params.businessId },
  });
}

export async function recordListingPublished(params: {
  actorUserId: string;
  listingId: string;
  businessId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'publish',
    targetType: 'listing',
    targetId: params.listingId,
    businessId: params.businessId,
    metadata: { businessId: params.businessId },
  });
}

export async function recordListingReported(params: {
  actorUserId: string;
  businessId: string;
  reason: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'report',
    targetType: 'listing',
    targetId: params.businessId,
    businessId: params.businessId,
    metadata: { reason: params.reason },
  });
}

export async function recordMeetingCreated(params: {
  actorUserId: string;
  meetingId: string;
  locationName: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'create',
    targetType: 'meeting',
    targetId: params.meetingId,
    metadata: { locationName: params.locationName },
  });
}

export async function recordMeetingUpdated(params: {
  actorUserId: string;
  meetingId: string;
  status?: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'update',
    targetType: 'meeting',
    targetId: params.meetingId,
    metadata: params.status ? { status: params.status } : undefined,
  });
}

export async function recordMeetingCancelled(params: {
  actorUserId: string;
  meetingId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'cancel',
    targetType: 'meeting',
    targetId: params.meetingId,
  });
}

export async function recordMeetingRsvpUpdated(params: {
  actorUserId: string;
  meetingId: string;
  rsvpStatus: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'rsvp',
    targetType: 'meeting',
    targetId: params.meetingId,
    metadata: { rsvpStatus: params.rsvpStatus },
  });
}

export async function recordMeetingLinkedToCalendar(params: {
  actorUserId: string;
  meetingId: string;
  eventId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'link_calendar',
    targetType: 'meeting',
    targetId: params.meetingId,
    metadata: { eventId: params.eventId },
  });
}

export async function recordSetupCompleted(params: {
  actorUserId: string;
  placeId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'complete_setup',
    targetType: 'place',
    targetId: params.placeId,
  });
}

export async function recordInterestsUpdated(params: {
  actorUserId: string;
  placeId: string;
  categories: string[];
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'update',
    targetType: 'interests',
    targetId: params.placeId,
    metadata: { categories: params.categories },
  });
}

export async function recordConnectionRequested(params: {
  actorUserId: string;
  relationshipId: string;
  targetUserId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'request',
    targetType: 'connection',
    targetId: params.relationshipId,
    metadata: { targetUserId: params.targetUserId },
  });
}

export async function recordConnectionAccepted(params: {
  actorUserId: string;
  relationshipId: string;
  withUserId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'place',
    action: 'accept',
    targetType: 'connection',
    targetId: params.relationshipId,
    metadata: { withUserId: params.withUserId },
  });
}
