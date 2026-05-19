import { describe, expect, it } from 'vitest';
import { hasExplicitRecallIntent } from '../aiMessageRecallService';
import { generateSimpleTextEmbedding, cosineSimilarityVectors } from '../../ai/utils/simpleTextEmbedding';

describe('hasExplicitRecallIntent', () => {
  it('detects recall phrasing', () => {
    expect(hasExplicitRecallIntent('We last talked about a trip to Charleston')).toBe(true);
    expect(hasExplicitRecallIntent('What files do I have?')).toBe(false);
  });
});

describe('simpleTextEmbedding', () => {
  it('ranks similar travel queries higher than unrelated', () => {
    const a = generateSimpleTextEmbedding('planning a trip travel vacation');
    const b = generateSimpleTextEmbedding('last time trip travel vacation');
    const c = generateSimpleTextEmbedding('analyze report data summary');
    const simTrip = cosineSimilarityVectors(a, b);
    const simUnrelated = cosineSimilarityVectors(a, c);
    expect(simTrip).toBeGreaterThan(0);
    expect(simTrip).toBeGreaterThan(simUnrelated);
  });
});
