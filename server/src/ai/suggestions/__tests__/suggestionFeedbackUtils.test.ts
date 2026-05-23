import { describe, it, expect } from 'vitest';
import { applyDismissalDecay } from '../suggestionFeedbackUtils';
import { MIN_RULE_CONFIDENCE_FLOOR } from '../suggestionTypes';

describe('suggestionFeedbackUtils', () => {
  it('applyDismissalDecay reduces confidence per dismissal', () => {
    expect(applyDismissalDecay(0.75, 1)).toBeCloseTo(0.67, 2);
    expect(applyDismissalDecay(0.75, 0)).toBe(0.75);
  });

  it('applyDismissalDecay never drops below floor', () => {
    expect(applyDismissalDecay(0.6, 10)).toBe(MIN_RULE_CONFIDENCE_FLOOR);
  });
});
