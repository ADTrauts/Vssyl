import { logger } from '../lib/logger';
import { subscribeDomainEvents } from './domainEventBus';
import type { DomainEvent } from './types';
import { recordDomainEventToActivityLog } from './subscribers/activityDomainEventSubscriber';
import { broadcastDomainEventOnSocket } from './subscribers/socketDomainEventSubscriber';
import { notificationDomainEventConsumer } from './subscribers/notificationDomainEventSubscriber';
import { consumeDomainEventForAI } from '../ai/consumers/AIEventConsumer';
import { deliverDomainEventToWebhooks } from './subscribers/webhookDomainEventSubscriber';
import { searchIndexDomainEventConsumer } from './subscribers/searchIndexDomainEventSubscriber';
import { calendarDashboardTabCreatedConsumer } from './subscribers/calendarDashboardDomainEventSubscriber';
import { workspaceDashboardTabCreatedConsumer } from './subscribers/workspaceDashboardDomainEventSubscriber';
import { routeDomainEventToWorkflows } from '../workflows/domainEventWorkflowRouter';
import {
  resolveActiveDomainEventSubscribers,
  validateDomainEventOperationMatrix,
} from './domainEventOperationMatrix';

let registered = false;

type SubscriberHandler = (event: DomainEvent) => void | Promise<void>;

const SUBSCRIBER_HANDLERS: Record<string, SubscriberHandler> = {
  activity: (e) => recordDomainEventToActivityLog(e),
  socket: (e) => {
    broadcastDomainEventOnSocket(e);
  },
  notification: (e) => notificationDomainEventConsumer(e),
  ai_event_consumer: (e) => consumeDomainEventForAI(e),
  webhook_subscriptions: (e) => deliverDomainEventToWebhooks(e),
  search_index_stub: (e) => searchIndexDomainEventConsumer(e),
  workflow_router_stub: (e) => routeDomainEventToWorkflows(e),
  calendar_dashboard_bootstrap: (e) => calendarDashboardTabCreatedConsumer(e),
  workspace_dashboard_seed: (e) => workspaceDashboardTabCreatedConsumer(e),
};

async function runSubscriber(
  name: string,
  fn: SubscriberHandler,
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
 * Stub subscribers are excluded unless explicitly enabled via env (PK-W3-DE-1).
 */
export function registerDomainEventSubscribers(): void {
  if (registered) {
    return;
  }
  registered = true;

  const matrixValidation = validateDomainEventOperationMatrix();
  if (!matrixValidation.valid) {
    void logger.error('Domain event operation matrix validation failed', {
      operation: 'domain_event_matrix_validation_error',
      context: { errors: matrixValidation.errors },
    });
  }

  const activeSubscribers = resolveActiveDomainEventSubscribers();

  subscribeDomainEvents((event: DomainEvent) => {
    for (const definition of activeSubscribers) {
      const handler = SUBSCRIBER_HANDLERS[definition.id];
      if (!handler) {
        void logger.error('Domain event subscriber handler missing', {
          operation: 'domain_event_subscriber_missing_handler',
          context: { subscriberId: definition.id },
        });
        continue;
      }
      void runSubscriber(definition.id, handler, event);
    }
  });

  void logger.info('Domain event subscribers registered', {
    operation: 'domain_event_subscribers_registered',
    context: {
      subscriberIds: activeSubscribers.map((s) => s.id),
      count: activeSubscribers.length,
    },
  });
}

/** Test-only reset for subscriber registration idempotency guard. */
export function resetDomainEventSubscriberRegistrationForTests(): void {
  registered = false;
}
