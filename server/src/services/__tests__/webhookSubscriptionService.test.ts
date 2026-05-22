import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';
import type { DomainEvent } from '../../events/types';
import { deliverDomainEventToWebhookSubscriptions } from '../webhookSubscriptionService';
import * as webhookDeliveryService from '../webhookDeliveryService';

describe('webhookSubscriptionService domain delivery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('schedules delivery for matching business subscription on module.installed', async () => {
    vi.spyOn(prisma.webhookSubscription, 'findMany').mockResolvedValue([
      {
        id: 'sub-1',
        businessId: 'biz-1',
        url: 'https://partner.example.com/hook',
        signingSecret: 'secret',
        eventTypes: [DOMAIN_EVENT_TYPES.MODULE_INSTALLED],
        status: 'ACTIVE',
        description: null,
        createdByUserId: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const scheduleSpy = vi
      .spyOn(webhookDeliveryService, 'scheduleWebhookDelivery')
      .mockResolvedValue('whd_1');

    const event: DomainEvent = {
      id: 'evt-1',
      type: DOMAIN_EVENT_TYPES.MODULE_INSTALLED,
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      entityType: 'ModuleInstallation',
      entityId: 'inst-1',
      action: 'install',
      metadata: { moduleId: 'drive', installScope: 'business' },
      createdAt: new Date().toISOString(),
    };

    await deliverDomainEventToWebhookSubscriptions(event);

    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: 'sub-1',
        eventType: DOMAIN_EVENT_TYPES.MODULE_INSTALLED,
        domainEventId: 'evt-1',
      })
    );
  });
});
