import {
  emitWorkforceAckCompletedEvent,
  emitWorkforceCampaignCompletedEvent,
  emitWorkforceCampaignCreatedEvent,
  emitWorkforceCampaignPermanentlyDeletedEvent,
  emitWorkforceCampaignRestoredEvent,
  emitWorkforceCampaignTrashedEvent,
  emitWorkforceCommunicationCancelledEvent,
  emitWorkforceCommunicationCreatedEvent,
  emitWorkforceCommunicationExpiredEvent,
  emitWorkforceCommunicationPermanentlyDeletedEvent,
  emitWorkforceCommunicationPublishedEvent,
  emitWorkforceCommunicationRestoredEvent,
  emitWorkforceCommunicationScheduledEvent,
  emitWorkforceCommunicationTrashedEvent,
  emitWorkforceCommunicationUpdatedEvent,
  emitWorkforceReadRecordedEvent,
  emitWorkforceBridgeCreatedEvent,
} from '../events/domainEventEmitters';

export function recordCommunicationCreatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  communicationType?: string;
  priority?: string;
}): void {
  emitWorkforceCommunicationCreatedEvent(params);
}

export function recordCommunicationUpdatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  status?: string;
}): void {
  emitWorkforceCommunicationUpdatedEvent(params);
}

export function recordCommunicationScheduledDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  scheduledAt: Date | string;
}): void {
  emitWorkforceCommunicationScheduledEvent(params);
}

export function recordCommunicationPublishedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  communicationType?: string;
  audienceType?: string;
  recipientCount?: number;
  requiresAck?: boolean;
  priority?: string;
}): void {
  emitWorkforceCommunicationPublishedEvent(params);
}

export function recordCommunicationCancelledDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): void {
  emitWorkforceCommunicationCancelledEvent(params);
}

export function recordCommunicationExpiredDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): void {
  emitWorkforceCommunicationExpiredEvent(params);
}

export function recordCommunicationTrashedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): void {
  emitWorkforceCommunicationTrashedEvent(params);
}

export function recordCommunicationRestoredDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): void {
  emitWorkforceCommunicationRestoredEvent(params);
}

export function recordCommunicationPurgedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): void {
  emitWorkforceCommunicationPermanentlyDeletedEvent(params);
}

export function recordReadRecordedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  source?: string;
}): void {
  emitWorkforceReadRecordedEvent(params);
}

export function recordAckCompletedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): void {
  emitWorkforceAckCompletedEvent(params);
}

export function recordCampaignCreatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): void {
  emitWorkforceCampaignCreatedEvent(params);
}

export function recordCampaignCompletedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
  communicationCount?: number;
}): void {
  emitWorkforceCampaignCompletedEvent(params);
}

export function recordCampaignTrashedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): void {
  emitWorkforceCampaignTrashedEvent(params);
}

export function recordCampaignRestoredDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): void {
  emitWorkforceCampaignRestoredEvent(params);
}

export function recordCampaignPurgedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): void {
  emitWorkforceCampaignPermanentlyDeletedEvent(params);
}

export function recordBridgeCreatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  sourceModuleId: string;
  bridgeKind: string;
  sourceEntityId: string;
}): void {
  emitWorkforceBridgeCreatedEvent(params);
}
