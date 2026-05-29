import { logger } from '../lib/logger';
import type { DomainEvent } from '../events/types';

/**
 * Batch 4 MVP — future platform workflow router consumes domain events and invokes canonical services.
 * WorkflowAutomationService remains Tier 4 / non-canonical until wired here.
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
