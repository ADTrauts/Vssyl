import { describe, expect, it } from 'vitest';
import { requiresAuthoritativeContext } from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { resolveContextProfile } from '../../context/contextProfile';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';
import {
  queryTokenMatchesModuleName,
  shouldScoreModuleNameToken,
} from '../../services/ModuleAIContextService';
import { assembleAIContext } from '../../context/AIContextAssembler';
import type { UserContext } from '../../context/CrossModuleContextEngine';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

const hrProviders = [
  { name: 'hr_overview', endpoint: '/api/hr/ai/context/overview', description: 'overview' },
  { name: 'employee_count', endpoint: '/api/hr/ai/context/headcount', description: 'count' },
  { name: 'time_off_summary', endpoint: '/api/hr/ai/context/time-off', description: 'pto' },
  { name: 'self_employment', endpoint: '/api/hr/ai/context/self-employment', description: 'self' },
];

const calendarProviders = [
  { name: 'upcoming_events', endpoint: '/api/calendar/ai/context/upcoming', description: 'upcoming' },
  { name: 'today_events', endpoint: '/api/calendar/ai/context/today', description: 'today' },
  { name: 'availability', endpoint: '/api/calendar/ai/query/availability', description: 'free' },
];

const baseUserContext: UserContext = {
  userId: 'u1',
  timestamp: new Date(),
  activeModules: ['hr'],
  crossModuleInsights: [],
  currentFocus: { module: 'hr', activity: 'chat', priority: 'medium', timeSpent: 0 },
  patterns: [],
  relationships: [],
  preferences: {
    communication: {
      preferredChannels: [],
      responseTimeExpectations: {},
      formalityLevel: 0.5,
      timezone: 'UTC',
    },
    work: {
      productiveHours: [],
      focusBlockPreference: 60,
      interruptionTolerance: 0.5,
      collaborationStyle: 'balanced',
      prioritizationMethod: 'priority',
    },
    personal: {
      socialEngagement: 0.5,
      privacyLevel: 0.5,
      sharingComfort: 0.5,
      planningHorizon: 7,
    },
  },
  lifeState: {
    workLifeBalance: { score: 50, trend: 'stable', concerns: [], opportunities: [] },
    productivity: { score: 50, peakHours: [], efficiency: 0.5, bottlenecks: [] },
    relationships: { score: 50, socialConnections: 0, communicationHealth: 0.5, networkGrowth: 0 },
    goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
  },
};

describe('TM1 — self/org truth routing', () => {
  const authoritativeTrue = [
    'What is my email?',
    'Tell me my email.',
    'What email address is on my account?',
    'What is my name?',
    'Tell me my name.',
    "What's my job title?",
    'What is my title?',
    'What position am I in?',
    'What department am I in?',
    'Which department do I work in?',
    'Who is my manager?',
    'Who is my boss?',
    'Who do I report to?',
    'Who is my supervisor?',
  ];

  const authoritativeFalse = [
    'What is an email address?',
    'How does email work?',
    'What is a name?',
    'What is a job title?',
    'What does a manager do?',
    'What is a manager?',
    'Why are managers important?',
    'What does a department do?',
    'What is a department?',
    'What does a supervisor usually do?',
    'How do org charts work?',
    'How should departments be structured?',
    'Why does salt melt ice?',
  ];

  for (const q of authoritativeTrue) {
    it(`authoritative: ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(true);
      expect(requiresAuthoritativeContext({ query: q })).toBe(true);
      const inferred = inferStructuredResponseMode({
        query: q,
        toneMode: 'conversational',
        businessId: BIZ,
      });
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
    it(`general (not authoritative): ${q}`, () => {
      expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
      expect(requiresAuthoritativeContext({ query: q })).toBe(false);
      const inferred = inferStructuredResponseMode({
        query: q,
        toneMode: 'conversational',
        businessId: BIZ,
      });
      expect(inferred.requiresAuthoritativeContext).toBe(false);
    });
  }
});

describe('TM1 — HR self_employment provider selection', () => {
  const selfEmploymentQueries = [
    'Who is my manager?',
    'Who is my boss?',
    'Who do I report to?',
    "What's my job title?",
    'What department am I in?',
    'Who is my supervisor?',
  ];

  for (const q of selfEmploymentQueries) {
    it(`${q} → self_employment`, () => {
      expect(selectContextProvider('hr', q, hrProviders)?.name).toBe('self_employment');
    });
  }

  it('preserves aggregate HR providers', () => {
    expect(
      selectContextProvider('hr', 'What is our employee count by department?', hrProviders)?.name
    ).toBe('employee_count');
    expect(selectContextProvider('hr', "Who's off today on PTO?", hrProviders)?.name).toBe(
      'time_off_summary'
    );
    expect(selectContextProvider('hr', 'Give me an HR overview', hrProviders)?.name).toBe(
      'hr_overview'
    );
  });

  it('definitional manager does not select self_employment', () => {
    expect(selectContextProvider('hr', 'What does a manager do?', hrProviders)?.name).toBe(
      'hr_overview'
    );
  });

  it('calendar and salt unchanged', () => {
    expect(
      selectContextProvider('calendar', "What's my next meeting?", calendarProviders)?.name
    ).toBe('upcoming_events');
    expect(selectContextProvider('hr', 'Why does salt melt ice?', hrProviders)?.name).toBe(
      'hr_overview'
    );
  });
});

describe('TM1 — module-name short-token guard', () => {
  it('rejects stopwords and short tokens', () => {
    expect(shouldScoreModuleNameToken('i')).toBe(false);
    expect(shouldScoreModuleNameToken('an')).toBe(false);
    expect(shouldScoreModuleNameToken('a')).toBe(false);
    expect(shouldScoreModuleNameToken('am')).toBe(false);
    expect(queryTokenMatchesModuleName('i', 'File Hub')).toBe(false);
    expect(queryTokenMatchesModuleName('an', 'HR Management')).toBe(false);
  });

  it('allows meaningful tokens', () => {
    expect(shouldScoreModuleNameToken('file')).toBe(true);
    expect(shouldScoreModuleNameToken('hub')).toBe(true);
    expect(shouldScoreModuleNameToken('calendar')).toBe(true);
    expect(queryTokenMatchesModuleName('file', 'File Hub')).toBe(true);
    expect(queryTokenMatchesModuleName('calendar', 'Calendar')).toBe(true);
  });
});

describe('TM1 — authenticated identity grounding evidence', () => {
  it('assembles identity block that Core can recognize for grounding', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'What is my email?',
        userId: 'u1',
        context: {},
      },
      userContext: baseUserContext,
      authenticatedIdentity: {
        name: 'AI Truth Employee',
        email: 'ai.truth.employee@vssyl.local',
      },
      structuredResolution: inferStructuredResponseMode({
        query: 'What is my email?',
        toneMode: 'conversational',
      }),
    });

    expect(assembled.contextBlocks.some((b) => b.title === 'Authenticated identity')).toBe(true);
    expect(
      assembled.evidence.some(
        (e) =>
          e.sourceType === 'personal' &&
          String(e.label).toLowerCase().includes('authenticated user identity')
      )
    ).toBe(true);
    expect(JSON.stringify(assembled.contextBlocks)).toContain('ai.truth.employee@vssyl.local');
    // Preference-style personal blocks are separate titles — identity is not preference dump
    expect(
      assembled.contextBlocks.find((b) => b.title === 'Authenticated identity')?.content
    ).toEqual({
      name: 'AI Truth Employee',
      email: 'ai.truth.employee@vssyl.local',
    });
  });
});
