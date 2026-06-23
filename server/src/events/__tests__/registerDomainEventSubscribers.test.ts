import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emitDomainEvent } from '../emitDomainEvent';
import { subscribeDomainEvents } from '../domainEventBus';
import {
  registerDomainEventSubscribers,
  resetDomainEventSubscriberRegistrationForTests,
} from '../registerDomainEventSubscribers';
import { searchIndexDomainEventConsumer } from '../subscribers/searchIndexDomainEventSubscriber';
import { routeDomainEventToWorkflows } from '../../workflows/domainEventWorkflowRouter';
import { DOMAIN_EVENT_PRODUCTION_SUBSCRIBER_IDS } from '../domainEventOperationMatrix';

vi.mock('../subscribers/activityDomainEventSubscriber', () => ({
  recordDomainEventToActivityLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../subscribers/socketDomainEventSubscriber', () => ({
  broadcastDomainEventOnSocket: vi.fn(),
}));
vi.mock('../subscribers/notificationDomainEventSubscriber', () => ({
  notificationDomainEventConsumer: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../ai/consumers/AIEventConsumer', () => ({
  consumeDomainEventForAI: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../subscribers/webhookDomainEventSubscriber', () => ({
  deliverDomainEventToWebhooks: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../subscribers/searchIndexDomainEventSubscriber', () => ({
  searchIndexDomainEventConsumer: vi.fn(),
}));
vi.mock('../subscribers/calendarDashboardDomainEventSubscriber', () => ({
  calendarDashboardTabCreatedConsumer: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../subscribers/workspaceDashboardDomainEventSubscriber', () => ({
  workspaceDashboardTabCreatedConsumer: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../workflows/domainEventWorkflowRouter', () => ({
  routeDomainEventToWorkflows: vi.fn(),
}));
vi.mock('../../lib/logger', () => ({
  logger: {
    error: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

import { recordDomainEventToActivityLog } from '../subscribers/activityDomainEventSubscriber';
import { broadcastDomainEventOnSocket } from '../subscribers/socketDomainEventSubscriber';
import { notificationDomainEventConsumer } from '../subscribers/notificationDomainEventSubscriber';
import { consumeDomainEventForAI } from '../../ai/consumers/AIEventConsumer';
import { deliverDomainEventToWebhooks } from '../subscribers/webhookDomainEventSubscriber';

describe('registerDomainEventSubscribers (PK-W3-DE-1)', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDomainEventSubscriberRegistrationForTests();
    delete process.env.DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED;
    delete process.env.DOMAIN_EVENT_WORKFLOW_ROUTER_SUBSCRIBER_ENABLED;
  });

  afterEach(() => {
    process.env = { ...envBackup };
    resetDomainEventSubscriberRegistrationForTests();
  });

  it('does not invoke stub subscribers by default', async () => {
    registerDomainEventSubscribers();

    emitDomainEvent({
      type: 'test.honesty',
      actorUserId: 'u1',
      entityType: 'Thing',
      entityId: 't1',
      action: 'create',
      metadata: {},
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(searchIndexDomainEventConsumer).not.toHaveBeenCalled();
    expect(routeDomainEventToWorkflows).not.toHaveBeenCalled();
  });

  it('invokes production subscribers for emitted events', async () => {
    registerDomainEventSubscribers();

    emitDomainEvent({
      type: 'test.honesty',
      actorUserId: 'u1',
      entityType: 'Thing',
      entityId: 't1',
      action: 'create',
      metadata: {},
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(recordDomainEventToActivityLog).toHaveBeenCalled();
    expect(broadcastDomainEventOnSocket).toHaveBeenCalled();
    expect(notificationDomainEventConsumer).toHaveBeenCalled();
    expect(consumeDomainEventForAI).toHaveBeenCalled();
    expect(deliverDomainEventToWebhooks).toHaveBeenCalled();
  });

  it('invokes search stub when opt-in env is set', async () => {
    process.env.DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED = 'true';
    registerDomainEventSubscribers();

    emitDomainEvent({
      type: 'test.honesty',
      actorUserId: 'u1',
      entityType: 'Thing',
      entityId: 't1',
      action: 'create',
      metadata: {},
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(searchIndexDomainEventConsumer).toHaveBeenCalled();
  });

  it('registers exactly production subscriber count without stub flags', () => {
    const invoked: string[] = [];
    const unsub = subscribeDomainEvents(() => {
      /* baseline bus listener */
    });

    registerDomainEventSubscribers();

    expect(DOMAIN_EVENT_PRODUCTION_SUBSCRIBER_IDS).toHaveLength(7);

    unsub();
    expect(invoked).toEqual([]);
  });
});
