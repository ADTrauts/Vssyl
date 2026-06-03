/**
 * Heuristic detection of the user's current conversation objective.
 */

import {
  CONVERSATION_EMOTIONAL,
  CONVERSATION_EXPLORATION,
  CONVERSATION_UNCERTAINTY,
} from '../utils/queryIntent';
import type { ConversationObjective } from './conversationTypes';

const EXECUTE_HINTS =
  /\b(create|schedule|send|delete|update|add a|make a|set up|book|remind me|do this now|go ahead and)\b/i;
const LEARN_HINTS =
  /\b(what are (the )?strateg|strategies for|how (do|does|can|should) i|how to|explain|teach me|what is|what's|learn about|tips for|best practices)\b/i;
const PLAN_HINTS =
  /\b(step by step|roadmap|implementation plan|action plan|project plan|milestone|how should i proceed|plan for)\b/i;
const DECIDE_HINTS =
  /\b(should i|which one|help me decide|help me choose|pick between|better option|or should i)\b/i;
const DIAGNOSE_HINTS =
  /\b(what if|is it because|root cause|why am i|why do i|figure out why|could it be|might be my|don't know how to)\b/i;
const EXPLORE_HINTS =
  /\b(can't tell|cannot tell|not sure|don't know if|do not know if|trying to figure|figure out|wondering if|thinking about|considering whether|what do you think about)\b/i;

interface ObjectiveScore {
  objective: ConversationObjective;
  score: number;
}

function scoreObjectives(query: string): ObjectiveScore[] {
  const q = (query || '').trim();
  const scores: ObjectiveScore[] = [
    { objective: 'execute', score: EXECUTE_HINTS.test(q) ? 3 : 0 },
    { objective: 'learn', score: LEARN_HINTS.test(q) ? 3 : 0 },
    { objective: 'plan', score: PLAN_HINTS.test(q) ? 3 : 0 },
    { objective: 'decide', score: DECIDE_HINTS.test(q) ? 2 : 0 },
    { objective: 'diagnose', score: DIAGNOSE_HINTS.test(q) ? 2 : 0 },
    { objective: 'explore', score: 0 },
  ];

  if (EXPLORE_HINTS.test(q)) {
    bump(scores, 'explore', 3);
  }
  if (CONVERSATION_UNCERTAINTY.test(q)) {
    bump(scores, 'explore', 2);
    bump(scores, 'diagnose', 1);
  }
  if (CONVERSATION_EXPLORATION.test(q)) {
    bump(scores, 'explore', 2);
  }
  if (CONVERSATION_EMOTIONAL.test(q)) {
    bump(scores, 'explore', 2);
    bump(scores, 'diagnose', 1);
  }

  if (/\b(burnt out|burned out|burnt-out|burn-out|overwhelmed|stressed)\b/i.test(q)) {
    if (CONVERSATION_UNCERTAINTY.test(q) || /\b(can't tell|not sure|don't know)\b/i.test(q)) {
      bump(scores, 'explore', 3);
    } else {
      bump(scores, 'diagnose', 2);
    }
  }

  if (/\b(job|work|boss|tasks?|boundar|slow down|turn down)\b/i.test(q) && DIAGNOSE_HINTS.test(q)) {
    bump(scores, 'diagnose', 3);
  }

  if (LEARN_HINTS.test(q) && !CONVERSATION_UNCERTAINTY.test(q)) {
    bump(scores, 'learn', 2);
    bump(scores, 'explore', -1);
  }

  return scores;
}

function bump(scores: ObjectiveScore[], objective: ConversationObjective, delta: number): void {
  const row = scores.find((s) => s.objective === objective);
  if (row) row.score += delta;
}

/**
 * Pick the dominant conversation objective from query heuristics.
 */
export function detectConversationObjective(query: string): ConversationObjective {
  const scores = scoreObjectives(query);
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1];

  if (!top || top.score <= 0) {
    return inferDefaultObjective(query);
  }

  if (second && top.score === second.score) {
    return resolveTie(query, top.objective, second.objective);
  }

  return top.objective;
}

function inferDefaultObjective(query: string): ConversationObjective {
  const q = (query || '').trim();
  if (/\?$/.test(q) && /\b(how|what|why)\b/i.test(q)) return 'learn';
  if (CONVERSATION_EMOTIONAL.test(q) || CONVERSATION_UNCERTAINTY.test(q)) return 'explore';
  return 'learn';
}

function resolveTie(
  query: string,
  a: ConversationObjective,
  b: ConversationObjective
): ConversationObjective {
  if (LEARN_HINTS.test(query) && (a === 'learn' || b === 'learn')) return 'learn';
  if (PLAN_HINTS.test(query) && (a === 'plan' || b === 'plan')) return 'plan';
  if (CONVERSATION_UNCERTAINTY.test(query) && (a === 'explore' || b === 'explore')) return 'explore';
  if (DIAGNOSE_HINTS.test(query) && (a === 'diagnose' || b === 'diagnose')) return 'diagnose';
  return a;
}
