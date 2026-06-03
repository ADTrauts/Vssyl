/**
 * Conversation Reasoning Layer — deterministic pre-generation assessment.
 */

import { detectConversationObjective } from './conversationObjective';
import { assessUnderstandingConfidence } from './understandingConfidence';
import { assessPrematureSolutionRisk } from './prematureSolutionGuard';
import {
  buildResponseGuidance,
  deriveCriticalUnknowns,
  deriveMissingInformation,
  resolveRecommendedResponseAction,
} from './coachingModePolicy';
import type {
  ConversationReasoningInput,
  ConversationReasoningResult,
} from './conversationTypes';

export {
  buildConversationReasoningPromptBlock,
  shouldSuppressRecommendationRichness,
} from './coachingModePolicy';

/**
 * Run heuristic conversation reasoning (no model call).
 */
export function runConversationReasoning(
  input: ConversationReasoningInput
): ConversationReasoningResult {
  const conversationObjective = detectConversationObjective(input.query);
  const understandingConfidence = assessUnderstandingConfidence(input, conversationObjective);
  const prematureSolutionRisk = assessPrematureSolutionRisk(
    input,
    conversationObjective,
    understandingConfidence
  );
  const missingInformation = deriveMissingInformation(input, conversationObjective);
  const criticalUnknowns = deriveCriticalUnknowns(input, conversationObjective);
  const recommendedResponseAction = resolveRecommendedResponseAction({
    objective: conversationObjective,
    understandingConfidence,
    prematureSolutionRisk,
  });
  const responseGuidance = buildResponseGuidance({
    query: input.query,
    objective: conversationObjective,
    recommendedResponseAction,
    prematureSolutionRisk,
    missingInformation,
    criticalUnknowns,
  });

  return {
    conversationObjective,
    understandingConfidence,
    missingInformation,
    criticalUnknowns,
    prematureSolutionRisk,
    recommendedResponseAction,
    responseGuidance,
  };
}
