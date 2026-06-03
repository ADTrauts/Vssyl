/**
 * Conversation Reasoning Layer — types for objective, confidence, and response policy.
 */

import type {
  ActiveTopicState,
  ConversationContinuityState,
} from '../utils/conversationContinuity';

export type ConversationObjective =
  | 'explore'
  | 'diagnose'
  | 'decide'
  | 'plan'
  | 'execute'
  | 'learn';

export type PrematureSolutionRisk = 'low' | 'medium' | 'high';

export type RecommendedResponseAction =
  | 'ask_clarifying_question'
  | 'reflect_and_probe'
  | 'offer_framework'
  | 'provide_answer'
  | 'provide_plan';

export interface ConversationReasoningResult {
  conversationObjective: ConversationObjective;
  understandingConfidence: number;
  missingInformation: string[];
  criticalUnknowns: string[];
  prematureSolutionRisk: PrematureSolutionRisk;
  recommendedResponseAction: RecommendedResponseAction;
  responseGuidance: string[];
}

export interface ConversationReasoningInput {
  query: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  continuityState?: ConversationContinuityState;
  activeTopic?: ActiveTopicState;
  responseMode?: string;
}

/** Diagnostics-friendly snapshot (admin portal / pipeline metadata). */
export type ConversationReasoningDiagnostics = ConversationReasoningResult;
