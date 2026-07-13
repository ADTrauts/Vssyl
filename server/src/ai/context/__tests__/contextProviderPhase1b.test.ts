/**
 * Phase 1B — Context provider selection / cross-module (real selection plan logic).
 */
import { describe, expect, it } from 'vitest';
import {
  buildProviderSelectionPlan,
  requiredSourcesForGroundingIntents,
} from '../contextProviderSelection';
import { normalizeRegistryProvider } from '../contextProviderRegistry';
import type { PipelineCatalog } from '../../types/pipelineDiagnostics';
import { DEFAULT_PIPELINE_GROUNDING_RULES } from '../../pipeline/pipelineCatalogDefaults';

function makeProvider(
  moduleId: string,
  name: string,
  overrides?: { priority?: number; supportedIntents?: string[] }
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

describe('Phase 1B — context provider + cross-module selection', () => {
  it('selects Drive and Calendar for file+meeting query within optional budget', () => {
    const drive = makeProvider('drive', 'recent_files', {
      priority: 90,
      supportedIntents: ['workflow_action', 'general_chat'],
    });
    const calendar = makeProvider('calendar', 'today_events', {
      priority: 85,
      supportedIntents: ['scheduling', 'general_chat'],
    });
    const chat = makeProvider('chat', 'recent_conversations', {
      priority: 40,
      supportedIntents: ['communication'],
    });

    const analysis = {
      query: 'What files and meetings do I have today?',
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
          confidence: 0.9,
          matchedKeywords: ['meetings'],
          matchedPatterns: [],
          relevance: 'high' as const,
        },
      ],
      suggestedContextProviders: [
        { moduleId: 'drive', providerName: 'recent_files' },
        { moduleId: 'calendar', providerName: 'today_events' },
      ],
    };

    const plan = buildProviderSelectionPlan({
      query: analysis.query,
      analysis: analysis as never,
      detectedIntents: ['workflow_action', 'scheduling'],
      catalog: minimalCatalog(),
      providersByModule: new Map([
        ['drive', [drive]],
        ['calendar', [calendar]],
        ['chat', [chat]],
      ]),
      installedModuleIds: ['drive', 'calendar', 'chat'],
      requiredSourceIds: new Set(),
      optionalSourceIds: new Set(),
      budget: { maxOptionalProviders: 3 },
    });

    const selectedModuleIds = [...plan.required, ...plan.optional].map((p) => p.provider.moduleId);
    expect(selectedModuleIds).toContain('drive');
    expect(selectedModuleIds).toContain('calendar');
  });

  it('required grounding sources remain listed for local_discovery', () => {
    const required = requiredSourcesForGroundingIntents(minimalCatalog(), ['local_discovery']);
    expect(required.has('location')).toBe(true);
  });
});
