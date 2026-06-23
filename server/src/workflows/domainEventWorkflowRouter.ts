import { logger } from '../lib/logger';
import type { DomainEvent } from '../events/types';

/**
 * Batch 4 MVP — future platform workflow router consumes domain events and invokes canonical services.
 * WorkflowAutomationService remains Tier 4 / non-canonical until wired here.
 *
 * PK-W3-DE-1: Not registered in production. Opt-in only:
 * DOMAIN_EVENT_WORKFLOW_ROUTER_SUBSCRIBER_ENABLED=true
 */
export function routeDomainEventToWorkflows(event: DomainEvent): void {
  void logger.debug('Domain event workflow router (stub)', {
    operation: 'domain_event_workflow_router_stub',
    context: {
      domainEventId: event.id,
      type: event.type,
      entityType: event.entityType,
    },
  });
}
