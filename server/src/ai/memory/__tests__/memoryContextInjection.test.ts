import { describe, expect, it } from 'vitest';
import { prepareMemoryFactsForAssembly } from '../memoryContextInjection';
import { MEMORY_INFERRED_CONFIDENCE_FLOOR } from '../memoryScoring';

const truncate = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

describe('prepareMemoryFactsForAssembly', () => {
  it('always includes explicit facts regardless of confidence', () => {
    const out = prepareMemoryFactsForAssembly(
      [
        {
          id: 'e1',
          subject: 'Travel',
          predicate: 'Window seat',
          confidence: 0.2,
          sourceType: 'explicit_user',
          isExplicit: true,
        },
      ],
      truncate
    );
    expect(out.items).toHaveLength(1);
    expect(out.items[0]?.injectionTier).toBe('explicit');
    expect(out.explicitCount).toBe(1);
  });

  it('excludes inferred facts below confidence floor', () => {
    const out = prepareMemoryFactsForAssembly(
      [
        {
          id: 'low',
          subject: 'Snack',
          predicate: 'Maybe likes almonds',
          confidence: MEMORY_INFERRED_CONFIDENCE_FLOOR - 0.01,
          sourceType: 'inferred_chat',
          isExplicit: false,
        },
        {
          id: 'ok',
          subject: 'Coffee',
          predicate: 'Drinks black coffee',
          confidence: MEMORY_INFERRED_CONFIDENCE_FLOOR,
          sourceType: 'inferred_chat',
          isExplicit: false,
        },
      ],
      truncate
    );
    expect(out.items).toHaveLength(1);
    expect(out.items[0]?.id).toBe('ok');
    expect(out.inferredCount).toBe(1);
    expect(out.excludedInferredLowConfidence).toBe(1);
  });
});
