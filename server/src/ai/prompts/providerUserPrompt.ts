/**
 * Provider user-message builders (conversation vs grounded factual vs enterprise).
 */

import type { AIAssembledContext } from '../context/AIContextAssembler';
import type { ConversationHistoryItem } from '../core/DigitalLifeTwinCore';
import type { ConversationThreadHints } from '../utils/conversationContinuity';
import { formatConversationTranscript } from '../utils/conversationContinuity';
import { CONVERSATION_MOMENTUM_BLOCK } from './conversationMomentum';
import {
  buildConversationReasoningPromptBlock,
  shouldSuppressRecommendationRichness,
} from '../conversation/conversationReasoningLayer';
import type { ConversationReasoningResult } from '../conversation/conversationTypes';
import {
  buildRecommendationFramingHints,
} from './conversationRecommendationRichness';
import {
  inferConversationCoachingProfile,
  type ConversationCoachingProfile,
} from './conversationCoachingProfile';
import { isConversationStructuredMode } from './structuredResponseFormat';
import type { AIResponseContract } from '../utils/responseContract';
import {
  REQUIRED_SOURCE_CLAIM_BOUNDARY_INSTRUCTION,
  hasRequiredSourceFailures,
  normalizeRequiredSourceFailures,
} from '../utils/requiredSourceClaimBoundary';

export function resolveResponseContractFromProviderData(
  data?: Record<string, unknown>
): AIResponseContract {
  const explicit = data?.responseContract;
  if (explicit === 'grounded_answer' || explicit === 'conversation' || explicit === 'enterprise') {
    return explicit;
  }
  if (isConversationProviderData(data)) return 'conversation';
  return 'enterprise';
}

export function isConversationProviderData(data?: Record<string, unknown>): boolean {
  if (!data) return false;
  if (data.responseContract === 'conversation') return true;
  if (data.responseContract === 'grounded_answer' || data.responseContract === 'enterprise') {
    return false;
  }
  if (isConversationStructuredMode(data.structuredResponseMode as string | undefined)) return true;
  return (data.promptProfile as string) === 'conversation';
}

export function isGroundedAnswerProviderData(data?: Record<string, unknown>): boolean {
  return resolveResponseContractFromProviderData(data) === 'grounded_answer';
}

function resolveRequiredSourceFailuresForPrompt(data: Record<string, unknown>): string[] {
  return normalizeRequiredSourceFailures(data.requiredSourceFailures);
}

function claimBoundaryFields(failures: string[]): Record<string, unknown> {
  if (!hasRequiredSourceFailures(failures)) return {};
  return {
    requiredSourceFailures: failures,
    claimBoundary: 'required_source_failed',
  };
}

function slimAssembledContextForConversation(
  assembled: AIAssembledContext,
  failures: string[]
): Record<string, unknown> {
  return {
    scope: assembled.scope,
    intent: assembled.intent,
    structuredResponseMode: assembled.structuredResponseMode,
    contextBlocks: (assembled.contextBlocks || []).slice(0, 6).map((b) => ({
      title: b.title,
      sourceType: b.sourceType,
      content: b.content,
      relevanceScore: b.relevanceScore,
    })),
    ...claimBoundaryFields(failures),
  };
}

/** Medium payload for grounded facts — keep blocks/evidence, omit enterprise report noise. */
function slimAssembledContextForGrounded(
  assembled: AIAssembledContext,
  failures: string[]
): Record<string, unknown> {
  return {
    scope: assembled.scope,
    intent: assembled.intent,
    structuredResponseMode: assembled.structuredResponseMode,
    usedModules: assembled.usedModules,
    missingContext: assembled.missingContext,
    evidence: assembled.evidence,
    contextBlocks: (assembled.contextBlocks || []).slice(0, 10).map((b) => ({
      title: b.title,
      sourceType: b.sourceType,
      content: b.content,
      relevanceScore: b.relevanceScore,
      priority: b.priority,
    })),
    ...claimBoundaryFields(failures),
  };
}

function buildRequiredSourceClaimBoundarySection(failures: string[]): string {
  if (!hasRequiredSourceFailures(failures)) return '';
  return `${REQUIRED_SOURCE_CLAIM_BOUNDARY_INSTRUCTION}\nFailed required sources: ${failures.join(', ')}.\n\n`;
}

function resolveCoachingProfile(data: Record<string, unknown>, userQuery: string): ConversationCoachingProfile {
  const reasoning = data.conversationReasoning as ConversationReasoningResult | undefined;
  const history = data.conversationHistory as ConversationHistoryItem[] | undefined;
  const profile = inferConversationCoachingProfile({
    userQuery,
    conversationObjective: reasoning?.conversationObjective,
    threadHints: data.conversationThread as ConversationThreadHints | undefined,
    hasConversationHistory: Array.isArray(history) && history.length > 0,
  });

  if (reasoning && shouldSuppressRecommendationRichness(reasoning)) {
    return {
      style: 'informational',
      includeRecommendationRichness: false,
      includeRecommendationFraming: false,
    };
  }

  return profile;
}

function buildThreadSection(data: Record<string, unknown>): string {
  const hints = data.conversationThread as ConversationThreadHints | undefined;
  const history = data.conversationHistory as ConversationHistoryItem[] | undefined;

  const transcript =
    Array.isArray(history) && history.length > 0
      ? formatConversationTranscript(history, { maxMessages: 10, maxCharsPerMessage: 1200 })
      : '';

  if (!transcript && !hints?.isFollowUp) return '';

  const parts: string[] = ['CONVERSATION THREAD (read carefully — continue this dialogue):'];

  if (hints?.threadSummary) {
    parts.push(`Thread summary: ${hints.threadSummary}`);
  }
  if (hints?.narrowingConstraints?.length) {
    parts.push(`Evolving preferences: ${hints.narrowingConstraints.join('; ')}`);
  }
  if (hints?.priorPlaceSuggestions?.length) {
    parts.push(
      `Places/options you may have already suggested (do not blindly repeat — refine or compare): ${hints.priorPlaceSuggestions.join(', ')}`
    );
  }
  if (transcript) {
    parts.push(`Recent messages:\n${transcript}`);
  }

  parts.push(CONVERSATION_MOMENTUM_BLOCK);
  return `${parts.join('\n\n')}\n\n`;
}

const GROUNDED_TRUTHFULNESS_BLOCK = `AUTHORITATIVE CONTEXT RULES:
- This question requires Vssyl/user/workspace/live facts — not world knowledge about this user's organization, calendar, or files.
- Answer only from PRIVATE CONTEXT below when stating current/user/business/file/calendar facts.
- If the needed fact is absent, incomplete, or not attributable, say so naturally in summary. Do not invent budgets, attendees, sharers, sales figures, or other tenant-specific details.
- Partial context is fine: state what is supported and what cannot be determined.
- If the user refers to specific prior or user-relative content (for example something someone sent, shared, or said to them) but PRIVATE CONTEXT does not identify the source or item, ask one concise clarifying question about the source or type rather than guessing the module or inventing the content.`;

export function buildProviderUserPrompt(input: {
  requestQuery: string;
  data: Record<string, unknown>;
}): string {
  const { requestQuery, data } = input;
  const contract = resolveResponseContractFromProviderData(data);
  const userQuery =
    typeof data.userQuery === 'string' && data.userQuery.trim() ? data.userQuery.trim() : requestQuery;
  const requiredSourceFailures = resolveRequiredSourceFailuresForPrompt(data);
  const claimBoundarySection = buildRequiredSourceClaimBoundarySection(requiredSourceFailures);

  const assembled = data.assembledContext;
  let assembledSection = '';
  if (assembled && typeof assembled === 'object') {
    const ac = assembled as AIAssembledContext;
    const payload =
      contract === 'conversation'
        ? slimAssembledContextForConversation(ac, requiredSourceFailures)
        : contract === 'grounded_answer'
          ? slimAssembledContextForGrounded(ac, requiredSourceFailures)
          : assembled;
    assembledSection = `PRIVATE CONTEXT (use silently — do not cite scores, dashboards, or internal labels to the user):\n${JSON.stringify(payload, null, 2)}\n\n`;
  }

  if (contract === 'conversation') {
    const coachingProfile = resolveCoachingProfile(data, userQuery);
    const reasoning = data.conversationReasoning as ConversationReasoningResult | undefined;
    const coachingBlock = reasoning ? buildConversationReasoningPromptBlock(reasoning) : '';
    const threadSection = buildThreadSection(data);
    const framingHints = coachingProfile.includeRecommendationFraming
      ? buildRecommendationFramingHints({
          userQuery,
          threadHints: data.conversationThread as ConversationThreadHints | undefined,
        })
      : '';
    const framingSection = framingHints ? `${framingHints}\n\n` : '';
    const continuityNote = threadSection
      ? 'Respond as a continuing conversation. Build on the thread above.'
      : coachingProfile.includeRecommendationRichness
        ? 'Respond as a smart conversational guide helping the user make a real decision.'
        : 'Answer naturally and directly. Use the amount of explanation appropriate to the question. Do not assume the user is making a decision unless they asked for one.';
    return `${claimBoundarySection}${coachingBlock}${threadSection}${framingSection}${assembledSection}USER'S LATEST MESSAGE:\n${userQuery}

${continuityNote} Use private context only when it genuinely helps. Never mention productivity scores, work-life balance, dashboards, or internal analytics unless explicitly asked.`;
  }

  if (contract === 'grounded_answer') {
    const groundingNote =
      data.groundingSatisfied === false
        ? `\nGROUNDING STATUS: Authoritative context for this request appears incomplete or unavailable. Do not fabricate the missing fact.\n`
        : data.groundingSatisfied === true
          ? `\nGROUNDING STATUS: Authoritative context was assembled; prefer it over speculation.\n`
          : '\n';
    const threadSection = buildThreadSection(data);
    return `${claimBoundarySection}${GROUNDED_TRUTHFULNESS_BLOCK}
${groundingNote}
${threadSection}${assembledSection}USER'S LATEST MESSAGE:
${userQuery}

Answer naturally and directly from authoritative private context only. Do not produce an enterprise report (no key insights, risks, or recommended actions).`;
  }

  return `${claimBoundarySection}USER REQUEST: ${userQuery}

${assembledSection}AVAILABLE DATA:
${JSON.stringify(data, null, 2)}

REQUEST CONTEXT:
- Priority: ${(data.priority as string) || 'medium'}
- Module Context: ${(data.currentModule as string) || 'Cross-module'}

Please respond as Vssyl's AI assistant using the full context above. Follow the v2 JSON response format from your instructions.`;
}

/** Exposed for provider system prompts and tests. */
export function resolveConversationCoachingForProviderData(
  data?: Record<string, unknown>
): ConversationCoachingProfile {
  if (!data) {
    return {
      style: 'informational',
      includeRecommendationRichness: false,
      includeRecommendationFraming: false,
    };
  }
  const userQuery =
    typeof data.userQuery === 'string' && data.userQuery.trim() ? data.userQuery.trim() : '';
  return resolveCoachingProfile(data, userQuery);
}
