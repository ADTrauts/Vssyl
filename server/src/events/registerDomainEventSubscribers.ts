import { logger } from '../lib/logger';
import { subscribeDomainEvents } from './domainEventBus';
import type { DomainEvent } from './types';
import { recordDomainEventToActivityLog } from './subscribers/activityDomainEventSubscriber';
import { broadcastDomainEventOnSocket } from './subscribers/socketDomainEventSubscriber';
import { notificationDomainEventConsumer } from './subscribers/notificationDomainEventSubscriber';
import { placeholderAnalyticsDomainEventConsumer } from './subscribers/analyticsDomainEventSubscriber';
import { consumeDomainEventForAI } from '../ai/consumers/AIEventConsumer';
import { deliverDomainEventToWebhooks } from './subscribers/webhookDomainEventSubscriber';
import { searchIndexDomainEventConsumer } from './subscribers/searchIndexDomainEventSubscriber';
import { calendarDashboardTabCreatedConsumer } from './subscribers/calendarDashboardDomainEventSubscriber';
import { workspaceDashboardTabCreatedConsumer } from './subscribers/workspaceDashboardDomainEventSubscriber';
import { routeDomainEventToWorkflows } from '../workflows/domainEventWorkflowRouter';

let registered = false;

async function runSubscriber(
  name: string,
  fn: (event: DomainEvent) => void | Promise<void>,
  event: DomainEvent
): Promise<void> {
  try {
    await fn(event);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Domain event subscriber failed', {
      operation: 'domain_event_subscriber_error',
      error: { message: err.message, stack: err.stack },
      context: { subscriber: name, domainEventId: event.id, type: event.type },
    });
  }
}

/**
 * Register in-process domain event consumers once per process.
 * Idempotent so dev reload / tests do not duplicate handlers.
 */
export function registerDomainEventSubscribers(): void {
  if (registered) {
    return;
  }
  registered = true;

  subscribeDomainEvents((event: DomainEvent) => {
    void runSubscriber('activity', (e) => recordDomainEventToActivityLog(e), event);
    void runSubscriber('socket', (e) => {
      broadcastDomainEventOnSocket(e);
    }, event);
    void runSubscriber('notification', (e) => notificationDomainEventConsumer(e), event);
    void runSubscriber('analytics_placeholder', (e) => {
      placeholderAnalyticsDomainEventConsumer(e);
    }, event);
    void runSubscriber('ai_event_consumer', (e) => consumeDomainEventForAI(e), event);
    void runSubscriber('webhook_subscriptions', (e) => deliverDomainEventToWebhooks(e), event);
    void runSubscriber('search_index_stub', (e) => searchIndexDomainEventConsumer(e), event);
    void runSubscriber('workflow_router_stub', (e) => routeDomainEventToWorkflows(e), event);
    void runSubscriber('calendar_dashboard_bootstrap', (e) => calendarDashboardTabCreatedConsumer(e), event);
    void runSubscriber('workspace_dashboard_seed', (e) => workspaceDashboardTabCreatedConsumer(e), event);
  });
}
