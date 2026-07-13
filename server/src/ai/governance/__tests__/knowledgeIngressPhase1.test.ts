/**
 * Knowledge ingress decision fixtures (Phase 1) — validates intended outcomes
 * against Decision Model philosophy without requiring full Twin HTTP.
 */
import { describe, expect, it } from 'vitest';

type IngressCase = {
  name: string;
  utterance: string;
  expected: {
    kind: 'explicit_teach' | 'temporary' | 'inferred_pending' | 'ignore' | 'live_retrieval' | 'business_scoped';
    durableWithoutReview: boolean;
    promptEligibleImmediately: boolean;
  };
};

/**
 * Lightweight classifier mirroring Decision Model branches for regression documentation.
 * Not a production classifier — tests document intended outcomes.
 */
function classifyIngress(utterance: string): IngressCase['expected'] {
  const q = utterance.toLowerCase();
  if (/remember that/.test(q) || /^please remember/.test(q)) {
    return { kind: 'explicit_teach', durableWithoutReview: true, promptEligibleImmediately: true };
  }
  if (/correct that|actually i prefer|that'?s wrong/.test(q)) {
    return { kind: 'explicit_teach', durableWithoutReview: true, promptEligibleImmediately: true };
  }
  if (/my calendar says|what'?s on my drive|upcoming meetings/.test(q)) {
    return { kind: 'live_retrieval', durableWithoutReview: false, promptEligibleImmediately: false };
  }
  if (/our company policy|business leave policy|for the organization/.test(q)) {
    return { kind: 'business_scoped', durableWithoutReview: false, promptEligibleImmediately: false };
  }
  if (/i guess i kind of like|maybe i prefer|i might want/.test(q)) {
    return { kind: 'inferred_pending', durableWithoutReview: false, promptEligibleImmediately: false };
  }
  if (/nice weather|lol|ok thanks/.test(q)) {
    return { kind: 'ignore', durableWithoutReview: false, promptEligibleImmediately: false };
  }
  return { kind: 'temporary', durableWithoutReview: false, promptEligibleImmediately: false };
}

describe('knowledge ingress cases (Phase 1)', () => {
  const cases: IngressCase[] = [
    {
      name: 'remember that preference',
      utterance: 'Remember that I prefer afternoon meetings.',
      expected: {
        kind: 'explicit_teach',
        durableWithoutReview: true,
        promptEligibleImmediately: true,
      },
    },
    {
      name: 'explicit correction',
      utterance: 'Actually I prefer morning meetings — please correct that.',
      expected: {
        kind: 'explicit_teach',
        durableWithoutReview: true,
        promptEligibleImmediately: true,
      },
    },
    {
      name: 'casual temporary',
      utterance: 'Ok thanks, that was helpful.',
      expected: {
        kind: 'ignore',
        durableWithoutReview: false,
        promptEligibleImmediately: false,
      },
    },
    {
      name: 'inferred preference stays pending',
      utterance: 'I guess I kind of like shorter standups.',
      expected: {
        kind: 'inferred_pending',
        durableWithoutReview: false,
        promptEligibleImmediately: false,
      },
    },
    {
      name: 'irrelevant ignore',
      utterance: 'Nice weather today lol',
      expected: {
        kind: 'ignore',
        durableWithoutReview: false,
        promptEligibleImmediately: false,
      },
    },
    {
      name: 'live module fact not copied',
      utterance: "What's on my Drive recently?",
      expected: {
        kind: 'live_retrieval',
        durableWithoutReview: false,
        promptEligibleImmediately: false,
      },
    },
    {
      name: 'business fact stays scoped',
      utterance: 'What is our company policy on leave?',
      expected: {
        kind: 'business_scoped',
        durableWithoutReview: false,
        promptEligibleImmediately: false,
      },
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const got = classifyIngress(c.utterance);
      expect(got.kind).toBe(c.expected.kind);
      expect(got.durableWithoutReview).toBe(c.expected.durableWithoutReview);
      expect(got.promptEligibleImmediately).toBe(c.expected.promptEligibleImmediately);
      // Constitutional: inferred never silently prompt-eligible
      if (got.kind === 'inferred_pending') {
        expect(got.promptEligibleImmediately).toBe(false);
      }
      // Constitutional: no personal→global
      expect(got).not.toHaveProperty('global');
    });
  }
});
