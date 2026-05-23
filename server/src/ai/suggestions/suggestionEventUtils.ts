/**
 * Shared helpers for domain event → suggestion correlation (Phase 5B).
 */

import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';
import type { DomainEvent } from '../../events/types';

export function resolveDashboardIdFromEvent(event: DomainEvent): string | null {
  if (event.dashboardId) return event.dashboardId;
  const fromMetadata = event.metadata?.dashboardId;
  return typeof fromMetadata === 'string' && fromMetadata.trim() ? fromMetadata.trim() : null;
}

export function resolveSourceModuleFromEvent(event: DomainEvent): string {
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
