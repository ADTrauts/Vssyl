/**
 * W1 — Active-module shorthand truth + provider selection.
 * Does not change C3 / F-GUARD / B′ / frontend propagation.
 */
import { describe, expect, it } from 'vitest';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
  resolveActiveModuleShorthand,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';
import { buildProviderSelectionPlan } from '../../context/contextProviderSelection';
import {
  normalizeRegistryProvider,
} from '../../context/contextProviderRegistry';
import type { PipelineCatalog } from '../../types/pipelineDiagnostics';
import { DEFAULT_PIPELINE_GROUNDING_RULES } from '../../pipeline/pipelineCatalogDefaults';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

const calendarProviders = [
  { name: 'upcoming_events', endpoint: '/api/calendar/ai/context/upcoming' },
  { name: 'today_events', endpoint: '/api/calendar/ai/context/today' },
  { name: 'availability', endpoint: '/api/calendar/ai/query/availability' },
];

const hrProviders = [
  { name: 'hr_overview', endpoint: '/api/hr/ai/context/overview' },
  { name: 'employee_count', endpoint: '/api/hr/ai/context/headcount' },
  { name: 'time_off_summary', endpoint: '/api/hr/ai/context/time-off' },
  { name: 'self_employment', endpoint: '/api/hr/ai/context/self-employment' },
];

const driveProviders = [
  { name: 'recent_files', endpoint: '/api/drive/ai/context/recent' },
  { name: 'storage_overview', endpoint: '/api/drive/ai/context/storage' },
];

function makeProvider(moduleId: string, name: string) {
  return normalizeRegistryProvider(moduleId, moduleId, {
    name,
    endpoint: `/api/${moduleId}/ai/context/${name}`,
    cacheDuration: 300000,
    supportedIntents: ['general_chat'],
  });
}

function minimalCatalog(): PipelineCatalog {
  return {
    intents: [],
    groundingRules: DEFAULT_PIPELINE_GROUNDING_RULES.map((r) => ({
      ...r,
      id: r.intentId,
      isSystem: true,
      archived: false,
      enabled: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    contextSources: [],
    toolPolicies: [],
    enforcement: { enforcementEnabled: false, enforcementMode: 'off' },
    weakGenericPhrases: [],
  } as PipelineCatalog;
}

function expectGrounded(q: string, currentModule: string, businessId?: string) {
  const opts = { query: q, currentModule, businessId };
  expect(requiresAuthoritativeContext(opts)).toBe(true);
  const inferred = inferStructuredResponseMode(opts);
  expect(inferred.requiresAuthoritativeContext).toBe(true);
  expect(inferred.informationalAnswerEscape).not.toBe(true);
  expect(inferred.responseContract).toBe('grounded_answer');
  expect(isActionMutationRequest(q)).toBe(false);
}

function expectGeneral(q: string, currentModule: string, businessId?: string) {
  const opts = { query: q, currentModule, businessId };
  expect(requiresAuthoritativeContext(opts)).toBe(false);
  const inferred = inferStructuredResponseMode(opts);
  expect(inferred.informationalAnswerEscape).toBe(true);
}

describe('W1 — Calendar active-module shorthand', () => {
  const authoritative = [
    "What's next?",
    'What is next?',
    "What's coming up?",
    'Anything coming up?',
    "What's next today?",
  ];

  const general = [
    'Explain time zones.',
    'How do calendars work?',
    'What makes a good calendar system?',
    'How should I organize my schedule?',
    'What does "next" mean?',
  ];

  it.each(authoritative)('authoritative in calendar: %s', (q) => {
    expect(resolveActiveModuleShorthand({ query: q, currentModule: 'calendar' })).toBe('calendar');
    expectGrounded(q, 'calendar');
    const provider = selectContextProvider('calendar', q, calendarProviders)?.name;
    // "… today" prefers today_events; other next/upcoming shorthand uses upcoming_events.
    if (/\btoday\b/i.test(q)) {
      expect(provider).toBe('today_events');
    } else {
      expect(provider).toBe('upcoming_events');
    }
  });

  it.each(general)('general in calendar: %s', (q) => {
    expect(resolveActiveModuleShorthand({ query: q, currentModule: 'calendar' })).toBeNull();
    expectGeneral(q, 'calendar');
  });

  it('P1 calendar queries remain authoritative without relying on W1 alone', () => {
    expectGrounded('Am I free?', 'calendar');
    expect(selectContextProvider('calendar', 'Am I free?', calendarProviders)?.name).toBe(
      'availability'
    );
    expectGrounded('Am I free tomorrow?', 'calendar');
    // L1: "Anything tomorrow?" previously true only via legacy currentModule+tomorrow;
    // not owned by P1/W1 — left as LEGITIMATE GAP (not rebuilt in L1).
  });

  it('ai-chat / search — What\'s next? remains ambiguous', () => {
    expect(resolveActiveModuleShorthand({ query: "What's next?", currentModule: 'ai-chat' })).toBeNull();
    expect(requiresAuthoritativeContext({ query: "What's next?", currentModule: 'ai-chat' })).toBe(
      false
    );
    expect(resolveActiveModuleShorthand({ query: "What's next?", currentModule: 'search' })).toBeNull();
  });
});

describe('W1 — HR active-module shorthand', () => {
  it('How many? → authoritative + employee_count when hr + businessId', () => {
    expect(
      resolveActiveModuleShorthand({ query: 'How many?', currentModule: 'hr', businessId: BIZ })
    ).toBe('hr');
    expectGrounded('How many?', 'hr', BIZ);
    expect(selectContextProvider('hr', 'How many?', hrProviders)?.name).toBe('employee_count');
    expect(selectContextProvider('hr', 'How many are there?', hrProviders)?.name).toBe(
      'employee_count'
    );
  });

  it("Who's out? / Who's off? remain authoritative with time_off_summary", () => {
    expectGrounded("Who's out?", 'hr', BIZ);
    expect(selectContextProvider('hr', "Who's out?", hrProviders)?.name).toBe('time_off_summary');
    expectGrounded("Who's off?", 'hr', BIZ);
  });

  it('How many? without businessId is not W1 HR shorthand', () => {
    expect(resolveActiveModuleShorthand({ query: 'How many?', currentModule: 'hr' })).toBeNull();
  });

  it('How many? outside HR module is not employee_count globally', () => {
    expect(
      resolveActiveModuleShorthand({ query: 'How many?', currentModule: 'ai-chat', businessId: BIZ })
    ).toBeNull();
    expect(
      requiresAuthoritativeContext({
        query: 'How many?',
        currentModule: 'ai-chat',
        businessId: BIZ,
      })
    ).toBe(false);
    // Provider selection only applies once module is HR — calendar default is not employee_count.
    expect(selectContextProvider('calendar', 'How many?', calendarProviders)?.name).not.toBe(
      'employee_count'
    );
  });

  it('general HR concept queries stay general', () => {
    expectGeneral('What does HR do?', 'hr', BIZ);
    expectGeneral('What makes a good manager?', 'hr', BIZ);
  });
});

describe('W1 — Drive active-module shorthand', () => {
  it.each(["What's new?", 'Anything new?', "What's new recently?", 'Any new files?'])(
    'authoritative in drive: %s',
    (q) => {
      expect(resolveActiveModuleShorthand({ query: q, currentModule: 'drive' })).toBe('drive');
      expectGrounded(q, 'drive');
      expect(selectContextProvider('drive', q, driveProviders)?.name).toBe('recent_files');
    }
  );

  it('general Drive concept queries stay general', () => {
    expectGeneral('How does encryption work?', 'drive');
    expectGeneral('What is a PDF?', 'drive');
  });

  it('ai-chat What\'s new? remains ambiguous', () => {
    expect(resolveActiveModuleShorthand({ query: "What's new?", currentModule: 'ai-chat' })).toBeNull();
    expect(requiresAuthoritativeContext({ query: "What's new?", currentModule: 'ai-chat' })).toBe(
      false
    );
  });

  it('"What changed?" is not treated as Drive recent-file shorthand', () => {
    // recent_files proves recent state, not before→after change history.
    expect(resolveActiveModuleShorthand({ query: 'What changed?', currentModule: 'drive' })).toBeNull();
    expect(requiresAuthoritativeContext({ query: 'What changed?', currentModule: 'drive' })).toBe(
      false
    );
  });
});

describe('W1 — preferredModuleId orchestration bias', () => {
  it('injects preferred module only when analysis matched none', () => {
    const calendar = makeProvider('calendar', 'upcoming_events');
    const drive = makeProvider('drive', 'recent_files');
    const providersByModule = new Map([
      ['calendar', [calendar]],
      ['drive', [drive]],
    ]);

    const emptyAnalysis = {
      query: "What's next?",
      matchedModules: [],
      suggestedContextProviders: [],
    };

    const plan = buildProviderSelectionPlan({
      query: "What's next?",
      analysis: emptyAnalysis,
      detectedIntents: ['general_chat'],
      catalog: minimalCatalog(),
      providersByModule,
      installedModuleIds: ['calendar', 'drive'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
      preferredModuleId: 'calendar',
    });

    expect(plan.optional.some((c) => c.provider.moduleId === 'calendar')).toBe(true);
    expect(plan.diagnostics.some((d) => d.reason === 'active_module_shorthand')).toBe(true);
  });

  it('does not override explicit query module match with preferredModuleId', () => {
    const calendar = makeProvider('calendar', 'upcoming_events');
    const drive = makeProvider('drive', 'recent_files');
    const providersByModule = new Map([
      ['calendar', [calendar]],
      ['drive', [drive]],
    ]);

    // Explicit calendar match while physically in Drive — calendar must win.
    const analysis = {
      query: "What's my next meeting?",
      matchedModules: [
        {
          moduleId: 'calendar',
          moduleName: 'Calendar',
          confidence: 0.9,
          matchedKeywords: ['meeting'],
          matchedPatterns: [],
          relevance: 'high' as const,
        },
      ],
      suggestedContextProviders: [],
    };

    const plan = buildProviderSelectionPlan({
      query: "What's my next meeting?",
      analysis,
      detectedIntents: ['general_chat'],
      catalog: minimalCatalog(),
      providersByModule,
      installedModuleIds: ['calendar', 'drive'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
      preferredModuleId: 'drive',
    });

    expect(plan.optional.some((c) => c.provider.moduleId === 'calendar')).toBe(true);
    expect(plan.optional.some((c) => c.provider.moduleId === 'drive')).toBe(false);
  });

  it('does not inject preferred module when includeQueryMatchedModules is false', () => {
    const calendar = makeProvider('calendar', 'upcoming_events');
    const plan = buildProviderSelectionPlan({
      query: "What's next?",
      analysis: { query: "What's next?", matchedModules: [], suggestedContextProviders: [] },
      detectedIntents: ['general_chat'],
      catalog: minimalCatalog(),
      providersByModule: new Map([['calendar', [calendar]]]),
      installedModuleIds: ['calendar'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
      preferredModuleId: 'calendar',
      includeQueryMatchedModules: false,
    });

    expect(plan.optional).toHaveLength(0);
    expect(plan.required).toHaveLength(0);
  });
});
