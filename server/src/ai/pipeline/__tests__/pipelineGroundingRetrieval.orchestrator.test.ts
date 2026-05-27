import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../services/geolocationService', () => ({
  geolocationService: {
    detectUserLocation: vi.fn(),
  },
}));

vi.mock('../../context/ContextProviderOrchestrator', () => ({
  orchestratePipelineModuleSources: vi.fn(),
}));

vi.mock('../../context/vlinkPipelineContextService', async () => {
  const actual = await vi.importActual<typeof import('../../context/vlinkPipelineContextService')>(
    '../../context/vlinkPipelineContextService'
  );
  return {
    ...actual,
    fetchVLinkPipelineContext: vi.fn(),
  };
});

import { geolocationService } from '../../../services/geolocationService';
import { orchestratePipelineModuleSources } from '../../context/ContextProviderOrchestrator';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';
import { DEFAULT_PIPELINE_GROUNDING_RULES } from '../pipelineCatalogDefaults';

function minimalCatalog() {
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
    contextSources: [
      {
        id: 'location',
        label: 'Location',
        description: '',
        enabled: true,
        wiredInTwin: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vssyl_place',
        label: 'Place',
        description: '',
        enabled: true,
        wiredInTwin: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'drive_files',
        label: 'Drive',
        description: '',
        enabled: true,
        wiredInTwin: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'calendar',
        label: 'Calendar',
        description: '',
        enabled: true,
        wiredInTwin: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vlink',
        label: 'V_Link',
        description: '',
        enabled: true,
        wiredInTwin: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    toolPolicies: [
      {
        toolId: 'location',
        purpose: 'loc',
        requiredIntents: [],
        optionalIntents: [],
        requiredPermissions: [],
        fallbackBehavior: '',
        enabled: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        toolId: 'place_search',
        purpose: 'place',
        requiredIntents: [],
        optionalIntents: [],
        requiredPermissions: [],
        fallbackBehavior: '',
        enabled: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        toolId: 'list_drive_files',
        purpose: 'drive',
        requiredIntents: [],
        optionalIntents: [],
        requiredPermissions: [],
        fallbackBehavior: '',
        enabled: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        toolId: 'module_context',
        purpose: 'ctx',
        requiredIntents: [],
        optionalIntents: [],
        requiredPermissions: [],
        fallbackBehavior: '',
        enabled: true,
        isSystem: true,
        archived: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    enforcement: { enforcementEnabled: false, enforcementMode: 'off' as const },
    weakGenericPhrases: [],
  };
}

describe('pipelineGroundingRetrieval orchestrator integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geolocationService.detectUserLocation).mockResolvedValue({
      city: 'Austin',
      region: 'TX',
      country: 'US',
      latitude: 0,
      longitude: 0,
    } as never);
  });

  it('uses orchestrator for vssyl_place when place context is missing', async () => {
    vi.mocked(orchestratePipelineModuleSources).mockResolvedValue({
      query: 'clubs near me',
      analysis: { query: 'clubs near me', matchedModules: [], suggestedContextProviders: [] },
      fullContext: {} as never,
      moduleContexts: {
        place: { data: { items: [] }, providerName: 'place_discoveries' },
      },
      providerFetchAudit: [
        {
          moduleId: 'place',
          providerName: 'place_discoveries',
          status: 'succeeded',
          providerId: 'place.place_discoveries',
        },
      ],
      providerSelectionDiagnostics: [
        {
          providerId: 'place.place_discoveries',
          moduleId: 'place',
          providerName: 'place_discoveries',
          phase: 'selected',
        },
      ],
      installedModuleIds: ['place'],
      relevantModuleCount: 1,
      multiModuleIntent: false,
      timestamp: new Date(),
      contextOrchestration: {
        contextGenerationId: 'gen-place-1',
        generatedAt: new Date().toISOString(),
      },
      groundingFailure: false,
      requiredSourceFailures: [],
      staleContextWarnings: [],
      groundingSourceToProvider: [
        {
          sourceId: 'vssyl_place',
          providerId: 'place.place_discoveries',
          moduleId: 'place',
          providerName: 'place_discoveries',
        },
      ],
    });

    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'yoga clubs near me in my area',
      catalog: minimalCatalog() as never,
      clientIp: '127.0.0.1',
    });

    expect(orchestratePipelineModuleSources).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceIds: expect.arrayContaining(['vssyl_place']),
      })
    );
    expect(result.contextOrchestration?.contextGenerationId).toBe('gen-place-1');
    expect(result.moduleContextsPatch.place).toBeDefined();
    expect(result.sourcesUsed).toContain('vssyl_place');
  });

  it('skips orchestrator fetch when module context already exists', async () => {
    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'yoga near me',
      catalog: minimalCatalog() as never,
      existingModuleContexts: {
        place: { data: { cached: true }, providerName: 'place_discoveries' },
      },
    });

    expect(orchestratePipelineModuleSources).not.toHaveBeenCalled();
    expect(result.sourcesUsed).toContain('vssyl_place');
  });

  it('still resolves location without orchestrator', async () => {
    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'restaurants near me',
      catalog: minimalCatalog() as never,
      clientIp: '127.0.0.1',
    });

    expect(result.locationSummary).toContain('Austin');
    expect(result.sourcesUsed).toContain('location');
  });
});
