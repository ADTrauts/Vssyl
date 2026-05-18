/**
 * Query intent heuristics shared by context assembly and structured response mode inference.
 */

import type { AIResponseMode } from '../types/structuredResponse';

export type QueryIntent =
  | 'conversation'
  | 'answer'
  | 'summary'
  | 'analysis'
  | 'recommendation'
  | 'action_plan'
  | 'comparison'
  | 'status_update';

const ENTERPRISE_COMPARISON = /\b(compare|versus|vs\.?|difference between|pros and cons|tradeoff|trade-off)\b/i;
const ENTERPRISE_ANALYSIS =
  /\b(analyze|analysis|break this down|audit|compliance|metrics|kpi|dashboard data|operational review)\b/i;
const ENTERPRISE_ACTION_PLAN =
  /\b(implementation plan|roadmap|step by step|action plan|project plan|milestone plan)\b/i;
const ENTERPRISE_SUMMARY = /\b(executive summary|tldr|tl;dr|summarize this report)\b/i;
const ENTERPRISE_STATUS = /\b(status update|progress report|weekly status|project status)\b/i;
export const ENTERPRISE_RECOMMENDATION =
  /\b(recommend a|recommendation for|give me recommendations|best option for|which vendor should we|rank these options)\b/i;

export const CONVERSATION_UNCERTAINTY =
  /\b(can't figure out|cannot figure out|not sure|don't know|do not know|help me decide|help me figure|stuck on|no idea)\b/i;
export const CONVERSATION_CURIOSITY =
  /\b(what do you think|any thoughts|your take|curious about|wondering if|help me think)\b/i;
export const CONVERSATION_EXPLORATION =
  /\b(where should i go|what should i do about|thinking about|considering|ideas for|brainstorm|what about)\b/i;
export const CONVERSATION_EMOTIONAL =
  /\b(i feel like|i'm feeling|i am feeling|overwhelmed|burnt out|burned out|excited but|last minute)\b/i;
export const CONVERSATION_LIFESTYLE =
  /\b(vacation|weekend trip|getaway|gift idea|date night|hobby|life decision)\b/i;
export const CONVERSATION_FOLLOWUP = /\b(which one|that sounds|what if we|should we try)\b/i;

/**
 * Infer high-level query intent from user text (conservative enterprise routing).
 */
export function inferQueryIntent(queryText: string): QueryIntent {
  const q = (queryText || '').trim();
  if (!q) return 'answer';

  if (ENTERPRISE_SUMMARY.test(q)) return 'summary';
  if (ENTERPRISE_COMPARISON.test(q)) return 'comparison';
  if (ENTERPRISE_ANALYSIS.test(q)) return 'analysis';
  if (ENTERPRISE_ACTION_PLAN.test(q)) return 'action_plan';
  if (ENTERPRISE_STATUS.test(q)) return 'status_update';
  if (ENTERPRISE_RECOMMENDATION.test(q)) return 'recommendation';

  if (
    CONVERSATION_UNCERTAINTY.test(q) ||
    CONVERSATION_CURIOSITY.test(q) ||
    CONVERSATION_EXPLORATION.test(q) ||
    CONVERSATION_EMOTIONAL.test(q) ||
    CONVERSATION_LIFESTYLE.test(q) ||
    CONVERSATION_FOLLOWUP.test(q)
  ) {
    return 'conversation';
  }

  return 'answer';
}

export function queryIntentToStructuredMode(intent: QueryIntent): AIResponseMode {
  if (intent === 'conversation') return 'conversation';
  return intent;
}
