/**
 * Phase 6 — Evaluation workflow state machine (extends Phase 4 statuses).
 * Corrections remain proposals; nothing here mutates Twin runtime.
 */
import type { AIEvaluationWorkflowStatus } from 'vssyl-shared';
import { normalizeEvaluationWorkflowStatus } from 'vssyl-shared';

const TERMINAL: ReadonlySet<AIEvaluationWorkflowStatus> = new Set([
  'CLOSED',
  'RESOLVED',
  'REJECTED',
  'ARCHIVED',
  'DUPLICATE',
  'CANCELLED',
  'NOT_REPRODUCIBLE',
]);

/** Canonical allowed transitions on the normalized lifecycle vocabulary. */
const ALLOWED: Partial<Record<AIEvaluationWorkflowStatus, ReadonlySet<AIEvaluationWorkflowStatus>>> = {
  NEW: new Set([
    'TRIAGED',
    'ASSIGNED',
    'UNDER_REVIEW',
    'CORRECTION_CREATED',
    'DUPLICATE',
    'CANCELLED',
    'DEFERRED',
    'REJECTED',
    'NEEDS_INFORMATION',
  ]),
  PENDING: new Set([
    'NEW',
    'TRIAGED',
    'ASSIGNED',
    'UNDER_REVIEW',
    'CORRECTION_CREATED',
    'DUPLICATE',
    'CANCELLED',
    'DEFERRED',
    'REJECTED',
    'NEEDS_INFORMATION',
  ]),
  TRIAGED: new Set([
    'UNDER_REVIEW',
    'ASSIGNED',
    'REVIEWED',
    'DUPLICATE',
    'CANCELLED',
    'DEFERRED',
    'NEEDS_INFORMATION',
  ]),
  ASSIGNED: new Set([
    'UNDER_REVIEW',
    'REVIEWED',
    'TRIAGED',
    'DUPLICATE',
    'CANCELLED',
    'DEFERRED',
    'NEEDS_INFORMATION',
  ]),
  UNDER_REVIEW: new Set([
    'ROOT_CAUSE_CONFIRMED',
    'REVIEWED',
    'NEEDS_INFORMATION',
    'NOT_REPRODUCIBLE',
    'DUPLICATE',
    'CANCELLED',
    'DEFERRED',
    'REJECTED',
    'CLOSED',
    'VERIFIED',
  ]),
  REVIEWED: new Set([
    'ROOT_CAUSE_CONFIRMED',
    'UNDER_REVIEW',
    'CORRECTION_CREATED',
    'DUPLICATE',
    'CANCELLED',
    'DEFERRED',
    'REJECTED',
  ]),
  ROOT_CAUSE_CONFIRMED: new Set([
    'CORRECTION_CREATED',
    'UNDER_REVIEW',
    'DEFERRED',
    'CANCELLED',
    'REJECTED',
  ]),
  CORRECTION_CREATED: new Set([
    'CORRECTION_APPROVED',
    'UNDER_REVIEW',
    'DEFERRED',
    'CANCELLED',
    'REJECTED',
  ]),
  CORRECTION_APPROVED: new Set([
    'IMPLEMENTED',
    'REGRESSION_CREATED',
    'DEFERRED',
    'CANCELLED',
  ]),
  IMPLEMENTED: new Set(['REGRESSION_CREATED', 'VERIFIED', 'CLOSED', 'RESOLVED']),
  REGRESSION_CREATED: new Set(['IMPLEMENTED', 'VERIFIED', 'CLOSED', 'RESOLVED']),
  VERIFIED: new Set(['CLOSED', 'RESOLVED', 'ARCHIVED']),
  DEFERRED: new Set(['TRIAGED', 'UNDER_REVIEW', 'CANCELLED', 'CLOSED']),
  NEEDS_INFORMATION: new Set(['UNDER_REVIEW', 'TRIAGED', 'CANCELLED', 'DEFERRED']),
  RESOLVED: new Set(['ARCHIVED', 'CLOSED']),
  CLOSED: new Set(['ARCHIVED']),
  REJECTED: new Set(['ARCHIVED']),
  DUPLICATE: new Set(['ARCHIVED', 'CLOSED']),
  CANCELLED: new Set(['ARCHIVED']),
  NOT_REPRODUCIBLE: new Set(['ARCHIVED', 'CLOSED', 'UNDER_REVIEW']),
  ARCHIVED: new Set(),
};

export function canTransitionEvaluationStatus(
  from: string,
  to: string
): boolean {
  if (from === to) return true;
  const fromN = normalizeEvaluationWorkflowStatus(from);
  const toN = normalizeEvaluationWorkflowStatus(to);
  if (TERMINAL.has(fromN) && toN !== 'ARCHIVED' && toN !== 'CLOSED') {
    // Terminal statuses only advance via ALLOWED (typically → ARCHIVED/CLOSED).
    return false;
  }
  const allowed = ALLOWED[fromN];
  if (!allowed) {
    // Unknown legacy: allow forward to any non-regressive Phase 6 state
    return true;
  }
  // Also allow transitioning using raw Phase 4 labels that map equivalently
  if (allowed.has(to as AIEvaluationWorkflowStatus)) return true;
  if (allowed.has(toN)) return true;
  return false;
}

export function assertEvaluationTransition(
  from: string,
  to: string
): { ok: true } | { ok: false; error: string } {
  if (canTransitionEvaluationStatus(from, to)) return { ok: true };
  return {
    ok: false,
    error: `Illegal evaluation workflow transition: ${from} → ${to}`,
  };
}

export function isTerminalEvaluationStatus(status: string): boolean {
  return TERMINAL.has(normalizeEvaluationWorkflowStatus(status));
}
