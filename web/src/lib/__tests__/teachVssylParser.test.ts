import { describe, expect, it } from 'vitest';
import { parseMemoryFactFromText, storageLabelForClassification } from '../teachVssylParser';

describe('parseMemoryFactFromText', () => {
  it('parses "My favorite dashboard is Operations"', () => {
    expect(parseMemoryFactFromText('My favorite dashboard is Operations')).toEqual({
      subject: 'Favorite dashboard',
      predicate: 'Operations',
    });
  });

  it('parses vocabulary "Board Meeting means Executive Meeting"', () => {
    expect(parseMemoryFactFromText('Board Meeting means Executive Meeting')).toEqual({
      subject: 'Board Meeting',
      predicate: 'Executive Meeting',
    });
  });

  it('falls back to user note for unstructured text', () => {
    expect(parseMemoryFactFromText('Always use metric units')).toEqual({
      subject: 'User note',
      predicate: 'Always use metric units',
    });
  });
});

describe('storageLabelForClassification', () => {
  it('maps chips to confirmation labels', () => {
    expect(storageLabelForClassification('fact')).toBe('Fact');
    expect(storageLabelForClassification('preference')).toBe('Preference');
    expect(storageLabelForClassification('vocabulary')).toBe('Vocabulary');
  });
});
