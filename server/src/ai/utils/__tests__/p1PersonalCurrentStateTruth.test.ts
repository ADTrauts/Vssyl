/**
 * P1 — Personal / current-state authoritative truth routing.
 * Truth recognition only; source/module selection remains downstream.
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { resolveContextProfile } from '../../context/contextProfile';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';

const calendarProviders = [
  { name: 'upcoming_events', endpoint: '/api/calendar/ai/context/upcoming' },
  { name: 'today_events', endpoint: '/api/calendar/ai/context/today' },
  { name: 'availability', endpoint: '/api/calendar/ai/query/availability' },
];

const driveProviders = [
  { name: 'recent_files', endpoint: '/api/drive/ai/context/recent' },
  { name: 'storage_overview', endpoint: '/api/drive/ai/context/storage' },
];

const todoProviders = [
  { name: 'task_overview', endpoint: '/api/todo/ai/context/overview' },
  { name: 'upcoming_tasks', endpoint: '/api/todo/ai/context/upcoming' },
];

describe('P1 — personal / current-state authoritative truth', () => {
  const authoritativeTrue = [
    'What do I have scheduled today?',
    "What's on my schedule today?",
    'Do I have anything scheduled tomorrow?',
    'What do I have in Drive?',
    'What files do I have?',
    'What do I have due?',
    'What tasks are waiting for me?',
    'What tasks do I have due today?',
    'What notifications do I have?',
    'What did I upload yesterday?',
    'What have I uploaded recently?',
    'What was I working on?',
    'What was I working on yesterday?',
    'What changed for me today?',
    'What do I have waiting for me?',
    'What was the last thing Sarah gave me?',
  ];

  const authoritativeFalse = [
    'How should I schedule my day?',
    'Why do people upload files?',
    'How do tasks work?',
    'What does it mean to have a schedule?',
    'How should I organize my files?',
    'What is a notification?',
    'What makes a good task list?',
    'Why is scheduling useful?',
    'How does Drive storage work?',
    'What do I have to lose?',
    'What do I have to gain?',
    'What have I got to lose?',
    'What do I have to consider?',
    'Why does salt melt ice?',
    'Explain compound interest.',
    'What is a PDF?',
    'How does file sharing work?',
    'How should I organize my day?',
    "What's next?",
    "What's new?",
    "Who's out?",
    'Are we fully staffed?',
    'What needs my attention?',
    "Who's attending?",
    'What does giving something mean?',
  ];

  it.each(authoritativeTrue)('authoritative: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q })).toBe(true);
    expect(isActionMutationRequest(q)).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.informationalAnswerEscape).not.toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
    expect(
      resolveContextProfile(inferred.mode, {
        responseContract: inferred.responseContract,
        requiresAuthoritativeContext: inferred.requiresAuthoritativeContext,
      })
    ).not.toBe('conversation');
  });

  it.each(authoritativeFalse)('non-authoritative: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.requiresAuthoritativeContext).toBe(false);
  });

  it('does not treat upload/read as action mutation', () => {
    expect(isActionMutationRequest('What did I upload yesterday?')).toBe(false);
    expect(isActionMutationRequest('Upload this file.')).toBe(true);
  });

  it('A1 gave-me: authoritative, source unresolved (no forced module)', () => {
    const q = 'What was the last thing Sarah gave me?';
    expect(requiresAuthoritativeContext({ query: q })).toBe(true);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.informationalAnswerEscape).not.toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
  });

  it('preserves recommendation/action contrast for give', () => {
    expect(requiresAuthoritativeContext({ query: 'What should I give Sarah?' })).toBe(false);
  });

  it('calendar scheduled today selects today_events when Calendar matched', () => {
    const selected = selectContextProvider(
      'calendar',
      'What do I have scheduled today?',
      calendarProviders
    );
    expect(selected?.name).toBe('today_events');
  });

  it('Drive possession selects recent_files when Drive matched', () => {
    const selected = selectContextProvider(
      'drive',
      'What do I have in Drive?',
      driveProviders
    );
    expect(selected?.name).toBe('recent_files');
  });

  it('task due selects task provider when Todo matched', () => {
    const selected = selectContextProvider(
      'todo',
      'What tasks are waiting for me?',
      todoProviders
    );
    expect(selected?.name).toBeTruthy();
  });

  it('escape before/after matrix for P1 family', () => {
    const mustEscapeFalse = [
      'What do I have scheduled today?',
      'What do I have in Drive?',
      'What tasks are waiting for me?',
      'What notifications do I have?',
      'What did I upload yesterday?',
      'What was I working on?',
      'What was the last thing Sarah gave me?',
    ];
    for (const q of mustEscapeFalse) {
      const inferred = inferStructuredResponseMode({ query: q });
      expect(inferred.informationalAnswerEscape, q).not.toBe(true);
      expect(inferred.requiresAuthoritativeContext, q).toBe(true);
    }
    const salt = inferStructuredResponseMode({ query: 'Why does salt melt ice?' });
    expect(salt.requiresAuthoritativeContext).toBe(false);
    expect(salt.informationalAnswerEscape).toBe(true);
  });
});
