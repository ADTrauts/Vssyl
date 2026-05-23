/**
 * AI platform consumer for domain events (Phase 4A + 5B).
 * Records learning signal stubs — no auto-execution, no module activity emission.
 * Ambient suggestion correlation runs asynchronously (non-blocking emit path).
 */

import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';
import type { DomainEvent } from '../../events/types';
import { logger } from '../../lib/logger';
import { ambientSuggestionService } from '../../services/ambientSuggestionService';
import { userLearningSignalService } from '../../services/userLearningSignalService';
import {
  resolveDashboardIdFromEvent,
  resolveSourceModuleFromEvent,
} from '../suggestions/suggestionEventUtils';

const AI_CONSUMED_DOMAIN_EVENT_TYPES = new Set<string>([
  DOMAIN_EVENT_TYPES.FILE_UPLOADED,
  DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
  DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED,
  DOMAIN_EVENT_TYPES.MODULE_ENABLED,
  DOMAIN_EVENT_TYPES.MODULE_DISABLED,
  DOMAIN_EVENT_TYPES.MODULE_INSTALLED,
]);

export function isAIConsumableDomainEvent(event: DomainEvent): boolean {
  return AI_CONSUMED_DOMAIN_EVENT_TYPES.has(event.type);
}

/**
 * Subscribe handler: learning stub (await) + ambient correlation (async, Phase 5B).
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
    sourceModule: resolveSourceModuleFromEvent(event),
    dashboardId: resolveDashboardIdFromEvent(event),
    businessId: event.businessId ?? null,
    metadata: {
      action: event.action,
      ...(event.metadata ?? {}),
    },
  });

  ambientSuggestionService.scheduleProcessDomainEvent(event);

  void logger.debug('[AI_EVENT_CONSUMER]', {
    operation: 'ai_domain_event_consumed',
    domainEventId: event.id,
    type: event.type,
    userId: event.actorUserId,
    sourceModule: resolveSourceModuleFromEvent(event),
  });
}
