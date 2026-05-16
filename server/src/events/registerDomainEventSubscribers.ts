import { logger } from '../lib/logger';
import { subscribeDomainEvents } from './domainEventBus';
import type { DomainEvent } from './types';
import { recordDomainEventToActivityLog } from './subscribers/activityDomainEventSubscriber';
import { broadcastDomainEventOnSocket } from './subscribers/socketDomainEventSubscriber';
import { placeholderNotificationDomainEventConsumer } from './subscribers/notificationDomainEventSubscriber';
import { placeholderAnalyticsDomainEventConsumer } from './subscribers/analyticsDomainEventSubscriber';

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
    void runSubscriber('notification_placeholder', (e) => {
      placeholderNotificationDomainEventConsumer(e);
    }, event);
    void runSubscriber('analytics_placeholder', (e) => {
      placeholderAnalyticsDomainEventConsumer(e);
    }, event);
  });
}
