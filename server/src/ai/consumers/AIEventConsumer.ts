/**
 * AI platform consumer for domain events (Phase 4A).
 * Records learning signal stubs — no auto-execution, no module activity emission.
 */

import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';
import type { DomainEvent } from '../../events/types';
import { logger } from '../../lib/logger';
import { userLearningSignalService } from '../../services/userLearningSignalService';

const AI_CONSUMED_DOMAIN_EVENT_TYPES = new Set<string>([
  DOMAIN_EVENT_TYPES.FILE_UPLOADED,
  DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
  DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED,
  DOMAIN_EVENT_TYPES.MODULE_ENABLED,
  DOMAIN_EVENT_TYPES.MODULE_DISABLED,
  DOMAIN_EVENT_TYPES.MODULE_INSTALLED,
]);

function resolveSourceModule(event: DomainEvent): string {
  const metadata = event.metadata ?? {};
  if (typeof metadata.moduleId === 'string' && metadata.moduleId.trim()) {
    return metadata.moduleId.trim();
  }

  switch (event.type) {
    case DOMAIN_EVENT_TYPES.FILE_UPLOADED:
    case DOMAIN_EVENT_TYPES.FILE_DELETED:
    case DOMAIN_EVENT_TYPES.FILE_SHARED:
      return 'drive';
    case DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT:
      return 'chat';
    case DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED:
      return 'calendar';
    default:
      return 'platform';
  }
}

function resolveDashboardId(event: DomainEvent): string | null {
  if (event.dashboardId) return event.dashboardId;
  const fromMetadata = event.metadata?.dashboardId;
  return typeof fromMetadata === 'string' && fromMetadata.trim() ? fromMetadata.trim() : null;
}

export function isAIConsumableDomainEvent(event: DomainEvent): boolean {
  return AI_CONSUMED_DOMAIN_EVENT_TYPES.has(event.type);
}

/**
 * Subscribe handler: translate authorized, post-mutation domain events into learning stubs.
 */
export async function consumeDomainEventForAI(event: DomainEvent): Promise<void> {
  if (!isAIConsumableDomainEvent(event)) {
    return;
  }

  if (!event.actorUserId?.trim()) {
    return;
  }

  await userLearningSignalService.recordDomainEventLearningStub({
    userId: event.actorUserId,
    domainEventId: event.id,
    domainEventType: event.type,
    entityType: event.entityType,
    entityId: event.entityId,
    sourceModule: resolveSourceModule(event),
    dashboardId: resolveDashboardId(event),
    businessId: event.businessId ?? null,
    metadata: {
      action: event.action,
      ...(event.metadata ?? {}),
    },
  });

  void logger.debug('[AI_EVENT_CONSUMER]', {
    operation: 'ai_domain_event_consumed',
    domainEventId: event.id,
    type: event.type,
    userId: event.actorUserId,
    sourceModule: resolveSourceModule(event),
  });
}
