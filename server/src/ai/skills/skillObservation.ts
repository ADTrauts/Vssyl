/**
 * Phase 8 — Skill observation helpers (reuse emitTwinObservation; fail-open).
 */
import type { AIObservationEventType } from 'vssyl-shared';
import { emitTwinObservation } from '../observation/runtimeObservation';

export function emitSkillObservation(params: {
  requestId: string;
  userId: string;
  conversationId?: string;
  businessId?: string | null;
  type: Extract<
    AIObservationEventType,
    | 'SkillSelected'
    | 'SkillSelectionFailed'
    | 'SkillPlanCreated'
    | 'SkillExecutionStarted'
    | 'SkillContextResolved'
    | 'SkillProviderCompleted'
    | 'SkillOutputValidated'
    | 'SkillToolProposed'
    | 'SkillExecutionCompleted'
    | 'SkillExecutionFailed'
  >;
  metadata?: Record<string, unknown>;
}): void {
  emitTwinObservation({
    requestId: params.requestId,
    userId: params.userId,
    conversationId: params.conversationId,
    businessId: params.businessId,
    type: params.type,
    surface: 'SKILL',
    sourceComponent: 'SkillRunner',
    idempotencyKey: `${params.type}:${String(params.metadata?.skillKey ?? 'unknown')}`,
    metadata: params.metadata,
  });
}
