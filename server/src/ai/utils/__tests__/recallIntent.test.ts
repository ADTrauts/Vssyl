import { describe, expect, it } from 'vitest';
import { hasExplicitRecallIntent } from '../recallIntent';

describe('hasExplicitRecallIntent', () => {
  const recallQueries = [
    'We last talked about a trip to Charleston',
    'What were we talking about yesterday?',
    'What did we say about the budget?',
    'Continue our trip planning from last time',
    'What about that vacation we discussed?',
    'The trip we discussed — what were the options?',
    'Those places you mentioned for the weekend',
    'Where were we on destination picks?',
    'What were the options for hotels?',
    'Do you remember what they were?',
  ];

  it.each(recallQueries)('detects recall: %s', (query) => {
    expect(hasExplicitRecallIntent(query)).toBe(true);
  });

  it('does not flag unrelated queries', () => {
    expect(hasExplicitRecallIntent('What files do I have in Drive?')).toBe(false);
    expect(hasExplicitRecallIntent('Schedule a meeting tomorrow at 3pm')).toBe(false);
  });
});
