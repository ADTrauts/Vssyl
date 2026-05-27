import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/ModuleAIContextService', () => ({
  moduleAIContextService: {
    analyzeQuery: vi.fn(),
    fetchModuleContext: vi.fn(),
  },
}));

vi.mock('../../pipeline/pipelineCatalogService', () => ({
  getEffectivePipelineCatalog: vi.fn(),
}));

vi.mock('../contextProviderRegistry', async () => {
  const actual = await vi.importActual<typeof import('../contextProviderRegistry')>(
    '../contextProviderRegistry'
  );
  return {
    ...actual,
    loadInstalledRegistryProviders: vi.fn(),
  };
});

vi.mock('../fetchModuleContextProvider', () => ({
  fetchRegisteredProviderContext: vi.fn(),
}));

vi.mock('../lazyUserContext', () => ({
  buildSkimUserContext: vi.fn(),
}));

vi.mock('../contextProviderSelection', async () => {
  const actual = await vi.importActual<typeof import('../contextProviderSelection')>(
    '../contextProviderSelection'
  );
  return {
    ...actual,
    buildProviderSelectionPlan: vi.fn(),
    optionalSourcesForGroundingIntents: actual.optionalSourcesForGroundingIntents,
    requiredSourcesForGroundingIntents: actual.requiredSourcesForGroundingIntents,
  };
});

import { moduleAIContextService } from '../../services/ModuleAIContextService';
import { getEffectivePipelineCatalog } from '../../pipeline/pipelineCatalogService';
import { loadInstalledRegistryProviders } from '../contextProviderRegistry';
import { fetchRegisteredProviderContext } from '../fetchModuleContextProvider';
import { buildSkimUserContext } from '../lazyUserContext';
import { orchestrateContextRetrieval } from '../ContextProviderOrchestrator';
import { normalizeRegistryProvider } from '../contextProviderRegistry';
import { buildProviderSelectionPlan } from '../contextProviderSelection';
import { DEFAULT_PIPELINE_GROUNDING_RULES } from '../../pipeline/pipelineCatalogDefaults';
import type { UserContext } from '../CrossModuleContextEngine';

const skimContext: UserContext = {
  userId: 'user-1',
  timestamp: new Date(),
  activeModules: ['drive'],
  crossModuleInsights: [],
  currentFocus: { module: 'dashboard', activity: 'overview', priority: 'medium', timeSpent: 0 },
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

function catalog() {
  return {
    intents: [
      {
        id: 'local_discovery',
        name: 'Local',
        description: '',
        triggerExamples: [],
        groundingRequired: true,
        enabled: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
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
    enforcement: { enforcementEnabled: true, enforcementMode: 'block' as const },
    weakPhrases: [],
  };
}

describe('ContextProviderOrchestrator', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const selectionActual = await vi.importActual<typeof import('../contextProviderSelection')>(
      '../contextProviderSelection'
    );
    vi.mocked(buildProviderSelectionPlan).mockImplementation(
      selectionActual.buildProviderSelectionPlan
    );

    vi.mocked(buildSkimUserContext).mockResolvedValue(skimContext);
    vi.mocked(getEffectivePipelineCatalog).mockResolvedValue(catalog() as never);

    const placeProvider = normalizeRegistryProvider('place', 'Place', {
      name: 'place_discoveries',
      endpoint: '/api/place/ai/context/discoveries',
      cacheDuration: 300000,
    });

    vi.mocked(loadInstalledRegistryProviders).mockResolvedValue({
      installedModuleIds: ['place', 'drive'],
      providersByModule: new Map([
        ['place', [placeProvider]],
        [
          'drive',
          [
            normalizeRegistryProvider('drive', 'Drive', {
              name: 'recent_files',
              endpoint: '/api/drive/ai/context/recent',
              cacheDuration: 300000,
            }),
          ],
        ],
      ]),
      moduleNames: new Map([
        ['place', 'Place'],
        ['drive', 'Drive'],
      ]),
    });
  });

  it('assigns a unique contextGenerationId per orchestration pass', async () => {
    vi.mocked(moduleAIContextService.analyzeQuery).mockResolvedValue({
      query: 'hello',
      matchedModules: [],
      suggestedContextProviders: [],
    });

    const result = await orchestrateContextRetrieval({
      userId: 'user-1',
      query: 'hello',
    });

    expect(result.contextOrchestration.contextGenerationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('uses lazy skim fullContext without deep profile queries', async () => {
    vi.mocked(moduleAIContextService.analyzeQuery).mockResolvedValue({
      query: 'hello',
      matchedModules: [],
      suggestedContextProviders: [],
    });

    await orchestrateContextRetrieval({ userId: 'user-1', query: 'hello' });

    expect(buildSkimUserContext).toHaveBeenCalledWith('user-1');
  });

  it('records required source failure when required provider errors under block enforcement', async () => {
    const placeProvider = normalizeRegistryProvider('place', 'Place', {
      name: 'place_discoveries',
      endpoint: '/api/place/ai/context/discoveries',
      cacheDuration: 300000,
    });

    vi.mocked(buildProviderSelectionPlan).mockReturnValue({
      required: [
        {
          provider: placeProvider,
          requiredForGrounding: true,
          groundingSourceId: 'vssyl_place',
        },
      ],
      optional: [],
      diagnostics: [],
    });

    vi.mocked(moduleAIContextService.analyzeQuery).mockResolvedValue({
      query: 'clubs near me',
      matchedModules: [],
      suggestedContextProviders: [],
    });

    vi.mocked(fetchRegisteredProviderContext).mockResolvedValue({
      providerId: 'place.place_discoveries',
      module: 'place',
      status: 'error',
      contextBlocks: [],
      diagnostics: { errorCode: 'timeout', warnings: ['timeout'] },
    });

    const result = await orchestrateContextRetrieval({
      userId: 'user-1',
      query: 'yoga clubs near me',
      enforcementSettings: { enforcementEnabled: true, enforcementMode: 'block' },
    });

    expect(result.requiredSourceFailures).toContain('vssyl_place');
    expect(result.groundingFailure).toBe(true);
  });

  it('does not set groundingFailure when enforcement is off and optional provider fails', async () => {
    vi.mocked(moduleAIContextService.analyzeQuery).mockResolvedValue({
      query: 'show my files',
      matchedModules: [
        {
          moduleId: 'drive',
          moduleName: 'Drive',
          confidence: 0.9,
          matchedKeywords: ['files'],
          matchedPatterns: [],
          relevance: 'high',
        },
      ],
      suggestedContextProviders: [],
    });

    vi.mocked(fetchRegisteredProviderContext).mockResolvedValue({
      providerId: 'drive.recent_files',
      module: 'drive',
      status: 'error',
      contextBlocks: [],
      diagnostics: { errorCode: 'network', warnings: ['down'] },
    });

    const result = await orchestrateContextRetrieval({
      userId: 'user-1',
      query: 'show my files',
      enforcementSettings: { enforcementEnabled: false, enforcementMode: 'off' },
    });

    expect(result.groundingFailure).toBe(false);
    expect(result.providerFetchAudit.some((a) => a.status === 'failed')).toBe(true);
  });

  it('emits provider selection diagnostics for skipped and selected providers', async () => {
    vi.mocked(moduleAIContextService.analyzeQuery).mockResolvedValue({
      query: 'show my files',
      matchedModules: [
        {
          moduleId: 'drive',
          moduleName: 'Drive',
          confidence: 0.9,
          matchedKeywords: ['files'],
          matchedPatterns: [],
          relevance: 'high',
        },
      ],
      suggestedContextProviders: [],
    });

    vi.mocked(fetchRegisteredProviderContext).mockResolvedValue({
      providerId: 'drive.recent_files',
      module: 'drive',
      status: 'hit',
      contextBlocks: [{ type: 'module_context', content: '{}' }],
      data: { files: [] },
    });

    const result = await orchestrateContextRetrieval({
      userId: 'user-1',
      query: 'show my files',
    });

    expect(result.providerSelectionDiagnostics.some((d) => d.phase === 'selected')).toBe(
      true
    );
  });
});
