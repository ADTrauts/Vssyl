import { logger } from '../../lib/logger';
import type { DomainEvent } from '../types';

/**
 * Batch 4 stub — federated search v2 will maintain a unified index from domain events.
 * v1 continues to use SearchProvider pattern per module.
 */
export function searchIndexDomainEventConsumer(event: DomainEvent): void {
  void logger.debug('Domain event (search index stub)', {
    operation: 'domain_event_search_index_stub',
    context: {
      domainEventId: event.id,
      type: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
    },
  });
}
