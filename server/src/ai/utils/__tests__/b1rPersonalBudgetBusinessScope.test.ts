/**
 * B1-R — Personal budget / business-scope contamination cleanup.
 * businessId is tenant scope, not intent; bare "budget" ≠ business truth.
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { hasExplicitRecallIntent } from '../recallIntent';
import { inferStructuredResponseMode } from '../structuredResponseMode';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

describe('B1-R — personal budget not business truth with businessId', () => {
  const personalNonAuth = [
    'What house budget did I tell you?',
    'What budget did I say I had for the car?',
    'What was the renovation budget I mentioned?',
    'What did I say my renovation budget was?',
    'Help me make a household budget.',
    'How should I budget for a renovation?',
    'What should my car budget be?',
    'Explain personal budgeting.',
    'Explain how to create a personal budget.',
    'Is $500,000 too much for a house?',
  ];

  it.each(personalNonAuth)('non-authoritative with businessId: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
  });

  it('personal recall house budget axes with businessId', () => {
    const q = 'What house budget did I tell you?';
    expect(isActionMutationRequest(q)).toBe(false);
    expect(hasExplicitRecallIntent(q)).toBe(true);
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
    expect(inferred.isActionRequest).toBe(false);
    expect(inferred.requiresAuthoritativeContext).toBe(false);
    expect(inferred.responseContract).toBe('conversation');
  });
});

describe('B1-R — business live / framed budget remains authoritative', () => {
  const businessAuth = [
    'Are we over budget?',
    'Are we under budget?',
    'Are we on budget?',
    'Are labor costs high?',
    'Are we fully staffed?',
    'Is anyone out today?',
    'How did we perform last week?',
    'How are we doing against budget?',
    'How did we perform against budget?',
    'Are we over our budget?',
    'What is our labor budget?',
    "What's our budget?",
    "What's the business budget?",
  ];

  it.each(businessAuth)('authoritative with businessId: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(true);
  });
});

describe('B1-R — historical statement vs current business truth', () => {
  it('what I told you about our labor budget is recall, not live SoR', () => {
    const historical = 'What did I tell you about our labor budget?';
    expect(hasExplicitRecallIntent(historical)).toBe(true);
    expect(requiresAuthoritativeContext({ query: historical, businessId: BIZ })).toBe(false);
    expect(requiresAuthoritativeContext({ query: historical })).toBe(false);
  });

  it('what is our labor budget remains current business truth', () => {
    const live = 'What is our labor budget?';
    expect(hasExplicitRecallIntent(live)).toBe(false);
    expect(requiresAuthoritativeContext({ query: live, businessId: BIZ })).toBe(true);
  });
});

describe('B1-R — businessId is scope not intent', () => {
  it('adding businessId does not flip personal household budget advice', () => {
    const q = 'Help me make a household budget.';
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
  });

  it('business live state still requires businessId', () => {
    expect(requiresAuthoritativeContext({ query: 'Are we over budget?' })).toBe(false);
    expect(requiresAuthoritativeContext({ query: 'Are we over budget?', businessId: BIZ })).toBe(
      true
    );
  });
});
