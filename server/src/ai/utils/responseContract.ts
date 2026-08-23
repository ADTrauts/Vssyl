/**
 * P3: response contract independent of grounding / context budget.
 *
 * - conversation: general / P2 informational
 * - grounded_answer: thin natural answer + optional evidence (not enterprise report)
 * - enterprise: ENTERPRISE_V2 deliverables
 */

import type { AIResponseMode } from '../types/structuredResponse';

export type AIResponseContract = 'conversation' | 'grounded_answer' | 'enterprise';

const ENTERPRISE_MODES = new Set<AIResponseMode>([
  'summary',
  'analysis',
  'recommendation',
  'action_plan',
  'comparison',
  'status_update',
]);

export interface ResolveResponseContractInput {
  structuredResponseMode: AIResponseMode;
  /** P2 informational remapping. */
  informationalAnswerEscape?: boolean;
  requiresAuthoritativeContext?: boolean;
  isActionRequest?: boolean;
}

/**
 * Format/deliverable contract — not a grounding flag and not a context budget.
 */
export function resolveResponseContract(input: ResolveResponseContractInput): AIResponseContract {
  const mode = input.structuredResponseMode;

  if (mode === 'conversation' || input.informationalAnswerEscape) {
    return 'conversation';
  }

  if (ENTERPRISE_MODES.has(mode)) {
    return 'enterprise';
  }

  // Residual answer
  if (input.isActionRequest) {
    // Actions keep prior enterprise answer wiring (tools/permissions unchanged in P3).
    return 'enterprise';
  }

  if (input.requiresAuthoritativeContext && mode === 'answer') {
    return 'grounded_answer';
  }

  if (mode === 'answer') {
    // Ambiguous residual answer without authoritative signal — keep prior enterprise path.
    return 'enterprise';
  }

  return 'enterprise';
}
