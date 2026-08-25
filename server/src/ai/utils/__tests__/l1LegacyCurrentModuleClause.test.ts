/**
 * L1 — Remove broad active-module + possessive/temporal/file truth fallback.
 * Module location ≠ question domain. W1 shorthand + P1/B1/H1/D2/TM1/A1 remain owners.
 */
import { describe, expect, it } from 'vitest';
import {
  requiresAuthoritativeContext,
  resolveActiveModuleShorthand,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { selectContextProvider } from '../../services/moduleContextProviderSelection';
import { buildProviderSelectionPlan } from '../../context/contextProviderSelection';
import { normalizeRegistryProvider } from '../../context/contextProviderRegistry';
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

/** L1 success: not authoritative merely because of currentModule. */
function expectNotModuleContaminated(
  q: string,
  currentModule: string,
  businessId?: string
) {
  const opts = { query: q, currentModule, businessId };
  expect(resolveActiveModuleShorthand(opts)).toBeNull();
  expect(requiresAuthoritativeContext(opts)).toBe(false);
  const inferred = inferStructuredResponseMode(opts);
  expect(inferred.requiresAuthoritativeContext).toBe(false);
  expect(inferred.responseContract).not.toBe('grounded_answer');
}

function expectAuthoritative(q: string, currentModule?: string | null, businessId?: string) {
  const opts = { query: q, currentModule: currentModule ?? null, businessId };
  expect(requiresAuthoritativeContext(opts)).toBe(true);
  const inferred = inferStructuredResponseMode(opts);
  expect(inferred.requiresAuthoritativeContext).toBe(true);
  expect(inferred.responseContract).toBe('grounded_answer');
}

const CONTAMINATION = [
  'Help me with my school paper.',
  'Explain my mortgage options generally.',
  'Help me understand my biology homework.',
  'Tell me about my options for replacing a roof.',
  'What should I cook for my family?',
  'Why does my washer smell?',
  'Help me choose my next laptop.',
  'Explain my options for refinancing.',
  'Help me with my history paper.',
  'Explain my mortgage options.',
  'Why does my dryer keep shrinking shirts?',
] as const;

describe('L1 — contamination: currentModule must not force reqAuth', () => {
  it.each(CONTAMINATION)('calendar: %s', (q) => {
    expectNotModuleContaminated(q, 'calendar');
  });

  it.each(CONTAMINATION)('drive: %s', (q) => {
    expectNotModuleContaminated(q, 'drive');
  });

  it.each(CONTAMINATION)('hr+businessId: %s', (q) => {
    expectNotModuleContaminated(q, 'hr', BIZ);
  });

  it('What makes a good manager? stays general in HR', () => {
    expectNotModuleContaminated('What makes a good manager?', 'hr', BIZ);
  });
});

describe('L1 — Calendar regression', () => {
  it.each([
    "What's next?",
    "What's coming up?",
    "What's on my calendar today?",
    'What do I have scheduled tomorrow?',
    'Am I free tomorrow?',
    "What's my next meeting?",
  ])('authoritative: %s', (q) => {
    expectAuthoritative(q, 'calendar');
  });

  it.each([
    'Help me with my school paper.',
    'Explain my mortgage options.',
    'What should I cook for my family?',
    'Tell me about my options for replacing a roof.',
    'Help me understand my biology homework.',
  ])('not authoritative: %s', (q) => {
    expectNotModuleContaminated(q, 'calendar');
  });
});

describe('L1 — Drive regression', () => {
  it.each([
    "What's new?",
    'Any new files?',
    'What files are shared with me?',
    'Who owns this attached file?',
    'What do I have in Drive?',
  ])('authoritative: %s', (q) => {
    expectAuthoritative(q, 'drive');
  });

  it.each([
    'Explain my mortgage options.',
    'Help me with my school paper.',
    'Why does my washer smell?',
    'Help me choose my next laptop.',
  ])('not authoritative: %s', (q) => {
    expectNotModuleContaminated(q, 'drive');
  });
});

describe('L1 — HR regression', () => {
  it.each([
    "Who's off?",
    'How many?',
    'Give me an HR overview.',
    'Who manages Dietary?',
    'Who is my manager?',
  ])('authoritative: %s', (q) => {
    expectAuthoritative(q, 'hr', BIZ);
  });

  it.each([
    'Help me understand my biology homework.',
    'Explain my mortgage options.',
    'What should I cook for my family?',
    'Help me choose my next laptop.',
    'What makes a good manager?',
  ])('not authoritative: %s', (q) => {
    expectNotModuleContaminated(q, 'hr', BIZ);
  });
});

describe('L1 — W1 shorthand preserved', () => {
  it('calendar What\'s next? → W1 calendar', () => {
    expect(resolveActiveModuleShorthand({ query: "What's next?", currentModule: 'calendar' })).toBe(
      'calendar'
    );
    expectAuthoritative("What's next?", 'calendar');
    expect(selectContextProvider('calendar', "What's next?", calendarProviders)?.name).toBe(
      'upcoming_events'
    );
  });

  it('drive What\'s new? → W1 drive', () => {
    expect(resolveActiveModuleShorthand({ query: "What's new?", currentModule: 'drive' })).toBe(
      'drive'
    );
    expectAuthoritative("What's new?", 'drive');
    expect(selectContextProvider('drive', "What's new?", driveProviders)?.name).toBe('recent_files');
  });

  it('hr How many? → W1 employee_count', () => {
    expect(
      resolveActiveModuleShorthand({ query: 'How many?', currentModule: 'hr', businessId: BIZ })
    ).toBe('hr');
    expectAuthoritative('How many?', 'hr', BIZ);
    expect(selectContextProvider('hr', 'How many?', hrProviders)?.name).toBe('employee_count');
  });
});

describe('L1 — explicit source precedence over currentModule', () => {
  it('drive + next meeting → calendar/P1 truth, not drive shorthand', () => {
    expect(
      resolveActiveModuleShorthand({ query: "What's my next meeting?", currentModule: 'drive' })
    ).toBeNull();
    expectAuthoritative("What's my next meeting?", 'drive');
  });

  it('calendar + shared files → drive/D2 truth', () => {
    expect(
      resolveActiveModuleShorthand({
        query: 'What files are shared with me?',
        currentModule: 'calendar',
      })
    ).toBeNull();
    expectAuthoritative('What files are shared with me?', 'calendar');
  });

  it('calendar + my manager → TM1 truth', () => {
    expect(
      resolveActiveModuleShorthand({ query: 'Who is my manager?', currentModule: 'calendar' })
    ).toBeNull();
    expectAuthoritative('Who is my manager?', 'calendar');
  });
});

describe('L1 — preferredModuleId only for W1 shorthand', () => {
  it('must fetch: W1 injects preferred module when analysis empty', () => {
    const calendar = makeProvider('calendar', 'upcoming_events');
    const preferredModuleId =
      resolveActiveModuleShorthand({
        query: "What's next?",
        currentModule: 'calendar',
      }) ?? undefined;
    expect(preferredModuleId).toBe('calendar');

    const plan = buildProviderSelectionPlan({
      query: "What's next?",
      analysis: {
        query: "What's next?",
        matchedModules: [],
        suggestedContextProviders: [],
      },
      detectedIntents: ['general_chat'],
      catalog: minimalCatalog(),
      providersByModule: new Map([['calendar', [calendar]]]),
      installedModuleIds: ['calendar', 'drive'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
      preferredModuleId,
    });
    expect(plan.optional.some((c) => c.provider.moduleId === 'calendar')).toBe(true);
    expect(plan.diagnostics.some((d) => d.reason === 'active_module_shorthand')).toBe(true);
  });

  it('must NOT fetch merely because of active module on contamination', () => {
    for (const [cm, q] of [
      ['calendar', 'Help me with my school paper.'],
      ['drive', 'Explain my mortgage options.'],
      ['hr', 'Help me understand my biology homework.'],
    ] as const) {
      const preferred = resolveActiveModuleShorthand({
        query: q,
        currentModule: cm,
        businessId: cm === 'hr' ? BIZ : undefined,
      });
      expect(preferred).toBeNull();

      const calendar = makeProvider('calendar', 'upcoming_events');
      const drive = makeProvider('drive', 'recent_files');
      const hr = makeProvider('hr', 'employee_count');
      const plan = buildProviderSelectionPlan({
        query: q,
        analysis: {
          query: q,
          matchedModules: [],
          suggestedContextProviders: [],
        },
        detectedIntents: ['general_chat'],
        catalog: minimalCatalog(),
        providersByModule: new Map([
          ['calendar', [calendar]],
          ['drive', [drive]],
          ['hr', [hr]],
        ]),
        installedModuleIds: ['calendar', 'drive', 'hr'],
        requiredSourceIds: new Set(),
        optionalSourceIds: new Set(),
        preferredModuleId: preferred ?? undefined,
      });
      expect(plan.optional).toHaveLength(0);
      expect(plan.required).toHaveLength(0);
      expect(plan.diagnostics.some((d) => d.reason === 'active_module_shorthand')).toBe(false);
    }
  });
});

describe('L1 — informationalAnswerEscape on former contamination', () => {
  it('school paper / mortgage / biology homework no longer block escape via reqAuth', () => {
    for (const [cm, q] of [
      ['calendar', 'Help me with my school paper.'],
      ['drive', 'Explain my mortgage options generally.'],
      ['hr', 'Help me understand my biology homework.'],
    ] as const) {
      const inferred = inferStructuredResponseMode({
        query: q,
        currentModule: cm,
        businessId: cm === 'hr' ? BIZ : undefined,
      });
      expect(inferred.requiresAuthoritativeContext).toBe(false);
      // Escape follows normal non-auth routing (may be false for decide-objective leftovers).
      if (inferred.informationalAnswerEscape) {
        expect(inferred.responseContract).toBe('conversation');
      } else {
        expect(inferred.responseContract).not.toBe('grounded_answer');
      }
    }
  });
});

describe('L1 — documented LEGITIMATE GAPs (no catch-all rebuild)', () => {
  it('vague calendar "Anything tomorrow?" is not auto-authoritative after removal', () => {
    expect(
      requiresAuthoritativeContext({ query: 'Anything tomorrow?', currentModule: 'calendar' })
    ).toBe(false);
  });

  it('vague scheduling "Who is working tomorrow?" may lose module-only protection', () => {
    expect(
      requiresAuthoritativeContext({
        query: 'Who is working tomorrow?',
        currentModule: 'scheduling',
        businessId: BIZ,
      })
    ).toBe(false);
  });
});
