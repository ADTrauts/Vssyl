/**
 * D2 — Explicit Drive shared/owner truth: routing, matching, provider selection.
 */
import { describe, expect, it } from 'vitest';
import { requiresAuthoritativeContext } from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { resolveContextProfile } from '../../context/contextProfile';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';
import { resolveDriveRecentFilesFocus } from '../../../services/driveAIContextService';

const driveProviders = [
  { name: 'recent_files', endpoint: '/api/drive/ai/context/recent', description: 'recent' },
  { name: 'storage_overview', endpoint: '/api/drive/ai/context/storage', description: 'storage' },
  { name: 'file_count', endpoint: '/api/drive/ai/query/count', description: 'count' },
];

const hrProviders = [
  { name: 'hr_overview', endpoint: '/api/hr/ai/context/overview', description: 'overview' },
  { name: 'self_employment', endpoint: '/api/hr/ai/context/self-employment', description: 'self' },
];

const calendarProviders = [
  { name: 'upcoming_events', endpoint: '/api/calendar/ai/context/upcoming', description: 'upcoming' },
  { name: 'today_events', endpoint: '/api/calendar/ai/context/today', description: 'today' },
];

describe('D2 — Drive shared/owner authoritative routing', () => {
  const authoritativeTrue = [
    'What files are shared with me?',
    'What files did Sarah share with me?',
    'What files does Sarah own that I can access?',
    'What files owned by Sarah can I access?',
    'Who owns Q3 Staffing Notes.pdf?',
    'Show me the file Sarah shared with me.',
    'Show me files from Sarah that I can access.',
    'Who shared Q3 Staffing Notes.pdf with me?',
  ];

  const authoritativeFalse = [
    'How does file sharing work?',
    'What is a PDF?',
    'What does it mean to own a file?',
    'What does file ownership mean?',
    'Why do people share documents?',
    'Why does salt melt ice?',
  ];

  const ambiguousDeferred = ['What did Sarah send me?', 'Explain what Sarah sent me.'];

  for (const q of authoritativeTrue) {
    it(`authoritative: ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q })).toBe(true);
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.requiresAuthoritativeContext).toBe(true);
      expect(inferred.informationalAnswerEscape).not.toBe(true);
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
    it(`non-authoritative: ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    });
  }

  for (const q of ambiguousDeferred) {
    it(`ambiguous sent-me stays deferred: ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q })).toBe(false);
      expect(resolveDriveRecentFilesFocus(q).mode).toBe('recent');
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.requiresAuthoritativeContext).not.toBe(true);
      // C3 remains blocked: do not force Drive; escape/ambiguity is acceptable.
      expect(inferred.responseContract).not.toBe('grounded_answer');
    });
  }
});

describe('D2 — Drive provider selection', () => {
  const recentQueries = [
    'What files are shared with me?',
    'What files did Sarah share with me?',
    'What files does Sarah own that I can access?',
    'Who owns Q3 Staffing Notes.pdf?',
    'Show me the file Sarah shared with me.',
  ];

  for (const q of recentQueries) {
    it(`selects recent_files for: ${q}`, () => {
      expect(selectContextProvider('drive', q, driveProviders)?.name).toBe('recent_files');
    });
  }

  it('preserves storage_overview and file_count', () => {
    expect(
      selectContextProvider('drive', 'How much storage space do I have left?', driveProviders)
        ?.name
    ).toBe('storage_overview');
    expect(selectContextProvider('drive', 'How many files do I have?', driveProviders)?.name).toBe(
      'file_count'
    );
  });

  it('preserves TM1 HR + Calendar providers', () => {
    expect(selectContextProvider('hr', 'Who is my manager?', hrProviders)?.name).toBe(
      'self_employment'
    );
    expect(
      selectContextProvider('calendar', "What's my next meeting?", calendarProviders)?.name
    ).toBe('upcoming_events');
  });
});
