/**
 * Learning application result types (Phase 2C).
 */

export type LearningApplicationTarget = 'preference' | 'memory' | 'personality';

export interface LearningApplicationRecord {
  targetType: LearningApplicationTarget;
  targetId: string;
  beforeSummary: string;
  afterSummary: string;
  appliedAt: string;
}

export interface LearningWhatChangedSummary {
  eventId?: string;
  eventType?: string;
  targetType: LearningApplicationTarget;
  targetId: string;
  beforeSummary: string;
  afterSummary: string;
  appliedAt: string;
  preferenceShiftNote?: string;
}

export const APPLIED_LEARNING_CONFIDENCE_FLOOR = 0.65;

export const LEARNING_LAST_PROMOTION_PREF_KEY = 'ai_learning_last_promotion';

/** Known questionnaire trait keys for personality profile merges. */
export const PERSONALITY_TRAIT_KEYS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
  'riskTolerance',
  'adaptability',
] as const;

export type PersonalityTraitKey = (typeof PERSONALITY_TRAIT_KEYS)[number];

export function isPersonalityTraitKey(value: string): value is PersonalityTraitKey {
  return (PERSONALITY_TRAIT_KEYS as readonly string[]).includes(value);
}
