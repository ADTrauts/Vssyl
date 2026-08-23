/**
 * Determines which conversation coaching blocks apply (informational vs recommendation).
 * Reuses existing query-intent and conversation-objective signals — no parallel taxonomy.
 */

import type { ConversationObjective } from '../conversation/conversationTypes';
import type { ConversationThreadHints } from '../utils/conversationContinuity';
import {
  CONVERSATION_EXPLORATION,
  CONVERSATION_FOLLOWUP,
  CONVERSATION_LIFESTYLE,
  CONVERSATION_UNCERTAINTY,
  EDUCATIONAL_COMPARISON_LEAD,
  ENTERPRISE_RECOMMENDATION,
} from '../utils/queryIntent';

const DECIDE_OR_CHOOSE =
  /\b(should i|help me decide|help me choose|pick between|choose between|which one would you|which would you|would you recommend|would you pick|better fit for me|best fit for me|which option|which of these)\b/i;

const EXPLICIT_RECOMMENDATION =
  /\b(recommend(?:ation|ations|ed|s)?|what do you recommend|give me a recommendation|rank these|your pick)\b/i;

const PREFERENCE_SELECTION =
  /\b(which (?:one|hotel|restaurant|vendor|option|neighborhood)|between these (?:two|three|\d+))\b/i;

export type ConversationCoachingStyle = 'informational' | 'recommendation';

export interface ConversationCoachingProfileInput {
  userQuery: string;
  conversationObjective?: ConversationObjective;
  threadHints?: ConversationThreadHints;
  hasConversationHistory?: boolean;
}

export interface ConversationCoachingProfile {
  style: ConversationCoachingStyle;
  includeRecommendationRichness: boolean;
  includeRecommendationFraming: boolean;
}

export function isInformationalExplanationQuery(query: string): boolean {
  const q = (query || '').trim();
  if (!q) return false;
  if (EDUCATIONAL_COMPARISON_LEAD.test(q)) return true;
  if (
    /^\s*(help me understand|tell me about|what does .+ mean|what is|what's|why does|why do|how does|how do)\b/i.test(
      q
    )
  ) {
    return true;
  }
  if (/\b(explain|definition of|meaning of)\b/i.test(q) && !DECIDE_OR_CHOOSE.test(q)) {
    return true;
  }
  return false;
}

function hasRecommendationDecisionSignals(query: string): boolean {
  const q = (query || '').trim();
  if (!q) return false;

  if (
    CONVERSATION_EXPLORATION.test(q) ||
    CONVERSATION_LIFESTYLE.test(q) ||
    CONVERSATION_UNCERTAINTY.test(q) ||
    ENTERPRISE_RECOMMENDATION.test(q) ||
    DECIDE_OR_CHOOSE.test(q) ||
    EXPLICIT_RECOMMENDATION.test(q) ||
    PREFERENCE_SELECTION.test(q)
  ) {
    return true;
  }

  if (/\b(where should i go|what should i do about|ideas for|brainstorm)\b/i.test(q)) {
    return true;
  }

  if (/\b(lease or buy|rent or buy|buy or lease)\b/i.test(q)) {
    return true;
  }

  return false;
}

/**
 * Canonical signal for recommendation richness, framing hints, and recommendation format supplements.
 */
export function inferConversationCoachingProfile(
  input: ConversationCoachingProfileInput
): ConversationCoachingProfile {
  const q = (input.userQuery || '').trim();
  const hasHistory = Boolean(input.hasConversationHistory || input.threadHints?.isFollowUp);

  if (hasRecommendationDecisionSignals(q)) {
    return {
      style: 'recommendation',
      includeRecommendationRichness: true,
      includeRecommendationFraming: true,
    };
  }

  if (hasHistory && CONVERSATION_FOLLOWUP.test(q) && !isInformationalExplanationQuery(q)) {
    const priorRecommendation =
      (input.threadHints?.priorPlaceSuggestions?.length ?? 0) > 0 ||
      (input.threadHints?.narrowingConstraints?.length ?? 0) > 0;
    if (priorRecommendation || /\b(recommend|that one|second option|too expensive|why did you)\b/i.test(q)) {
      return {
        style: 'recommendation',
        includeRecommendationRichness: true,
        includeRecommendationFraming: true,
      };
    }
  }

  if (isInformationalExplanationQuery(q) || input.conversationObjective === 'learn') {
    return {
      style: 'informational',
      includeRecommendationRichness: false,
      includeRecommendationFraming: false,
    };
  }

  if (input.conversationObjective === 'decide' || input.conversationObjective === 'plan') {
    return {
      style: 'recommendation',
      includeRecommendationRichness: true,
      includeRecommendationFraming: true,
    };
  }

  return {
    style: 'informational',
    includeRecommendationRichness: false,
    includeRecommendationFraming: false,
  };
}
