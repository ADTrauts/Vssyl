/**
 * Canonical learning proposal and event-type contract (Phase 2A).
 * @see docs/plans/AI_PLATFORM_MATURITY_PLAN.md § Phase 2A
 */

export const LEARNING_EVENT_TYPES = {
  INTERACTION: 'interaction',
  FEEDBACK: 'feedback',
  CORRECTION: 'correction',
  PREFERENCE_UPDATE: 'preference_update',
  REINFORCEMENT: 'reinforcement',
  PATTERN_RECOGNITION: 'pattern_recognition',
  /** Canonical derived pattern row type (replaces legacy `pattern`). */
  PATTERN_DISCOVERY: 'pattern_discovery',
  PREDICTION: 'prediction',
  INSIGHT: 'insight',
  /** Phase 2B — auto-recorded behavioral signals (not shown in Learning review queue). */
  BEHAVIORAL_SIGNAL: 'behavioral_signal',
} as const;

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[keyof typeof LEARNING_EVENT_TYPES];

/** Legacy rows persisted before 2A normalization. */
export const LEGACY_DERIVED_PATTERN_EVENT_TYPE = 'pattern';

export const PATTERN_DERIVED_EVENT_TYPES = [
  LEARNING_EVENT_TYPES.PATTERN_DISCOVERY,
  LEGACY_DERIVED_PATTERN_EVENT_TYPE,
] as const;

export type LearningProposalTarget = 'preference' | 'memory' | 'pattern';

export type LearningProposalStatus = 'pending' | 'validated' | 'dismissed' | 'applied';

export interface LearningProposal {
  id: string;
  source: string;
  signalType: string;
  target: LearningProposalTarget;
  payload: Record<string, unknown>;
  confidence: number;
  status: LearningProposalStatus;
}

/** Event types a user can approve or dismiss in the Learning tab. */
export const HUMAN_REVIEWABLE_EVENT_TYPES: readonly string[] = [
  LEARNING_EVENT_TYPES.CORRECTION,
  LEARNING_EVENT_TYPES.FEEDBACK,
  LEARNING_EVENT_TYPES.PREFERENCE_UPDATE,
  LEARNING_EVENT_TYPES.REINFORCEMENT,
  LEARNING_EVENT_TYPES.PATTERN_RECOGNITION,
];

/** System-generated rows — never shown in personal review queue. */
export const SYSTEM_DERIVED_EVENT_TYPES: readonly string[] = [
  LEARNING_EVENT_TYPES.INTERACTION,
  LEGACY_DERIVED_PATTERN_EVENT_TYPE,
  LEARNING_EVENT_TYPES.PATTERN_DISCOVERY,
  LEARNING_EVENT_TYPES.PREDICTION,
  LEARNING_EVENT_TYPES.INSIGHT,
  LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
];

export function normalizeLearningEventType(eventType: string): string {
  if (eventType === LEGACY_DERIVED_PATTERN_EVENT_TYPE) {
    return LEARNING_EVENT_TYPES.PATTERN_DISCOVERY;
  }
  return eventType;
}

export function isHumanReviewableEventType(eventType: string): boolean {
  return HUMAN_REVIEWABLE_EVENT_TYPES.includes(eventType);
}

export function isDerivedSystemEventType(eventType: string): boolean {
  return SYSTEM_DERIVED_EVENT_TYPES.includes(eventType);
}

export function learningProposalFromReviewableEvent(input: {
  id: string;
  eventType: string;
  context: string;
  sourceModule?: string | null;
  newBehavior: string;
  confidence: number;
  validated: boolean;
  applied: boolean;
  artifact?: unknown;
}): LearningProposal {
  const payload =
    input.artifact && typeof input.artifact === 'object' && !Array.isArray(input.artifact)
      ? (input.artifact as Record<string, unknown>)
      : { summary: input.newBehavior };

  let target: LearningProposalTarget = 'preference';
  if (input.eventType === LEARNING_EVENT_TYPES.CORRECTION) {
    target = 'memory';
  } else if (
    input.eventType === LEARNING_EVENT_TYPES.PATTERN_RECOGNITION ||
    normalizeLearningEventType(input.eventType) === LEARNING_EVENT_TYPES.PATTERN_DISCOVERY
  ) {
    target = 'pattern';
  }

  let status: LearningProposalStatus = 'pending';
  if (input.validated && input.applied) status = 'applied';
  else if (input.validated && !input.applied) status = 'dismissed';
  else if (input.applied) status = 'applied';

  return {
    id: input.id,
    source: input.sourceModule ?? input.context,
    signalType: input.eventType,
    target,
    payload,
    confidence: input.confidence,
    status,
  };
}
