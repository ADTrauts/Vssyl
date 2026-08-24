/**
 * A1 — Ambiguous personal-truth routing (source may remain unresolved).
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { resolveContextProfile } from '../../context/contextProfile';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';
import { buildProviderUserPrompt } from '../../prompts/providerUserPrompt';

const driveProviders = [
  { name: 'recent_files', endpoint: '/api/drive/ai/context/recent' },
  { name: 'storage_overview', endpoint: '/api/drive/ai/context/storage' },
  { name: 'file_count', endpoint: '/api/drive/ai/query/count' },
];

const hrProviders = [
  { name: 'hr_overview', endpoint: '/api/hr/ai/context/overview' },
  { name: 'self_employment', endpoint: '/api/hr/ai/context/self-employment' },
];

const calendarProviders = [
  { name: 'upcoming_events', endpoint: '/api/calendar/ai/context/upcoming' },
  { name: 'today_events', endpoint: '/api/calendar/ai/context/today' },
];

/** Mirrors DigitalLifeTwinCore coarse provider-satisfied grounding (not fact-level). */
function coarseGroundingSatisfied(input: {
  requiresAuthoritativeContext: boolean;
  usedModules: string[];
  hasAuthoritativeBlocks: boolean;
  hasAuthenticatedIdentity: boolean;
}): boolean {
  return (
    !input.requiresAuthoritativeContext ||
    input.hasAuthoritativeBlocks ||
    input.hasAuthenticatedIdentity ||
    input.usedModules.length > 0
  );
}

describe('A1 — ambiguous personal-truth routing', () => {
  const authoritativeTrue = [
    'Explain what Sarah sent me.',
    'What did Sarah send me?',
    'What did Sarah share with me?',
    'What did Sarah say to me?',
    'What did Sarah tell me?',
    'What did Sarah assign me?',
    'What did my manager send me?',
    'What did Sarah send me yesterday?',
    'Explain what she sent me.',
    'What document did Sarah share with me?',
    'What message did Sarah send me?',
    'What file did Sarah send me?',
  ];

  const authoritativeFalse = [
    'What does send mean?',
    'What does "send" mean?',
    'What does sharing mean?',
    'What does it mean to share something?',
    'How does file sharing work?',
    'Why do people send messages?',
    'What makes a good message?',
    'How should managers communicate?',
    'What is a chat message?',
    'What does assigning work mean?',
    'How do people share documents?',
    'Why does salt melt ice?',
  ];

  const actions = [
    'Send this file to Sarah.',
    'Share this file with Sarah.',
    'Share Q3 Staffing Notes.pdf with Sarah.',
    'Move my meeting.',
    'Assign this task to Sarah.',
  ];

  for (const q of authoritativeTrue) {
    it(`authoritative + grounded (no escape): ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q })).toBe(true);
      expect(isActionMutationRequest(q)).toBe(false);
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.requiresAuthoritativeContext).toBe(true);
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.isActionRequest).toBe(false);
      expect(inferred.responseContract).toBe('grounded_answer');
      expect(
        resolveContextProfile(inferred.mode, {
          responseContract: inferred.responseContract,
          requiresAuthoritativeContext: inferred.requiresAuthoritativeContext,
        })
      ).toBe('grounded');
    });
  }

  for (const q of authoritativeFalse) {
    it(`non-authoritative general: ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    });
  }

  for (const q of actions) {
    it(`action (not grounded historical read): ${q}`, () => {
      expect(isActionMutationRequest(q)).toBe(true);
      expect(requiresAuthoritativeContext({ query: q })).toBe(false);
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.isActionRequest).toBe(true);
      expect(inferred.responseContract).not.toBe('grounded_answer');
    });
  }

  it('follow-up without file cue stays authoritative', () => {
    const q = 'Explain what she sent me.';
    expect(requiresAuthoritativeContext({ query: q })).toBe(true);
    const inferred = inferStructuredResponseMode({
      query: q,
      toneMode: 'conversational',
      isFollowUp: true,
    });
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.informationalAnswerEscape).not.toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
  });
});

describe('A1 — source selection unchanged', () => {
  it('explicit Drive cues still select recent_files', () => {
    expect(
      selectContextProvider('drive', 'What file did Sarah send me?', driveProviders)?.name
    ).toBe('recent_files');
    expect(
      selectContextProvider('drive', 'What document did Sarah share with me?', driveProviders)
        ?.name
    ).toBe('recent_files');
  });

  it('ambiguous history does not invent Drive via truth owner alone', () => {
    // Truth is authoritative; module matching remains separate (A1 does not force Drive).
    for (const q of [
      'What did Sarah send me?',
      'Explain what Sarah sent me.',
      'What did Sarah share with me?',
      'What did Sarah say to me?',
    ]) {
      expect(requiresAuthoritativeContext({ query: q })).toBe(true);
      // Provider pick only applies once a module is matched — default drive pick is recent_files,
      // but A1 must not require drive selection for ambiguous rows.
      expect(selectContextProvider('hr', q, hrProviders)?.name).not.toBe('self_employment');
      expect(
        selectContextProvider('calendar', q, calendarProviders)?.name
      ).not.toBe('today_events');
    }
  });

  it('preserves TM1 + Calendar provider selection', () => {
    expect(selectContextProvider('hr', 'Who is my manager?', hrProviders)?.name).toBe(
      'self_employment'
    );
    expect(
      selectContextProvider('calendar', "What's my next meeting?", calendarProviders)?.name
    ).toBe('upcoming_events');
  });
});

describe('A1 — informationalAnswerEscape blockers', () => {
  const mustNotEscape = [
    'Explain what Sarah sent me.',
    'What did Sarah share with me?',
    'What did Sarah say to me?',
    'What document did Sarah share with me?',
  ];

  for (const q of mustNotEscape) {
    it(`does not escape: ${q}`, () => {
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.requiresAuthoritativeContext).toBe(true);
    });
  }

  it('salt / compound / EBITDA / file-sharing-meaning still eligible for conversation path', () => {
    expect(
      inferStructuredResponseMode({
        query: 'Why does salt melt ice?',
        toneMode: 'conversational',
      }).informationalAnswerEscape
    ).toBe(true);
    expect(
      requiresAuthoritativeContext({ query: 'What does file sharing mean?' })
    ).toBe(false);
  });
});

describe('A1 — coarse groundingSatisfied', () => {
  it('ambiguous source with no provider evidence is unsatisfied', () => {
    expect(
      coarseGroundingSatisfied({
        requiresAuthoritativeContext: true,
        usedModules: [],
        hasAuthoritativeBlocks: false,
        hasAuthenticatedIdentity: false,
      })
    ).toBe(false);
  });

  it('explicit Drive evidence satisfies coarse grounding', () => {
    expect(
      coarseGroundingSatisfied({
        requiresAuthoritativeContext: true,
        usedModules: ['drive'],
        hasAuthoritativeBlocks: true,
        hasAuthenticatedIdentity: false,
      })
    ).toBe(true);
  });

  it('authenticated identity evidence satisfies coarse grounding', () => {
    expect(
      coarseGroundingSatisfied({
        requiresAuthoritativeContext: true,
        usedModules: [],
        hasAuthoritativeBlocks: false,
        hasAuthenticatedIdentity: true,
      })
    ).toBe(true);
  });
});

describe('A1 — grounded clarification guidance', () => {
  it('grounded prompt asks for clarification when source/item is missing', () => {
    const prompt = buildProviderUserPrompt({
      requestQuery: 'Explain what Sarah sent me.',
      data: {
        userQuery: 'Explain what Sarah sent me.',
        responseContract: 'grounded_answer',
        groundingSatisfied: false,
        assembledContext: { contextBlocks: [], evidence: [], usedModules: [] },
      },
    });
    expect(prompt).toMatch(/clarifying question/i);
    expect(prompt).toMatch(/incomplete or unavailable/i);
    expect(prompt.toLowerCase()).toMatch(/rather than guessing/);
  });
});
