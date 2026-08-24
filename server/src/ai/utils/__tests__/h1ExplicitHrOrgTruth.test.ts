/**
 * H1 — Explicit HR / organizational truth routing and provider selection.
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

const hrProviders = [
  { name: 'hr_overview', endpoint: '/api/hr/ai/context/overview' },
  { name: 'employee_count', endpoint: '/api/hr/ai/context/headcount' },
  { name: 'time_off_summary', endpoint: '/api/hr/ai/context/time-off' },
  { name: 'self_employment', endpoint: '/api/hr/ai/context/self-employment' },
];

describe('H1 — explicit HR / org truth', () => {
  const authoritativeWithBiz = [
    'Give me an HR overview.',
    'Give me an overview of HR.',
    "What's our HR overview?",
    'Show me our HR status.',
    'How many employees do we have?',
    "What's our employee count?",
    "Who's off today?",
    'Who is off today?',
    'Who is on leave today?',
    'Who has PTO today?',
    'Who manages Dietary?',
    'Who manages the Dietary department?',
    'Who runs Dietary?',
    'Who is the manager of Dietary?',
    'What is our PTO policy?',
  ];

  const generalNonAuth = [
    'What is HR?',
    'What does HR do?',
    'What is PTO?',
    'How does PTO work?',
    'What makes a good manager?',
    'How should a department be managed?',
    'Why do businesses track employee count?',
  ];

  it.each(authoritativeWithBiz)('authoritative with businessId: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(true);
    const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.informationalAnswerEscape).not.toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
    expect(isActionMutationRequest(q)).toBe(false);
  });

  it.each(generalNonAuth)('general without authoritative: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
  });

  it('no businessId — no tenant auto-selection for org HR', () => {
    expect(requiresAuthoritativeContext({ query: 'Who manages Dietary?' })).toBe(false);
    expect(requiresAuthoritativeContext({ query: 'Give me an HR overview.' })).toBe(false);
  });

  it('TM1 self-manager vs department manager', () => {
    expect(requiresAuthoritativeContext({ query: 'Who is my manager?', businessId: BIZ })).toBe(
      true
    );
    expect(selectContextProvider('hr', 'Who is my manager?', hrProviders)?.name).toBe(
      'self_employment'
    );
    expect(requiresAuthoritativeContext({ query: 'Who manages Dietary?', businessId: BIZ })).toBe(
      true
    );
    expect(selectContextProvider('hr', 'Who manages Dietary?', hrProviders)?.name).toBe(
      'hr_overview'
    );
  });

  it('provider matrix — overview', () => {
    expect(
      selectContextProvider('hr', 'Give me an HR overview.', hrProviders)?.name
    ).toBe('hr_overview');
  });

  it('provider matrix — employee count', () => {
    expect(
      selectContextProvider('hr', 'How many employees do we have?', hrProviders)?.name
    ).toBe('employee_count');
  });

  it('provider matrix — absence', () => {
    expect(selectContextProvider('hr', "Who's off today?", hrProviders)?.name).toBe(
      'time_off_summary'
    );
  });

  it('PTO policy — authoritative truth; not time_off_summary (state ≠ policy)', () => {
    expect(
      selectContextProvider('hr', 'What is our PTO policy?', hrProviders)?.name
    ).toBe('hr_overview');
  });

  it('B1 live-state regression with businessId', () => {
    expect(
      requiresAuthoritativeContext({ query: 'Are we fully staffed?', businessId: BIZ })
    ).toBe(true);
  });

  it('A2 action regression', () => {
    expect(isActionMutationRequest('Message Sarah.')).toBe(true);
    expect(requiresAuthoritativeContext({ query: 'Who manages Dietary?', businessId: BIZ })).toBe(
      true
    );
  });

  it('escape before/after matrix', () => {
    for (const q of [
      'Give me an HR overview.',
      'Who manages Dietary?',
      "Who's off today?",
      'How many employees do we have?',
      'What is our PTO policy?',
    ]) {
      const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
      expect(inferred.informationalAnswerEscape, q).not.toBe(true);
    }
    const general = inferStructuredResponseMode({ query: 'What is HR?', businessId: BIZ });
    expect(general.informationalAnswerEscape).toBe(true);
    const mgr = inferStructuredResponseMode({
      query: 'What makes a good manager?',
      businessId: BIZ,
    });
    expect(mgr.informationalAnswerEscape).toBe(true);
  });
});
