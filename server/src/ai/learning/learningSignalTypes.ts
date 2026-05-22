/**
 * Behavioral learning signal types (Phase 2B).
 */

export const LEARNING_SIGNAL_TYPES = {
  SUGGESTION_ACCEPTED: 'suggestion_accepted',
  SUGGESTION_DISMISSED: 'suggestion_dismissed',
  SUGGESTION_IGNORED: 'suggestion_ignored',
  FEEDBACK_POSITIVE: 'feedback_positive',
  FEEDBACK_NEGATIVE: 'feedback_negative',
  RESPONSE_REGENERATE: 'response_regenerate',
  EDIT_AND_RESEND: 'edit_and_resend',
  MODULE_USAGE: 'module_usage',
  REPEATED_CORRECTION: 'repeated_correction',
  DOMAIN_EVENT: 'domain_event',
} as const;

export type LearningSignalType = (typeof LEARNING_SIGNAL_TYPES)[keyof typeof LEARNING_SIGNAL_TYPES];

const SIGNAL_TYPE_SET = new Set<string>(Object.values(LEARNING_SIGNAL_TYPES));

export function isLearningSignalType(value: string): value is LearningSignalType {
  return SIGNAL_TYPE_SET.has(value);
}

export interface LearningSignalPayload {
  signalType: LearningSignalType;
  userId: string;
  dashboardId?: string | null;
  businessId?: string | null;
  sourceModule?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  confidence: number;
  recordedAt: string;
}

export interface RecordLearningSignalInput {
  userId: string;
  signalType: LearningSignalType;
  dashboardId?: string | null;
  businessId?: string | null;
  sourceModule?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
}

export function defaultSummaryForSignalType(
  signalType: LearningSignalType,
  metadata?: Record<string, unknown>
): string {
  switch (signalType) {
    case LEARNING_SIGNAL_TYPES.SUGGESTION_ACCEPTED:
      return `Accepted AI suggestion${metadata?.suggestionTitle ? `: ${String(metadata.suggestionTitle)}` : ''}`;
    case LEARNING_SIGNAL_TYPES.SUGGESTION_DISMISSED:
      return `Dismissed AI suggestion${metadata?.suggestionTitle ? `: ${String(metadata.suggestionTitle)}` : ''}`;
    case LEARNING_SIGNAL_TYPES.SUGGESTION_IGNORED:
      return 'Ignored AI suggestion';
    case LEARNING_SIGNAL_TYPES.FEEDBACK_POSITIVE:
      return 'Positive feedback on AI reply';
    case LEARNING_SIGNAL_TYPES.FEEDBACK_NEGATIVE:
      return 'Negative feedback on AI reply';
    case LEARNING_SIGNAL_TYPES.RESPONSE_REGENERATE:
      return 'Regenerated AI reply';
    case LEARNING_SIGNAL_TYPES.EDIT_AND_RESEND:
      return 'Edited and resent message after AI reply';
    case LEARNING_SIGNAL_TYPES.MODULE_USAGE:
      return 'Modules referenced in AI query';
    case LEARNING_SIGNAL_TYPES.REPEATED_CORRECTION:
      return 'Repeated correction on similar intent';
    case LEARNING_SIGNAL_TYPES.DOMAIN_EVENT:
      return metadata?.domainEventType
        ? `Platform event observed: ${String(metadata.domainEventType)}`
        : 'Platform domain event observed';
    default:
      return 'Behavioral learning signal';
  }
}

export function extractTenantScopeFromRequestBody(body: unknown): {
  dashboardId?: string;
  businessId?: string;
} {
  if (!body || typeof body !== 'object') return {};
  const o = body as Record<string, unknown>;
  const dashboardId = typeof o.dashboardId === 'string' ? o.dashboardId.trim() : undefined;
  const businessId = typeof o.businessId === 'string' ? o.businessId.trim() : undefined;
  return {
    ...(dashboardId ? { dashboardId } : {}),
    ...(businessId ? { businessId } : {}),
  };
}

export function collectModulesReferenced(input: {
  modulesFocused?: string[];
  contextRetrieved?: Array<{ source?: string }>;
  currentModule?: string;
}): string[] {
  const modules = new Set<string>();
  for (const moduleId of input.modulesFocused ?? []) {
    if (moduleId.trim()) modules.add(moduleId.trim());
  }
  if (input.currentModule?.trim()) modules.add(input.currentModule.trim());
  for (const row of input.contextRetrieved ?? []) {
    if (row.source?.trim()) modules.add(row.source.trim());
  }
  return [...modules];
}
