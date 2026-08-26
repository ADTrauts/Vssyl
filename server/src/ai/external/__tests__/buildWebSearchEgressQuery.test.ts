import { describe, expect, it } from 'vitest';
import {
  assertSafeWebEgressQuery,
  buildWebSearchEgressQuery,
} from '../buildWebSearchEgressQuery';

describe('buildWebSearchEgressQuery', () => {
  it('builds a bounded public query from the user message', () => {
    const outcome = buildWebSearchEgressQuery("What's happening with OpenAI today?");
    expect('egressQuery' in outcome).toBe(true);
    if ('egressQuery' in outcome) {
      expect(outcome.egressQuery.toLowerCase()).toContain('openai');
      expect(outcome.egressQuery.length).toBeLessThanOrEqual(280);
    }
  });

  it('strips personal rate offers from competitive questions', () => {
    const outcome = buildWebSearchEgressQuery(
      'My lender offered me 6.5%. Is that competitive today?'
    );
    expect('egressQuery' in outcome).toBe(true);
    if ('egressQuery' in outcome) {
      expect(outcome.egressQuery).not.toContain('6.5');
      expect(outcome.egressQuery.toLowerCase()).toContain('mortgage');
      expect(outcome.egressQuery.toLowerCase()).not.toContain('my lender offered');
    }
  });

  it('allows user-explicit public proper nouns', () => {
    const outcome = buildWebSearchEgressQuery('Search for Acme Manufacturing');
    expect('egressQuery' in outcome).toBe(true);
    if ('egressQuery' in outcome) {
      expect(outcome.egressQuery).toContain('Acme Manufacturing');
    }
  });

  it('denies credential-like material', () => {
    const outcome = assertSafeWebEgressQuery('look up sk-abcdefghijklmnopqrstuvwxyz123456');
    expect('policyDenied' in outcome).toBe(true);
  });

  it('denies SSN-like material', () => {
    const outcome = assertSafeWebEgressQuery('lookup person 123-45-6789 news');
    expect('policyDenied' in outcome).toBe(true);
  });
});
