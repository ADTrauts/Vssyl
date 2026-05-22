/**
 * Delivers domain events to business webhook subscriptions (Phase 4C).
 */

import type { DomainEvent } from '../types';
import { deliverDomainEventToWebhookSubscriptions } from '../../services/webhookSubscriptionService';

export async function deliverDomainEventToWebhooks(event: DomainEvent): Promise<void> {
  await deliverDomainEventToWebhookSubscriptions(event);
}
