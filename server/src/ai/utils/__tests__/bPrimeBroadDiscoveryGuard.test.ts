/**
 * B′ — Broad Discovery C3 Safety Guard.
 *
 * Establishes isBroadDiscovery for a future C3 module-orchestration skip.
 * Does NOT implement C3, set requiresAuthoritativeContext, or build an attention product.
 */
import { describe, expect, it } from 'vitest';
import { isBroadDiscoveryQuery } from '../isBroadDiscoveryQuery';
import { hasExplicitRecallIntent } from '../recallIntent';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

const BROAD_TRUE = [
  'What needs my attention?',
  'What needs attention?',
  'Anything need my attention?',
  "What's going on?",
  "What's going on today?",
  'Are there any problems?',
  'Any problems?',
  'Anything I should know?',
  'Is there anything important?',
  'Anything important?',
  'What changed?',
  'What changed today?',
  'What changed since yesterday?',
  'Anything new I should know about?',
  'Anything I need to deal with?',
] as const;

const BROAD_FALSE = [
  'What is attention?',
  'What causes attention problems?',
  "What's important when buying a washer?",
  'What should I know about mortgages?',
  'What problems do front-load washers have?',
  "What's going on with inflation?",
  "What's going on with my dryer?",
  'What changed in this document?',
  'What changed in React?',
  'What changed in our labor budget?',
  "What's the weather today?",
  "What's on my calendar today?",
  'What mortgage rates are available today?',
  'What did I tell you today?',
  'What did I say was important to me?',
  'What washing machine should I buy?',
] as const;

describe('B′ — isBroadDiscoveryQuery detector', () => {
  it.each(BROAD_TRUE)('true: %s', (q) => {
    expect(isBroadDiscoveryQuery(q)).toBe(true);
  });

  it.each(BROAD_FALSE)('false: %s', (q) => {
    expect(isBroadDiscoveryQuery(q)).toBe(false);
  });
});

describe('B′ — structuredResolution surfaces isBroadDiscovery', () => {
  it.each(BROAD_TRUE)('resolution flag true: %s', (q) => {
    const r = inferStructuredResponseMode({ query: q });
    expect(r.isBroadDiscovery).toBe(true);
  });

  it.each(BROAD_FALSE)('resolution flag unset/false: %s', (q) => {
    const r = inferStructuredResponseMode({ query: q });
    expect(r.isBroadDiscovery).not.toBe(true);
  });

  it('available on LifeTwinQuery shape before getContextForAIQuery', () => {
    const structuredResolution = inferStructuredResponseMode({
      query: 'What needs my attention?',
    });
    const lifeTwinQueryBeforeOrchestration = {
      query: 'What needs my attention?',
      structuredResolution,
    };
    expect(lifeTwinQueryBeforeOrchestration.structuredResolution.isBroadDiscovery).toBe(true);
    expect(lifeTwinQueryBeforeOrchestration.structuredResolution.responseContract).toBeDefined();
    expect(
      typeof lifeTwinQueryBeforeOrchestration.structuredResolution.requiresAuthoritativeContext
    ).toBe('boolean');
  });
});

describe('B′ — does not set requiresAuthoritativeContext', () => {
  it.each(BROAD_TRUE)('reqAuth remains false for: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    const r = inferStructuredResponseMode({ query: q });
    expect(r.requiresAuthoritativeContext).toBe(false);
  });

  it('true with businessId still reqAuth false', () => {
    const q = 'What needs my attention?';
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
    expect(
      inferStructuredResponseMode({ query: q, businessId: BIZ }).requiresAuthoritativeContext
    ).toBe(false);
    expect(inferStructuredResponseMode({ query: q, businessId: BIZ }).isBroadDiscovery).toBe(true);
  });

  it('true regardless of currentModule (does not resolve module)', () => {
    for (const mod of ['calendar', 'drive', 'hr'] as const) {
      const q =
        mod === 'calendar'
          ? 'What needs my attention?'
          : mod === 'drive'
            ? 'Anything important?'
            : 'Any problems?';
      const r = inferStructuredResponseMode({ query: q, currentModule: mod, businessId: BIZ });
      expect(r.isBroadDiscovery).toBe(true);
      expect(r.requiresAuthoritativeContext).toBe(false);
    }
  });
});

describe('B′ — response contract / action / escape unchanged', () => {
  it.each(BROAD_TRUE)('conversation contract, non-action: %s', (q) => {
    const r = inferStructuredResponseMode({ query: q });
    expect(r.isActionRequest).toBe(false);
    expect(isActionMutationRequest(q)).toBe(false);
    expect(r.responseContract).toBe('conversation');
  });
});

describe('B′ — contrasts with P-TRUTH / R1 / B1', () => {
  it('P-TRUTH recall is not B′', () => {
    const q = 'What did I say was important to me?';
    expect(hasExplicitRecallIntent(q)).toBe(true);
    expect(isBroadDiscoveryQuery(q)).toBe(false);
    expect(inferStructuredResponseMode({ query: q }).isBroadDiscovery).not.toBe(true);
  });

  it('R1 recommendation is not B′', () => {
    const q = 'What washing machine should I buy?';
    expect(isBroadDiscoveryQuery(q)).toBe(false);
    const r = inferStructuredResponseMode({ query: q });
    expect(r.responseContract).toBe('conversation');
    expect(r.isBroadDiscovery).not.toBe(true);
  });

  it('scoped important/should-know is not B′', () => {
    expect(isBroadDiscoveryQuery("What's important when buying a washer?")).toBe(false);
    expect(isBroadDiscoveryQuery('What should I know about mortgages?')).toBe(false);
  });

  it('B1 authoritative business state is not B′', () => {
    expect(isBroadDiscoveryQuery('Are we over budget?')).toBe(false);
    expect(isBroadDiscoveryQuery('Are we fully staffed?')).toBe(false);
    expect(
      requiresAuthoritativeContext({ query: 'Are we over budget?', businessId: BIZ })
    ).toBe(true);
  });

  it('unscoped problems is B′; B1 staffing is not', () => {
    expect(isBroadDiscoveryQuery('Are there any problems?')).toBe(true);
    expect(isBroadDiscoveryQuery('Are we fully staffed?')).toBe(false);
  });
});

describe('B′ — future C3 eligibility preview (mechanical only; no skip)', () => {
  function futureC3Preview(resolution: ReturnType<typeof inferStructuredResponseMode>): {
    isBroadDiscovery: boolean;
    blocksModuleSkip: boolean;
  } {
    const isBroadDiscovery = resolution.isBroadDiscovery === true;
    return { isBroadDiscovery, blocksModuleSkip: isBroadDiscovery };
  }

  it('general conversation does not block via B′', () => {
    const r = inferStructuredResponseMode({ query: 'Why does salt melt ice?' });
    expect(futureC3Preview(r).isBroadDiscovery).toBe(false);
    expect(futureC3Preview(r).blocksModuleSkip).toBe(false);
  });

  it('B′ blocks future module skip eligibility', () => {
    const r = inferStructuredResponseMode({ query: 'What needs my attention?' });
    expect(futureC3Preview(r).isBroadDiscovery).toBe(true);
    expect(futureC3Preview(r).blocksModuleSkip).toBe(true);
  });
});

describe('B′ — additional scoped / temporal false cases', () => {
  const extraFalse = [
    'Any problems with front-load washers?',
    'Are there problems with this proposal?',
    "What's wrong with my dryer?",
    'What problems are common in old houses?',
    'Anything important about buying a house?',
    'Anything important in this contract?',
    'What is important about EBITDA?',
    "What's going on in this report?",
    "What's going on with Sarah's file?",
    'What changed with my reservation?',
    'What changed in the policy?',
    'Which employee needs my attention?',
    'Why does this dog need attention?',
    'What symptoms need medical attention?',
    'What part of this proposal needs attention?',
    "What's new in quantum computing?",
    "What's new in React?",
    'What changed in this paragraph?',
    "What's going on in this equation?",
    'Explain today\'s assignment.',
  ];

  it.each(extraFalse)('false: %s', (q) => {
    expect(isBroadDiscoveryQuery(q)).toBe(false);
  });
});
