import { describe, expect, it } from 'vitest';
import {
  defaultConfidenceForSourceType,
  inferMemoryFactCategory,
  isExplicitSourceType,
  memorySourceTypeUserLabel,
} from '../memoryFactTypes';

describe('memoryFactTypes', () => {
  it('assigns default confidence by source type', () => {
    expect(defaultConfidenceForSourceType('explicit_user')).toBe(0.8);
    expect(defaultConfidenceForSourceType('remember_that')).toBe(0.85);
    expect(defaultConfidenceForSourceType('inferred_chat')).toBe(0.65);
  });

  it('infers preference category from text', () => {
    expect(inferMemoryFactCategory('coffee', 'User prefers oat milk lattes')).toBe('preference');
  });

  it('infers project category', () => {
    expect(inferMemoryFactCategory('Q3 launch', 'Working on the product launch deadline')).toBe(
      'project'
    );
  });

  it('marks explicit source types', () => {
    expect(isExplicitSourceType('remember_that')).toBe(true);
    expect(isExplicitSourceType('inferred_chat')).toBe(false);
  });

  it('provides user-facing source labels', () => {
    expect(memorySourceTypeUserLabel('remember_that')).toContain('remember');
  });
});
