/**
 * Heuristic understanding confidence (0–100) for conversation reasoning.
 */

import {
  CONVERSATION_EMOTIONAL,
  CONVERSATION_UNCERTAINTY,
  ENTERPRISE_RECOMMENDATION,
} from '../utils/queryIntent';
import type { ConversationObjective } from './conversationTypes';
import type { ConversationReasoningInput } from './conversationTypes';

const EXPLICIT_ADVICE_ASK =
  /\b(strateg(y|ies)|tips|advice|recommend|how (do|can|should) i|what should i do|give me (ideas|options))\b/i;
const SPECIFIC_CONSTRAINTS =
  /\b(by (monday|friday|tomorrow)|before \d|budget of|\$\d|within \d|deadline|must be|only domestic|only international)\b/i;
const NAMED_ENTITIES = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|Q[1-4] \d{4})\b/;

export function assessUnderstandingConfidence(
  input: ConversationReasoningInput,
  objective: ConversationObjective
): number {
  const q = (input.query || '').trim();
  let score = 52;

  if (!q) return 15;

  const wordCount = q.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 25) score += 8;
  else if (wordCount < 12) score -= 8;

  if (EXPLICIT_ADVICE_ASK.test(q)) score += 18;
  if (ENTERPRISE_RECOMMENDATION.test(q)) score += 12;
  if (SPECIFIC_CONSTRAINTS.test(q)) score += 14;
  if (NAMED_ENTITIES.test(q)) score += 10;

  const workDiagnoseQuery =
    objective === 'diagnose' && /\b(job|work|boss|tasks?|slow down|turn down|boundar)\b/i.test(q);

  if (CONVERSATION_UNCERTAINTY.test(q)) {
    score -= workDiagnoseQuery ? 10 : 22;
  }
  if (CONVERSATION_EMOTIONAL.test(q) && !EXPLICIT_ADVICE_ASK.test(q)) score -= 16;

  if (/\b(can't tell|cannot tell|don't know if|not sure if|figure out the source|before choosing)\b/i.test(q)) {
    score -= 12;
  }

  const history = input.conversationHistory ?? [];
  if (history.length >= 4) score += 6;
  if (history.length >= 2 && objective === 'diagnose') score += 5;

  if (objective === 'learn' || objective === 'plan') {
    if (EXPLICIT_ADVICE_ASK.test(q)) score += 10;
  }

  if (objective === 'diagnose') {
    if (/\b(job|work|boss|tasks?|slow down|turn down|boundar)\b/i.test(q) && wordCount >= 10) {
      score += 18;
    } else {
      score -= 6;
    }
    if (CONVERSATION_UNCERTAINTY.test(q) && !/\b(job|work)\b/i.test(q)) score -= 6;
  }

  if (objective === 'explore') {
    score -= 10;
    if (CONVERSATION_UNCERTAINTY.test(q)) score -= 8;
  }

  if (objective === 'execute' && /\b(create|schedule|send)\b/i.test(q)) {
    score += 12;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function confidenceBand(score: number): 'low' | 'medium' | 'high' {
  if (score < 45) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}
