/**
 * B1 — Implicit business / operational-state authoritative truth routing.
 * Truth recognition only; requires businessId for tenant-scoped live state.
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { resolveContextProfile } from '../../context/contextProfile';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

const hrProviders = [
  { name: 'hr_overview', endpoint: '/api/hr/ai/context/overview' },
  { name: 'employee_count', endpoint: '/api/hr/ai/context/headcount' },
  { name: 'time_off_summary', endpoint: '/api/hr/ai/context/time-off' },
  { name: 'self_employment', endpoint: '/api/hr/ai/context/self-employment' },
];

const schedulingProviders = [
  { name: 'scheduling_overview', endpoint: '/api/scheduling/ai/context/overview' },
  { name: 'coverage_status', endpoint: '/api/scheduling/ai/context/coverage' },
];

describe('B1 — implicit business operational-state truth', () => {
  const authoritativeWithBiz = [
    'Are we over budget?',
    'Are we fully staffed?',
    'Are we understaffed?',
    'Are we short staffed today?',
    'Do we have enough staff today?',
    'Is anyone out today?',
    'Is anyone off today?',
    'Do we have anyone out tomorrow?',
    'How are we doing this month?',
    'How did we perform last week?',
    'How are we performing this week?',
    'Are we on budget this month?',
    'Are labor costs high this week?',
    'How was our performance yesterday?',
    'Are we meeting our staffing needs?',
  ];

  const generalEvenWithBiz = [
    'Why do we use budgets?',
    'How should we staff a restaurant?',
    'How should we improve staffing?',
    'What does fully staffed mean?',
    'What is a labor budget?',
    'What is budget variance?',
    'What causes labor costs to be high?',
    'What should we measure each month?',
    'How should a business measure performance?',
    'Why is staffing important?',
    'How can businesses reduce labor costs?',
    'Explain the concept of workforce planning.',
    'How should we decide whether we\'re fully staffed?',
  ];

  const broadDiscoveryDeferred = [
    'What needs my attention?',
    'Are there any problems I should know about?',
    "What's going on today?",
    'What changed since yesterday?',
  ];

  const noBizProbe = [
    'Are we fully staffed?',
    'Is anyone out today?',
    'How are we doing this month?',
  ];

  it.each(authoritativeWithBiz)('authoritative with businessId: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(true);
    expect(isActionMutationRequest(q)).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
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

  it.each(generalEvenWithBiz)('general/advisory with businessId: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
    expect(inferred.requiresAuthoritativeContext).toBe(false);
  });

  it.each(broadDiscoveryDeferred)('broad discovery deferred: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
  });

  it.each(noBizProbe)('no businessId — no tenant auto-selection: %s', (q) => {
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
  });

  it('preserves existing labor budget truth with businessId', () => {
    const q = "What's our labor budget?";
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(true);
  });

  it('HR absence query — provider selection observation (not modified by B1)', () => {
    const selected = selectContextProvider('hr', 'Is anyone out today?', hrProviders);
    // time_off_summary requires time off/pto/leave cues; "out today" currently falls back to hr_overview.
    expect(selected?.name).toBe('hr_overview');
  });

  it('staffing query falls back to HR overview when matched', () => {
    const selected = selectContextProvider('hr', 'Are we fully staffed?', hrProviders);
    expect(selected?.name).toBe('hr_overview');
  });

  it('scheduling coverage may apply for staffed queries when Scheduling matched', () => {
    const selected = selectContextProvider(
      'scheduling',
      'Are we short staffed today?',
      schedulingProviders
    );
    expect(selected?.name).toBe('coverage_status');
  });

  it('escape before/after matrix', () => {
    const mustGround = [
      'Are we fully staffed?',
      'Is anyone out today?',
      'How are we doing this month?',
      'How did we perform last week?',
      'Are labor costs high this week?',
    ];
    for (const q of mustGround) {
      const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
      expect(inferred.informationalAnswerEscape, q).not.toBe(true);
      expect(inferred.requiresAuthoritativeContext, q).toBe(true);
    }
    const general = [
      'Why do we use budgets?',
      'How should we improve staffing?',
      'Why does salt melt ice?',
    ];
    for (const q of general) {
      const inferred = inferStructuredResponseMode({ query: q, businessId: BIZ });
      expect(inferred.requiresAuthoritativeContext, q).toBe(false);
    }
    const salt = inferStructuredResponseMode({ query: 'Why does salt melt ice?' });
    expect(salt.informationalAnswerEscape).toBe(true);
  });

  it('P1 regression — personal state without businessId', () => {
    expect(requiresAuthoritativeContext({ query: 'What do I have scheduled today?' })).toBe(true);
    expect(requiresAuthoritativeContext({ query: 'What was I working on?' })).toBe(true);
  });
});
