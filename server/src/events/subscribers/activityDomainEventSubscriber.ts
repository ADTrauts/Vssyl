import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { DomainEvent } from '../types';
import { domainEventToJsonValue } from '../emitDomainEvent';

const MODULE_ID_META_KEY = 'moduleId';

export async function recordDomainEventToActivityLog(event: DomainEvent): Promise<void> {
  const moduleFromMeta =
    typeof event.metadata[MODULE_ID_META_KEY] === 'string'
      ? (event.metadata[MODULE_ID_META_KEY] as string)
      : null;

  try {
    await prisma.log.create({
      data: {
        level: 'info',
        service: 'vssyl_server',
        operation: 'domain_event_recorded',
        message: `${event.type}:${event.action}:${event.entityType}`,
        userId: event.actorUserId,
        businessId: event.businessId ?? null,
        module: moduleFromMeta,
        metadata: domainEventToJsonValue(event),
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to persist domain event log', {
      operation: 'domain_event_activity_subscriber',
      error: { message: err.message, stack: err.stack },
      context: { domainEventId: event.id, type: event.type },
    });
  }
}
