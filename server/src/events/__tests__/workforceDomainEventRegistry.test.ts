import { describe, expect, it } from 'vitest';
import {
  DOMAIN_EVENT_CONTRACTS,
  DOMAIN_EVENT_TYPES,
  buildTypedDomainEventInput,
  isRegisteredDomainEventType,
  sanitizeDomainEventMetadata,
} from '../domainEventRegistry';

const WORKFORCE_EVENT_TYPES = [
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_CREATED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_UPDATED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_SCHEDULED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_PUBLISHED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_CANCELLED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_EXPIRED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_TRASHED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_RESTORED,
  DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_PERMANENTLY_DELETED,
  DOMAIN_EVENT_TYPES.WORKFORCE_READ_RECORDED,
  DOMAIN_EVENT_TYPES.WORKFORCE_ACK_COMPLETED,
  DOMAIN_EVENT_TYPES.WORKFORCE_CAMPAIGN_CREATED,
  DOMAIN_EVENT_TYPES.WORKFORCE_CAMPAIGN_COMPLETED,
  DOMAIN_EVENT_TYPES.WORKFORCE_CAMPAIGN_TRASHED,
  DOMAIN_EVENT_TYPES.WORKFORCE_CAMPAIGN_RESTORED,
  DOMAIN_EVENT_TYPES.WORKFORCE_CAMPAIGN_PERMANENTLY_DELETED,
  DOMAIN_EVENT_TYPES.WORKFORCE_BRIDGE_CREATED,
] as const;

describe('workforce domain event registry (Phase A)', () => {
  it('registers 17 workforce.* domain event contracts', () => {
    expect(WORKFORCE_EVENT_TYPES).toHaveLength(17);
    for (const type of WORKFORCE_EVENT_TYPES) {
      expect(isRegisteredDomainEventType(type)).toBe(true);
      expect(DOMAIN_EVENT_CONTRACTS[type]).toBeDefined();
    }
  });

  it('published contract strips body and title from metadata', () => {
    const sanitized = sanitizeDomainEventMetadata(
      DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_PUBLISHED,
      {
        moduleId: 'workforce_comms',
        audienceType: 'DEPARTMENT',
        recipientCount: 10,
        title: 'Secret title',
        body: 'Secret body',
      }
    );
    expect(sanitized).toMatchObject({
      moduleId: 'workforce_comms',
      audienceType: 'DEPARTMENT',
      recipientCount: 10,
    });
    expect(sanitized).not.toHaveProperty('title');
    expect(sanitized).not.toHaveProperty('body');
  });

  it('buildTypedDomainEventInput applies workforce publish defaults', () => {
    const input = buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.WORKFORCE_COMMUNICATION_PUBLISHED, {
      actorUserId: 'u1',
      entityId: 'comm-1',
      businessId: 'biz-1',
      metadata: {
        moduleId: 'workforce_comms',
        communicationType: 'ANNOUNCEMENT',
        audienceType: 'BUSINESS',
        recipientCount: 42,
        requiresAck: true,
        priority: 'HIGH',
        body: 'must strip',
      },
    });
    expect(input.type).toBe('workforce.communication.published');
    expect(input.entityType).toBe('WorkforceCommunication');
    expect(input.action).toBe('publish');
    expect(input.metadata).toMatchObject({
      moduleId: 'workforce_comms',
      recipientCount: 42,
    });
    expect(input.metadata).not.toHaveProperty('body');
  });
});
