/**
 * Determines structured JSON response mode: conversational vs enterprise deliverables.
 */

import type { AIResponseDensity, AIResponseMode } from '../types/structuredResponse';
import {
  CONVERSATION_CURIOSITY,
  CONVERSATION_EXPLORATION,
  CONVERSATION_FOLLOWUP,
  CONVERSATION_UNCERTAINTY,
  ENTERPRISE_RECOMMENDATION,
  inferQueryIntent,
  queryIntentToStructuredMode,
} from './queryIntent';

const STRUCTURED_MODES = new Set<string>([
  'conversation',
  'answer',
  'summary',
  'analysis',
  'recommendation',
  'action_plan',
  'comparison',
  'status_update',
  'error',
]);

const DEBUG_HINTS = /\b(why did the ai answer|show reasoning|debug mode|internal details)\b/i;
const PLANNING_HINTS = /\b(next steps for implementation|how should we proceed|rollout plan)\b/i;

export interface InferStructuredResponseModeInput {
  query: string;
  /** Caller override (LifeTwin context or API). */
  explicitMode?: string;
  /** Tone mode from responseMode.ts (conversational, analytical, …). */
  toneMode?: string;
  /** Legacy assembled intent hint. */
  assembledIntent?: string;
  /** Short follow-up in an ongoing thread. */
  isFollowUp?: boolean;
}

export interface InferStructuredResponseModeResult {
  mode: AIResponseMode;
  responseDensity: AIResponseDensity;
}

function densityForMode(mode: AIResponseMode): AIResponseDensity {
  if (mode === 'conversation' || mode === 'answer') return 'light';
  if (mode === 'summary' || mode === 'status_update') return 'balanced';
  return 'deep';
}

function normalizeExplicitMode(explicitMode?: string): AIResponseMode | undefined {
  const m = (explicitMode || '').trim().toLowerCase();
  if (!m) return undefined;
  if (m === 'conversational' || m === 'natural_chat' || m === 'casual_advisor') return 'conversation';
  if (STRUCTURED_MODES.has(m)) return m as AIResponseMode;
  return undefined;
}

/**
 * Authoritative structured response mode for provider prompts and normalization.
 */
export function inferStructuredResponseMode(
  input: InferStructuredResponseModeInput
): InferStructuredResponseModeResult {
  const explicit = normalizeExplicitMode(input.explicitMode);
  if (explicit) {
    return { mode: explicit, responseDensity: densityForMode(explicit) };
  }

  const q = input.query || '';

  if (DEBUG_HINTS.test(q)) {
    return { mode: 'analysis', responseDensity: 'deep' };
  }

  if (PLANNING_HINTS.test(q)) {
    return { mode: 'action_plan', responseDensity: 'deep' };
  }

  const tone = (input.toneMode || '').trim().toLowerCase();
  if (tone === 'executive_summary') {
    return { mode: 'summary', responseDensity: 'balanced' };
  }
  if (tone === 'analytical') {
    return { mode: 'analysis', responseDensity: 'deep' };
  }
  if (tone === 'planning') {
    return { mode: 'action_plan', responseDensity: 'deep' };
  }

  const intentFromQuery = inferQueryIntent(q);
  let mode = queryIntentToStructuredMode(intentFromQuery);

  if (input.isFollowUp && mode === 'answer' && CONVERSATION_FOLLOWUP.test(q)) {
    mode = 'conversation';
  }

  if (tone === 'emotional_support' && mode !== 'analysis' && mode !== 'action_plan' && mode !== 'comparison') {
    mode = 'conversation';
  }

  if (tone === 'conversational' && (mode === 'answer' || mode === 'recommendation')) {
    const hasConversationSignals =
      intentFromQuery === 'conversation' ||
      CONVERSATION_UNCERTAINTY.test(q) ||
      CONVERSATION_CURIOSITY.test(q) ||
      CONVERSATION_EXPLORATION.test(q);
    if (hasConversationSignals) {
      mode = 'conversation';
    }
  }

  const assembled = (input.assembledIntent || '').trim().toLowerCase();
  if (assembled === 'conversation') {
    mode = 'conversation';
  } else if (
    assembled &&
    STRUCTURED_MODES.has(assembled) &&
    mode === 'answer' &&
    assembled !== 'answer'
  ) {
    const assembledMode = assembled as AIResponseMode;
    if (assembledMode !== 'recommendation' || ENTERPRISE_RECOMMENDATION.test(q)) {
      mode = assembledMode;
    }
  }

  if (mode === 'recommendation' && !ENTERPRISE_RECOMMENDATION.test(q)) {
    mode = 'conversation';
  }

  return { mode, responseDensity: densityForMode(mode) };
}
