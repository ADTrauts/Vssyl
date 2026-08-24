/**
 * F-GUARD — Conservative follow-up protection for a future C3 orchestration skip.
 *
 * Does NOT implement C3, continuity, source inheritance, or product follow-up answers.
 * Proves isFollowUp is computed once (Service: conversationHistory.length > 0) and
 * surfaced on structuredResolution at the LifeTwinQuery / Core point before getContextForAIQuery.
 */
import { describe, expect, it } from 'vitest';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { requiresAuthoritativeContext } from '../requiresAuthoritativeContext';

type HistoryItem = { role: 'user' | 'assistant'; content: string; timestamp: Date };

function historyFromTurn1(userQuery: string): HistoryItem[] {
  return [
    { role: 'user', content: userQuery, timestamp: new Date(0) },
    { role: 'assistant', content: 'Prior answer.', timestamp: new Date(1) },
  ];
}

/**
 * Mirrors DigitalLifeTwinService.resolveCanonicalTwinRouting ownership:
 * isFollowUp: conversationHistory.length > 0
 */
function resolveLikeService(query: string, conversationHistory: HistoryItem[]) {
  return inferStructuredResponseMode({
    query,
    isFollowUp: conversationHistory.length > 0,
  });
}

/**
 * Future C3 conceptual eligibility inputs available at Core before orchestration.
 * F-GUARD only asserts follow-up blocks eligibility — does not implement skip.
 */
function futureC3InputsFromResolution(
  resolution: ReturnType<typeof inferStructuredResponseMode>
): {
  isFollowUp: boolean;
  responseContract?: string;
  requiresAuthoritativeContext: boolean;
  isActionRequest: boolean;
  futureC3Eligible: boolean;
} {
  const isFollowUp = resolution.isFollowUp === true;
  return {
    isFollowUp,
    responseContract: resolution.responseContract,
    requiresAuthoritativeContext: resolution.requiresAuthoritativeContext === true,
    isActionRequest: resolution.isActionRequest === true,
    // Conservative: any follow-up is never eligible for ContextProvider skip.
    futureC3Eligible: !isFollowUp,
  };
}

describe('F-GUARD — isFollowUp owner and definition', () => {
  it('Service definition: isFollowUp === conversationHistory.length > 0', () => {
    expect(resolveLikeService("Who's attending?", []).isFollowUp).toBeUndefined();
    expect(resolveLikeService("Who's attending?", historyFromTurn1("What's my next meeting?")).isFollowUp).toBe(
      true
    );
  });

  it('structuredResolution carries isFollowUp with other routing axes (P3 + F-GUARD)', () => {
    const resolution = resolveLikeService("Who's attending?", historyFromTurn1("What's my next meeting?"));
    expect(resolution.isFollowUp).toBe(true);
    expect(resolution.responseContract).toBeDefined();
    expect(typeof resolution.requiresAuthoritativeContext).toBe('boolean');
    expect(typeof resolution.isActionRequest).toBe('boolean');
  });
});

describe('F-GUARD — follow-up matrix (second turns)', () => {
  const cases: Array<{ turn1: string; turn2: string }> = [
    { turn1: 'Who is my manager?', turn2: 'What department are they in?' },
    { turn1: "What's my next meeting?", turn2: "Who's attending?" },
    { turn1: 'What files did Sarah share with me?', turn2: 'Who owns that one?' },
    { turn1: "What's our labor budget?", turn2: 'Why is it so high?' },
    { turn1: 'Explain compound interest.', turn2: 'Can you explain that more simply?' },
  ];

  it.each(cases)('turn2 after "$turn1" → isFollowUp and future skip forbidden', ({ turn1, turn2 }) => {
    const resolution = resolveLikeService(turn2, historyFromTurn1(turn1));
    expect(resolution.isFollowUp).toBe(true);

    const gate = futureC3InputsFromResolution(resolution);
    expect(gate.isFollowUp).toBe(true);
    expect(gate.futureC3Eligible).toBe(false);
  });
});

describe('F-GUARD — new-thread contrast', () => {
  const literals = [
    "Who's attending?",
    'Why is it so high?',
    'Can you explain that more simply?',
    'What department are they in?',
    'Who owns that one?',
  ];

  it.each(literals)('new thread "%s" → isFollowUp false / unset', (q) => {
    const resolution = resolveLikeService(q, []);
    expect(resolution.isFollowUp).not.toBe(true);
    expect(futureC3InputsFromResolution(resolution).isFollowUp).toBe(false);
  });
});

describe('F-GUARD — signal available before orchestration (LifeTwinQuery shape)', () => {
  it('structuredResolution.isFollowUp is present with other C3 gate axes before getContextForAIQuery', () => {
    // Simulates LifeTwinQuery after Service.resolveCanonicalTwinRouting, before Core orchestration.
    const conversationHistory = historyFromTurn1("What's my next meeting?");
    const structuredResolution = inferStructuredResponseMode({
      query: "Who's attending?",
      isFollowUp: conversationHistory.length > 0,
    });

    const lifeTwinQueryBeforeOrchestration = {
      query: "Who's attending?",
      conversationHistory,
      structuredResolution,
    };

    expect(lifeTwinQueryBeforeOrchestration.structuredResolution.isFollowUp).toBe(true);
    expect(lifeTwinQueryBeforeOrchestration.structuredResolution.responseContract).toBeDefined();
    expect(
      typeof lifeTwinQueryBeforeOrchestration.structuredResolution.requiresAuthoritativeContext
    ).toBe('boolean');
    expect(typeof lifeTwinQueryBeforeOrchestration.structuredResolution.isActionRequest).toBe(
      'boolean'
    );

    // Future gate can consume Service-owned isFollowUp without recomputing from history.
    expect(
      futureC3InputsFromResolution(lifeTwinQueryBeforeOrchestration.structuredResolution)
        .futureC3Eligible
    ).toBe(false);
  });
});

describe('F-GUARD — behavioral invariance (no routing changes)', () => {
  const firstTurnQueries = [
    'Why does salt melt ice?',
    'Who is my manager?',
    "What's my next meeting?",
    'What files are shared with me?',
    'What did Sarah send me?',
    "What's on my schedule today?",
    'Are we understaffed?',
    'Give me an HR overview.',
    "What's next?",
    'Message Sarah.',
  ];

  it.each(firstTurnQueries)('first-turn routing axes unchanged for: %s', (q) => {
    const withFlag = inferStructuredResponseMode({ query: q, isFollowUp: false });
    const withoutHistory = inferStructuredResponseMode({ query: q });

    expect(withFlag.mode).toBe(withoutHistory.mode);
    expect(withFlag.responseContract).toBe(withoutHistory.responseContract);
    expect(withFlag.requiresAuthoritativeContext).toBe(withoutHistory.requiresAuthoritativeContext);
    expect(withFlag.isActionRequest).toBe(withoutHistory.isActionRequest);
    expect(withFlag.informationalAnswerEscape).toBe(withoutHistory.informationalAnswerEscape);
    expect(withFlag.isFollowUp).not.toBe(true);
  });

  it('W1 calendar shorthand truth unchanged', () => {
    expect(
      requiresAuthoritativeContext({ query: "What's next?", currentModule: 'calendar' })
    ).toBe(true);
    const r = inferStructuredResponseMode({
      query: "What's next?",
      currentModule: 'calendar',
      isFollowUp: false,
    });
    expect(r.requiresAuthoritativeContext).toBe(true);
    expect(r.informationalAnswerEscape).not.toBe(true);
  });

  it('follow-up does not force authoritative context by itself', () => {
    const r = inferStructuredResponseMode({
      query: "Who's attending?",
      isFollowUp: true,
    });
    expect(r.isFollowUp).toBe(true);
    // Underspecified follow-up: no invented Calendar source / truth from F-GUARD.
    expect(r.requiresAuthoritativeContext).toBe(false);
  });
});
