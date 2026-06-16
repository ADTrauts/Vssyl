import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as domainEventEmitters from '../../events/domainEventEmitters';
import {
  recordCommunicationPublishedDomainEvent,
  recordAckCompletedDomainEvent,
  recordCampaignCompletedDomainEvent,
} from '../workforceDomainEventService';

describe('workforceDomainEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(domainEventEmitters, 'emitWorkforceCommunicationPublishedEvent').mockReturnValue(
      {} as never
    );
    vi.spyOn(domainEventEmitters, 'emitWorkforceAckCompletedEvent').mockReturnValue({} as never);
    vi.spyOn(domainEventEmitters, 'emitWorkforceCampaignCompletedEvent').mockReturnValue(
      {} as never
    );
  });

  it('recordCommunicationPublishedDomainEvent forwards publish metadata without body', () => {
    recordCommunicationPublishedDomainEvent({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      communicationType: 'ANNOUNCEMENT',
      audienceType: 'BUSINESS',
      recipientCount: 10,
      requiresAck: true,
      priority: 'HIGH',
    });

    expect(domainEventEmitters.emitWorkforceCommunicationPublishedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        businessId: 'biz-1',
        communicationId: 'comm-1',
        communicationType: 'ANNOUNCEMENT',
        audienceType: 'BUSINESS',
        recipientCount: 10,
        requiresAck: true,
        priority: 'HIGH',
      })
    );
  });

  it('recordAckCompletedDomainEvent emits workforce.ack.completed', () => {
    recordAckCompletedDomainEvent({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
    });

    expect(domainEventEmitters.emitWorkforceAckCompletedEvent).toHaveBeenCalledWith({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
    });
  });

  it('recordCampaignCompletedDomainEvent includes communicationCount', () => {
    recordCampaignCompletedDomainEvent({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      campaignId: 'camp-1',
      communicationCount: 5,
    });

    expect(domainEventEmitters.emitWorkforceCampaignCompletedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'camp-1',
        communicationCount: 5,
      })
    );
  });
});
