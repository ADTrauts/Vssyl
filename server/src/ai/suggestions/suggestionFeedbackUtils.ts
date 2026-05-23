/**
 * Feedback-driven confidence adjustments for ambient suggestions (Phase 5E).
 */

import {
  DISMISSAL_DECAY_PER_EVENT,
  DISMISSAL_DECAY_WINDOW_MS,
  MIN_RULE_CONFIDENCE_FLOOR,
  SUPPRESSION_BLOCK_MS,
} from './suggestionTypes';

export function applyDismissalDecay(baseConfidence: number, dismissalCount: number): number {
  if (dismissalCount <= 0) return baseConfidence;
  const adjusted = baseConfidence - dismissalCount * DISMISSAL_DECAY_PER_EVENT;
  return Math.max(MIN_RULE_CONFIDENCE_FLOOR, adjusted);
}

export function suppressionBlockSince(): Date {
  return new Date(Date.now() - SUPPRESSION_BLOCK_MS);
}

export function dismissalDecaySince(): Date {
  return new Date(Date.now() - DISMISSAL_DECAY_WINDOW_MS);
}
