/**
 * Determines structured JSON response mode: conversational vs enterprise deliverables.
 * P3: also surfaces responseContract + requiresAuthoritativeContext (independent axes).
 */

import type { AIResponseDensity, AIResponseMode } from '../types/structuredResponse';
import { detectConversationObjective } from '../conversation/conversationObjective';
import {
  CONVERSATION_CURIOSITY,
  CONVERSATION_EXPLORATION,
  CONVERSATION_FOLLOWUP,
  CONVERSATION_UNCERTAINTY,
  ENTERPRISE_RECOMMENDATION,
  inferQueryIntent,
  queryIntentToStructuredMode,
} from './queryIntent';
import { shouldUseInformationalAnswerEscape } from './informationalAnswerEscape';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from './requiresAuthoritativeContext';
import {
  resolveResponseContract,
  type AIResponseContract,
} from './responseContract';

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
  /** Optional request context for P2/P3 routing. */
  fileIds?: unknown;
  businessId?: string | null;
  currentModule?: string | null;
  hasAttachedFiles?: boolean;
}

export interface InferStructuredResponseModeResult {
  mode: AIResponseMode;
  responseDensity: AIResponseDensity;
  /** True when residual `answer` was remapped to informational conversation (P2). */
  informationalAnswerEscape?: boolean;
  /** P3: needs Vssyl/user/workspace/live truth (independent of format). */
  requiresAuthoritativeContext?: boolean;
  /** P3: format/deliverable contract (independent of grounding). */
  responseContract?: AIResponseContract;
  /** P3: mutation/action ambition (not grounded factual read). */
  isActionRequest?: boolean;
  /**
   * F-GUARD: thread continuation signal from Service (conversationHistory.length > 0).
   * Future C3 must not skip ContextProvider orchestration when true.
   * Not a product continuity / source-inheritance flag.
   */
  isFollowUp?: boolean;
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

function attachRoutingAxes(
  mode: AIResponseMode,
  input: InferStructuredResponseModeInput,
  extras?: { informationalAnswerEscape?: boolean }
): InferStructuredResponseModeResult {
  const authInput = {
    query: input.query || '',
    fileIds: input.fileIds,
    businessId: input.businessId,
    currentModule: input.currentModule,
    hasAttachedFiles: input.hasAttachedFiles,
  };
  const isActionRequest = isActionMutationRequest(authInput.query);
  const needsAuth = requiresAuthoritativeContext(authInput);
  const informationalAnswerEscape = extras?.informationalAnswerEscape === true;
  const responseContract = resolveResponseContract({
    structuredResponseMode: mode,
    informationalAnswerEscape,
    requiresAuthoritativeContext: needsAuth,
    isActionRequest,
  });

  return {
    mode,
    responseDensity: densityForMode(mode),
    ...(informationalAnswerEscape ? { informationalAnswerEscape: true } : {}),
    requiresAuthoritativeContext: needsAuth,
    responseContract,
    isActionRequest,
    ...(input.isFollowUp === true ? { isFollowUp: true } : {}),
  };
}

/**
 * Authoritative structured response mode for provider prompts and normalization.
 */
export function inferStructuredResponseMode(
  input: InferStructuredResponseModeInput
): InferStructuredResponseModeResult {
  const explicit = normalizeExplicitMode(input.explicitMode);
  if (explicit) {
    return attachRoutingAxes(explicit, input);
  }

  const q = input.query || '';

  if (DEBUG_HINTS.test(q)) {
    return attachRoutingAxes('analysis', input);
  }

  if (PLANNING_HINTS.test(q)) {
    return attachRoutingAxes('action_plan', input);
  }

  const tone = (input.toneMode || '').trim().toLowerCase();
  if (tone === 'executive_summary') {
    return attachRoutingAxes('summary', input);
  }
  if (tone === 'analytical') {
    return attachRoutingAxes('analysis', input);
  }
  if (tone === 'planning') {
    return attachRoutingAxes('action_plan', input);
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

  // P2: residual answer → neutral informational conversation when no grounding/action signals.
  if (mode === 'answer') {
    const conversationObjective = detectConversationObjective(q);
    const authInput = {
      query: q,
      fileIds: input.fileIds,
      businessId: input.businessId,
      currentModule: input.currentModule,
      hasAttachedFiles: input.hasAttachedFiles,
    };
    if (
      shouldUseInformationalAnswerEscape({
        query: q,
        provisionalMode: mode,
        conversationObjective,
        fileIds: input.fileIds,
        businessId: input.businessId,
        currentModule: input.currentModule,
        hasAttachedFiles: input.hasAttachedFiles,
      })
    ) {
      return attachRoutingAxes('conversation', input, { informationalAnswerEscape: true });
    }

    // R1: ordinary decide/recommend advice uses conversation contract — not residual enterprise.
    // Explicit comparison/analysis/recommendation modes and ENTERPRISE_RECOMMENDATION remain above.
    // Grounded decide (attachments/auth) stays answer → grounded_answer.
    // Execute residual answers keep prior enterprise path for create/assessment deliverables.
    if (
      conversationObjective === 'decide' &&
      !isActionMutationRequest(q) &&
      !requiresAuthoritativeContext(authInput)
    ) {
      return attachRoutingAxes('conversation', input);
    }
  }

  return attachRoutingAxes(mode, input);
}
