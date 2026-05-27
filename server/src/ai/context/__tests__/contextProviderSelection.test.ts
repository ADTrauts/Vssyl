import { describe, expect, it } from 'vitest';
import {
  buildProviderSelectionPlan,
  providerMatchesIntents,
  requiredSourcesForGroundingIntents,
} from '../contextProviderSelection';
import {
  buildProviderId,
  normalizeRegistryProvider,
} from '../contextProviderRegistry';
import type { PipelineCatalog } from '../../types/pipelineDiagnostics';
import { DEFAULT_PIPELINE_GROUNDING_RULES } from '../../pipeline/pipelineCatalogDefaults';

function makeProvider(
  moduleId: string,
  name: string,
  overrides?: {
    priority?: number;
    supportedIntents?: string[];
  }
) {
  return normalizeRegistryProvider(moduleId, moduleId, {
    name,
    endpoint: `/api/${moduleId}/ai/context/${name}`,
    cacheDuration: 300000,
    ...overrides,
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

describe('contextProviderSelection', () => {
  it('matches provider intents', () => {
    const provider = makeProvider('drive', 'recent_files', {
      supportedIntents: ['workflow_action'],
    });
    expect(providerMatchesIntents(provider, ['workflow_action'], 'high')).toBe(true);
    expect(providerMatchesIntents(provider, ['emotional_support'], 'high')).toBe(false);
    expect(providerMatchesIntents(provider, ['general_chat'], 'high')).toBe(true);
  });

  it('includes required grounding sources for local_discovery', () => {
    const catalog = minimalCatalog();
    const required = requiredSourcesForGroundingIntents(catalog, ['local_discovery']);
    expect(required.has('location')).toBe(true);
  });

  it('skips optional providers when max optional budget exceeded', () => {
    const drive = makeProvider('drive', 'recent_files', { priority: 90 });
    const calendar = makeProvider('calendar', 'today_events', { priority: 80 });
    const chat = makeProvider('chat', 'recent_conversations', { priority: 70 });
    const todo = makeProvider('todo', 'task_overview', { priority: 60 });

    const providersByModule = new Map([
      ['drive', [drive]],
      ['calendar', [calendar]],
      ['chat', [chat]],
      ['todo', [todo]],
    ]);

    const analysis = {
      query: 'files and meetings and messages and tasks',
      matchedModules: [
        {
          moduleId: 'drive',
          moduleName: 'Drive',
          confidence: 0.9,
          matchedKeywords: ['files'],
          matchedPatterns: [],
          relevance: 'high' as const,
        },
        {
          moduleId: 'calendar',
          moduleName: 'Calendar',
          confidence: 0.8,
          matchedKeywords: ['meetings'],
          matchedPatterns: [],
          relevance: 'high' as const,
        },
        {
          moduleId: 'chat',
          moduleName: 'Chat',
          confidence: 0.7,
          matchedKeywords: ['messages'],
          matchedPatterns: [],
          relevance: 'medium' as const,
        },
        {
          moduleId: 'todo',
          moduleName: 'Todo',
          confidence: 0.6,
          matchedKeywords: ['tasks'],
          matchedPatterns: [],
          relevance: 'medium' as const,
        },
      ],
      suggestedContextProviders: [],
    };

    const plan = buildProviderSelectionPlan({
      query: analysis.query,
      analysis,
      detectedIntents: ['workflow_action'],
      catalog: minimalCatalog(),
      providersByModule,
      installedModuleIds: ['drive', 'calendar', 'chat', 'todo'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
      budget: { maxOptionalProviders: 2 },
    });

    expect(plan.required.length).toBe(0);
    expect(plan.optional.length).toBeLessThanOrEqual(2);
    expect(
      plan.diagnostics.some((d) => d.phase === 'skipped' && d.reason === 'budget_exceeded')
    ).toBe(true);
  });

  it('respects sourceFilter for grounding-only selection', () => {
    const drive = makeProvider('drive', 'recent_files');
    const calendar = makeProvider('calendar', 'today_events');
    const providersByModule = new Map([
      ['drive', [drive]],
      ['calendar', [calendar]],
    ]);

    const plan = buildProviderSelectionPlan({
      query: 'clubs near me',
      analysis: {
        query: 'clubs near me',
        matchedModules: [
          {
            moduleId: 'drive',
            moduleName: 'Drive',
            confidence: 0.9,
            matchedKeywords: ['files'],
            matchedPatterns: [],
            relevance: 'high' as const,
          },
        ],
        suggestedContextProviders: [],
      },
      detectedIntents: ['local_discovery'],
      catalog: minimalCatalog(),
      providersByModule,
      installedModuleIds: ['drive', 'calendar'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(['vssyl_place', 'calendar']),
      sourceFilter: new Set(['vssyl_place']),
      includeQueryMatchedModules: false,
    });

    expect(plan.optional.every((c) => c.provider.moduleId !== 'drive')).toBe(true);
    expect(plan.optional.every((c) => c.provider.moduleId !== 'calendar')).toBe(true);
  });

  it('uses legacy canHandle to pick storage_overview for quota queries', () => {
    const driveProviders = [
      makeProvider('drive', 'recent_files'),
      makeProvider('drive', 'storage_overview'),
    ];
    const providersByModule = new Map([['drive', driveProviders]]);

    const plan = buildProviderSelectionPlan({
      query: 'how much storage space do I have',
      analysis: {
        query: 'how much storage space do I have',
        matchedModules: [
          {
            moduleId: 'drive',
            moduleName: 'Drive',
            confidence: 0.9,
            matchedKeywords: ['storage'],
            matchedPatterns: [],
            relevance: 'high' as const,
          },
        ],
        suggestedContextProviders: [],
      },
      detectedIntents: ['workflow_action'],
      catalog: minimalCatalog(),
      providersByModule,
      installedModuleIds: ['drive'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
    });

    const selected = plan.optional.find((c) => c.provider.moduleId === 'drive');
    expect(selected?.provider.providerName).toBe('storage_overview');
    expect(
      plan.diagnostics.some(
        (d) =>
          d.providerId === buildProviderId('drive', 'recent_files') &&
          d.phase === 'skipped' &&
          d.reason === 'can_handle_false'
      )
    ).toBe(true);
  });
});
