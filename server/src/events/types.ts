/**
 * Normalized domain event envelope for in-process fan-out (activity, sockets, future consumers).
 * Emitted only after successful mutations at explicit call sites — not from global middleware.
 */
export interface DomainEvent {
  id: string;
  type: string;
  actorUserId: string;
  /** Present when the action is scoped to a dashboard; omit for global user-level actions. */
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Input for emitDomainEvent — id and createdAt are assigned by the emitter. */
export interface DomainEventEmitInput {
  type: string;
  actorUserId: string;
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}
