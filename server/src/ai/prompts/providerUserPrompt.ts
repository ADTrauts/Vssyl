/**
 * Provider user-message builders (conversation vs enterprise).
 */

import type { AIAssembledContext } from '../context/AIContextAssembler';
import type { ConversationHistoryItem } from '../core/DigitalLifeTwinCore';
import type { ConversationThreadHints } from '../utils/conversationContinuity';
import { formatConversationTranscript } from '../utils/conversationContinuity';
import { CONVERSATION_MOMENTUM_BLOCK } from './conversationMomentum';
import {
  buildRecommendationFramingHints,
  CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK,
} from './conversationRecommendationRichness';
import { isConversationStructuredMode } from './structuredResponseFormat';

export function isConversationProviderData(data?: Record<string, unknown>): boolean {
  if (!data) return false;
  if (isConversationStructuredMode(data.structuredResponseMode as string | undefined)) return true;
  return (data.promptProfile as string) === 'conversation';
}

function slimAssembledContextForConversation(assembled: AIAssembledContext): Record<string, unknown> {
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
  };
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

export function buildProviderUserPrompt(input: {
  requestQuery: string;
  data: Record<string, unknown>;
}): string {
  const { requestQuery, data } = input;
  const conversation = isConversationProviderData(data);
  const userQuery =
    typeof data.userQuery === 'string' && data.userQuery.trim() ? data.userQuery.trim() : requestQuery;

  const assembled = data.assembledContext;
  let assembledSection = '';
  if (assembled && typeof assembled === 'object') {
    const ac = assembled as AIAssembledContext;
    const payload = conversation ? slimAssembledContextForConversation(ac) : assembled;
    assembledSection = `PRIVATE CONTEXT (use silently — do not cite scores, dashboards, or internal labels to the user):\n${JSON.stringify(payload, null, 2)}\n\n`;
  }

  if (conversation) {
    const threadSection = buildThreadSection(data);
    const framingHints = buildRecommendationFramingHints({
      userQuery,
      threadHints: data.conversationThread as ConversationThreadHints | undefined,
    });
    const richnessSection = threadSection.includes('RECOMMENDATION INTELLIGENCE')
      ? ''
      : `${CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK}\n\n`;
    const framingSection = framingHints ? `${framingHints}\n\n` : '';
    const continuityNote = threadSection
      ? 'Respond as a continuing conversation. Build on the thread above.'
      : 'Respond as a smart conversational guide helping the user make a real decision.';
    return `${threadSection}${richnessSection}${framingSection}${assembledSection}USER'S LATEST MESSAGE:\n${userQuery}

${continuityNote} Use private context only when it genuinely helps. Never mention productivity scores, work-life balance, dashboards, or internal analytics unless explicitly asked.`;
  }

  return `USER REQUEST: ${userQuery}

${assembledSection}AVAILABLE DATA:
${JSON.stringify(data, null, 2)}

REQUEST CONTEXT:
- Priority: ${(data.priority as string) || 'medium'}
- Module Context: ${(data.currentModule as string) || 'Cross-module'}

Please respond as Vssyl's AI assistant using the full context above. Follow the v2 JSON response format from your instructions.`;
}
