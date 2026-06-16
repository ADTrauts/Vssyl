import { describe, expect, it, vi } from 'vitest';
import { emitDomainEvent } from '../emitDomainEvent';
import { emitWorkforceCommunicationPublishedEvent } from '../domainEventEmitters';

vi.mock('../emitDomainEvent', () => ({
  emitDomainEvent: vi.fn().mockReturnValue({ id: 'evt-1' }),
}));

describe('workforce domain event emitters (Phase D)', () => {
  it('emitWorkforceCommunicationPublishedEvent strips disallowed metadata before emit', () => {
    emitWorkforceCommunicationPublishedEvent({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      communicationType: 'ANNOUNCEMENT',
      audienceType: 'BUSINESS',
      recipientCount: 12,
      requiresAck: true,
      priority: 'HIGH',
    });

    expect(emitDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workforce.communication.published',
        entityType: 'WorkforceCommunication',
        action: 'publish',
        metadata: expect.objectContaining({
          moduleId: 'workforce_comms',
          recipientCount: 12,
        }),
      })
    );

    const callArg = vi.mocked(emitDomainEvent).mock.calls[0]?.[0];
    expect(callArg?.metadata).not.toHaveProperty('title');
    expect(callArg?.metadata).not.toHaveProperty('body');
  });
});
