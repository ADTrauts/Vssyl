/**
 * Coaching / exploration response policy from objective, confidence, and solution risk.
 */

import { confidenceBand } from './understandingConfidence';
import type {
  ConversationObjective,
  ConversationReasoningInput,
  ConversationReasoningResult,
  PrematureSolutionRisk,
  RecommendedResponseAction,
} from './conversationTypes';

const WORK_BOUNDARY = /\b(job|work|boss|tasks?|slow down|turn down|boundar)\b/i;

export function deriveMissingInformation(
  input: ConversationReasoningInput,
  objective: ConversationObjective
): string[] {
  const q = (input.query || '').trim().toLowerCase();
  const missing: string[] = [];

  if (/\b(burnt out|burned out|overwhelmed)\b/i.test(q)) {
    if (!/\b(exhaust|bored|resent|overload|purpose|rest|pace)\b/i.test(q)) {
      missing.push('Which burnout flavor applies (exhaustion, boredom, resentment, overload, lack of purpose)?');
    }
    if (!/\b(work|job|personal|health|sleep)\b/i.test(q)) {
      missing.push('Primary life domain driving the feeling (work, health, relationships, general pace).');
    }
  }

  if (WORK_BOUNDARY.test(q)) {
    if (!/\b(boss|team|client|family|identity|fear)\b/i.test(q)) {
      missing.push('Who or what makes slowing down or saying no feel risky.');
    }
    if (!/\b(slow down|turn down|say no|boundar)\b/i.test(q)) {
      missing.push('Concrete boundary the user wants (hours, tasks, availability, expectations).');
    }
  }

  if (objective === 'decide' && !/\b(option|between|either|or )\b/i.test(q)) {
    missing.push('Options or constraints the user is weighing.');
  }

  if (objective === 'explore' && q.length < 40) {
    missing.push('More specificity about what the user is trying to understand before acting.');
  }

  return missing.slice(0, 5);
}

export function deriveCriticalUnknowns(
  input: ConversationReasoningInput,
  objective: ConversationObjective
): string[] {
  const q = (input.query || '').trim();
  const unknowns: string[] = [];

  if (objective === 'explore' || objective === 'diagnose') {
    if (/\b(can't tell|not sure|don't know)\b/i.test(q)) {
      unknowns.push('Root cause or category of the problem is still unidentified.');
    }
  }

  if (/\b(job|work)\b/i.test(q) && /\b(slow down|turn down|tasks?)\b/i.test(q)) {
    unknowns.push(
      'Whether the core tension is workload, identity/performance pressure, fear of disappointing others, or unclear boundaries.'
    );
  }

  if (/\b(burnt out|burned out)\b/i.test(q)) {
    unknowns.push('Whether the user needs recovery, stimulation, boundary change, or meaning/purpose shift.');
  }

  return unknowns.slice(0, 4);
}

export function resolveRecommendedResponseAction(input: {
  objective: ConversationObjective;
  understandingConfidence: number;
  prematureSolutionRisk: PrematureSolutionRisk;
}): RecommendedResponseAction {
  const { objective, understandingConfidence, prematureSolutionRisk } = input;
  const band = confidenceBand(understandingConfidence);
  const coachingObjective = objective === 'explore' || objective === 'diagnose';

  if (coachingObjective && (band === 'low' || prematureSolutionRisk === 'high')) {
    if (prematureSolutionRisk === 'high' && objective === 'explore') {
      return 'reflect_and_probe';
    }
    return understandingConfidence < 22 ? 'ask_clarifying_question' : 'reflect_and_probe';
  }

  if (coachingObjective && prematureSolutionRisk === 'medium') {
    return 'reflect_and_probe';
  }

  if (objective === 'plan') {
    return band === 'low' ? 'offer_framework' : 'provide_plan';
  }

  if (objective === 'learn') {
    return band === 'low' && prematureSolutionRisk !== 'low' ? 'offer_framework' : 'provide_answer';
  }

  if (objective === 'decide') {
    return band === 'low' || prematureSolutionRisk !== 'low' ? 'reflect_and_probe' : 'offer_framework';
  }

  if (objective === 'execute') {
    return 'provide_answer';
  }

  return 'provide_answer';
}

export function buildResponseGuidance(input: {
  query?: string;
  objective: ConversationObjective;
  recommendedResponseAction: RecommendedResponseAction;
  prematureSolutionRisk: PrematureSolutionRisk;
  missingInformation: string[];
  criticalUnknowns: string[];
}): string[] {
  const guidance: string[] = [];
  const { objective, recommendedResponseAction, prematureSolutionRisk } = input;

  if (recommendedResponseAction === 'ask_clarifying_question') {
    guidance.push('Ask exactly 1–2 focused clarifying questions — no bullet lists of advice.');
    guidance.push('Briefly reflect what you understand so far in one sentence.');
    guidance.push('Do not recommend vacations, hobbies, apps, or productivity systems yet.');
  }

  if (recommendedResponseAction === 'reflect_and_probe') {
    guidance.push('Mirror the tension the user named before suggesting any fix.');
    guidance.push('Offer 1–2 discriminating questions that separate plausible root causes.');
    guidance.push('Avoid generic advice lists unless the user explicitly asked for strategies.');
    guidance.push('Do not recommend vacations, hobbies, apps, or productivity systems until intent is clearer.');
  }

  if (recommendedResponseAction === 'offer_framework') {
    guidance.push('Provide a lightweight framework or dimensions to think through — not a full action plan yet.');
  }

  if (prematureSolutionRisk === 'high' || prematureSolutionRisk === 'medium') {
    guidance.push('Suppress travel, lifestyle, and tool recommendations until intent is clearer.');
  }

  if (objective === 'diagnose' && WORK_BOUNDARY.test(input.query ?? '')) {
    guidance.push(
      'Consider responsibility, boundaries, identity, leadership pressure, or fear of letting people down — not only task tactics.'
    );
  }

  if (input.criticalUnknowns.length) {
    guidance.push(`Critical unknowns to respect: ${input.criticalUnknowns.slice(0, 2).join(' ')}`);
  }

  return [...new Set(guidance)].slice(0, 8);
}

export function buildConversationReasoningPromptBlock(
  result: ConversationReasoningResult
): string {
  const coaching =
    result.recommendedResponseAction === 'ask_clarifying_question' ||
    result.recommendedResponseAction === 'reflect_and_probe';

  if (!coaching) return '';

  const lines = [
    'CONVERSATION REASONING (coaching mode — follow before recommending):',
    `- Objective: ${result.conversationObjective}`,
    `- Understanding confidence: ${result.understandingConfidence}/100`,
    `- Premature solution risk: ${result.prematureSolutionRisk}`,
    `- Action: ${result.recommendedResponseAction}`,
    ...result.responseGuidance.map((g) => `- ${g}`),
  ];

  if (result.missingInformation.length) {
    lines.push(`Gaps to explore: ${result.missingInformation.join(' | ')}`);
  }

  return `${lines.join('\n')}\n\n`;
}

export function shouldSuppressRecommendationRichness(result: ConversationReasoningResult): boolean {
  return (
    result.prematureSolutionRisk !== 'low' &&
    (result.conversationObjective === 'explore' ||
      result.conversationObjective === 'diagnose') &&
    (result.recommendedResponseAction === 'ask_clarifying_question' ||
      result.recommendedResponseAction === 'reflect_and_probe')
  );
}
