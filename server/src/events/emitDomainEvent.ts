import { Prisma } from '@prisma/client';
import { publishDomainEvent } from './domainEventBus';
import { sanitizeDomainEventMetadata } from './domainEventRegistry';
import type { DomainEvent, DomainEventEmitInput } from './types';

function newEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function cloneMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta || Object.keys(meta).length === 0) return {};
  return JSON.parse(JSON.stringify(meta)) as Record<string, unknown>;
}

/**
 * Build and publish a domain event on the in-process bus after a successful mutation.
 * Subscribers run synchronously from this call; keep subscriber work non-blocking or fast.
 */
export function emitDomainEvent(input: DomainEventEmitInput): DomainEvent {
  const metadata = sanitizeDomainEventMetadata(input.type, cloneMetadata(input.metadata));
  const event: DomainEvent = {
    id: newEventId(),
    type: input.type,
    actorUserId: input.actorUserId,
    dashboardId: input.dashboardId,
    businessId: input.businessId,
    householdId: input.householdId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    metadata,
    createdAt: new Date().toISOString(),
  };

  publishDomainEvent(event);
  return event;
}

/** Serialize for Prisma JSON columns (metadata is already plain JSON). */
export function domainEventToJsonValue(event: DomainEvent): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue;
}
