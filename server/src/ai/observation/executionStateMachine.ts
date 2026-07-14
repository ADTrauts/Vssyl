/**
 * Phase 5B — Observation-side execution lifecycle transitions.
 */
import type { AIObservationEventType, AIObservationExecutionState } from 'vssyl-shared';

const TERMINAL: ReadonlySet<AIObservationExecutionState> = new Set([
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

const SOFT_TERMINAL: ReadonlySet<AIObservationExecutionState> = new Set(['PARTIAL']);

const ALLOWED: Record<AIObservationExecutionState, ReadonlySet<AIObservationExecutionState>> = {
  STARTED: new Set([
    'CONTEXT_BUILDING',
    'PROVIDER_RUNNING',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'PARTIAL',
  ]),
  CONTEXT_BUILDING: new Set([
    'RETRIEVING',
    'GROUNDING',
    'PROVIDER_RUNNING',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
    'PARTIAL',
  ]),
  RETRIEVING: new Set([
    'GROUNDING',
    'PROVIDER_RUNNING',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
    'PARTIAL',
  ]),
  GROUNDING: new Set(['PROVIDER_RUNNING', 'RESPONDING', 'COMPLETED', 'FAILED', 'PARTIAL']),
  PROVIDER_RUNNING: new Set([
    'AWAITING_TOOL',
    'AWAITING_APPROVAL',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
    'PARTIAL',
  ]),
  AWAITING_TOOL: new Set([
    'AWAITING_APPROVAL',
    'PROVIDER_RUNNING',
    'EXECUTING_ACTION',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
  ]),
  AWAITING_APPROVAL: new Set([
    'EXECUTING_ACTION',
    'RESPONDING',
    'FAILED',
    'CANCELLED',
    'COMPLETED',
    'PARTIAL',
  ]),
  EXECUTING_ACTION: new Set([
    'AWAITING_APPROVAL',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
    'PARTIAL',
  ]),
  RESPONDING: new Set(['COMPLETED', 'FAILED', 'PARTIAL']),
  COMPLETED: new Set(),
  FAILED: new Set(),
  CANCELLED: new Set(),
  PARTIAL: new Set(['COMPLETED', 'FAILED']),
};

export function isTerminalObservationState(state: AIObservationExecutionState): boolean {
  return TERMINAL.has(state);
}

export function isSoftTerminalObservationState(state: AIObservationExecutionState): boolean {
  return SOFT_TERMINAL.has(state);
}

export function canTransitionObservationState(
  from: AIObservationExecutionState,
  to: AIObservationExecutionState
): boolean {
  if (from === to) return true;
  if (TERMINAL.has(from)) return false;
  if (SOFT_TERMINAL.has(from) && !TERMINAL.has(to) && to !== 'PARTIAL') return false;
  return ALLOWED[from]?.has(to) ?? false;
}

/** Apply transition; returns next state (unchanged if illegal). */
export function applyObservationStateTransition(
  current: AIObservationExecutionState,
  next: AIObservationExecutionState
): { state: AIObservationExecutionState; applied: boolean } {
  if (current === next) return { state: current, applied: true };
  if (!canTransitionObservationState(current, next)) {
    return { state: current, applied: false };
  }
  return { state: next, applied: true };
}

export function stateHintFromEventType(
  type: AIObservationEventType
): AIObservationExecutionState | null {
  switch (type) {
    case 'ExecutionStarted':
      return 'STARTED';
    case 'ContextSelectionPlanned':
    case 'ContextProviderStarted':
    case 'ContextProviderCompleted':
    case 'ContextProviderFailed':
    case 'ContextBuilt':
      return 'CONTEXT_BUILDING';
    case 'RetrievalStarted':
    case 'RetrievalCompleted':
    case 'RetrievalFailed':
    case 'EvidenceBundleBuilt':
    case 'KnowledgeRetrieved':
      return 'RETRIEVING';
    case 'GroundingStarted':
    case 'GroundingEvaluated':
    case 'EnforcementApplied':
      return 'GROUNDING';
    case 'ProviderSelected':
    case 'ProviderCallStarted':
    case 'ProviderCallCompleted':
    case 'ProviderCallFailed':
    case 'ProviderFallbackStarted':
    case 'ProviderFallbackCompleted':
    case 'ProviderCompleted':
      return 'PROVIDER_RUNNING';
    case 'ToolProposed':
    case 'ToolAuthorizationEvaluated':
      return 'AWAITING_TOOL';
    case 'ApprovalRequested':
    case 'ApprovalRejected':
    case 'ApprovalExpired':
      return 'AWAITING_APPROVAL';
    case 'ApprovalGranted':
    case 'ActionExecutionStarted':
    case 'ActionExecutionCompleted':
    case 'ActionExecutionFailed':
    case 'ActionExecutionReplayed':
      return 'EXECUTING_ACTION';
    case 'ResponseStarted':
      return 'RESPONDING';
    case 'ResponseReturned':
    case 'ExecutionCompleted':
      return 'COMPLETED';
    case 'ExecutionFailed':
      return 'FAILED';
    case 'ExecutionCancelled':
      return 'CANCELLED';
    default:
      return null;
  }
}

export function parseObservationState(value: unknown): AIObservationExecutionState {
  const s = typeof value === 'string' ? value : '';
  const allowed: AIObservationExecutionState[] = [
    'STARTED',
    'CONTEXT_BUILDING',
    'RETRIEVING',
    'GROUNDING',
    'PROVIDER_RUNNING',
    'AWAITING_TOOL',
    'AWAITING_APPROVAL',
    'EXECUTING_ACTION',
    'RESPONDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'PARTIAL',
  ];
  return (allowed.includes(s as AIObservationExecutionState)
    ? s
    : 'STARTED') as AIObservationExecutionState;
}
