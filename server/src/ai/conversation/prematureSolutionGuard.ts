/**
 * Detect risk of jumping to generic solutions before understanding the user.
 */

import {
  CONVERSATION_EMOTIONAL,
  CONVERSATION_LIFESTYLE,
  CONVERSATION_UNCERTAINTY,
} from '../utils/queryIntent';
import { confidenceBand } from './understandingConfidence';
import type {
  ConversationObjective,
  ConversationReasoningInput,
  PrematureSolutionRisk,
} from './conversationTypes';

const EXPLICIT_SOLUTION_ASK =
  /\b(strateg(y|ies)|tips|advice|recommend|give me|list of|how to fix|what should i do about)\b/i;
const PREMATURE_TRIGGERS =
  /\b(burnt out|burned out|overwhelmed|stressed|anxious|depressed|lonely|stuck|lost)\b/i;
const WORK_BOUNDARY_UNCERTAINTY =
  /\b(job|work|boss|tasks?|slow down|turn down|boundar|say no|can't say no)\b/i;

export function assessPrematureSolutionRisk(
  input: ConversationReasoningInput,
  objective: ConversationObjective,
  understandingConfidence: number
): PrematureSolutionRisk {
  const q = (input.query || '').trim();
  const band = confidenceBand(understandingConfidence);

  if (EXPLICIT_SOLUTION_ASK.test(q) && band !== 'low') {
    return 'low';
  }

  if (objective === 'execute' || objective === 'learn') {
    if (objective === 'learn' && EXPLICIT_SOLUTION_ASK.test(q)) return 'low';
    if (objective === 'learn' && band === 'high') return 'low';
    if (objective === 'execute' && band !== 'low') return 'low';
  }

  if (objective === 'plan' && band !== 'low') return 'low';

  let riskScore = 0;

  if (objective === 'explore' || objective === 'diagnose') riskScore += 2;
  if (band === 'low') riskScore += 3;
  else if (band === 'medium') riskScore += 1;

  if (CONVERSATION_UNCERTAINTY.test(q)) riskScore += 2;
  if (PREMATURE_TRIGGERS.test(q) && !EXPLICIT_SOLUTION_ASK.test(q)) riskScore += 3;
  if (CONVERSATION_EMOTIONAL.test(q) && !EXPLICIT_SOLUTION_ASK.test(q)) riskScore += 2;
  if (CONVERSATION_LIFESTYLE.test(q) && !EXPLICIT_SOLUTION_ASK.test(q)) riskScore += 2;
  if (WORK_BOUNDARY_UNCERTAINTY.test(q) && CONVERSATION_UNCERTAINTY.test(q)) riskScore += 2;

  if (/\b(vacation|getaway|hobby|trip to)\b/i.test(q) && band === 'low') riskScore += 2;

  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}
