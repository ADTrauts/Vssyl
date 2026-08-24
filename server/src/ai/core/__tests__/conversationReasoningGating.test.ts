import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DigitalLifeTwinCore } from '../DigitalLifeTwinCore';
import type { UserContext } from '../../context/CrossModuleContextEngine';
import * as structuredResponseMode from '../../utils/structuredResponseMode';
import * as conversationReasoningLayer from '../../conversation/conversationReasoningLayer';
import * as buildProviderDataModule from '../../utils/buildProviderData';

const mockPipelineCatalog = vi.hoisted(() => ({
  enforcement: { enforcementEnabled: false, enforcementMode: 'off' as const },
  intents: [],
  contextSources: [],
  toolPolicies: [],
}));

vi.mock('../../pipeline/pipelineCatalogService', () => ({
  getEffectivePipelineCatalog: vi.fn().mockResolvedValue(mockPipelineCatalog),
}));

vi.mock('../../pipeline/buildPipelineEvidenceBundle', () => ({
  buildPipelineEvidenceBundle: vi.fn(() => ({
    assembledEvidence: [],
    assembledContextBlocks: [],
    assembledUsedModules: [],
    structuredEvidence: [],
    toolOutputs: [],
    retrievalRecords: [],
    sourcesUsed: [],
    memoryRetrieved: {},
    qualityWarnings: [],
  })),
}));

vi.mock('../../pipeline/buildPipelineTrace', () => ({
  buildPipelineTrace: vi.fn(() => ({
    traceId: 'test-trace',
    intentDetected: [],
    groundingRequired: false,
    retrievalPerformed: false,
    issues: [],
    genericResponseRisk: false,
    finalResponsePreview: '',
    enforcementApplied: false,
    enforcementAction: 'none',
    toolsUsed: [],
    contextRetrieved: [],
    sourcesUsed: [],
  })),
}));

const baseUserContext: UserContext = {
  userId: 'user-reasoning-gate',
  activeModules: ['ai-chat'],
  currentFocus: { module: 'ai-chat' },
  preferences: {},
  patterns: [],
  relationships: [],
  crossModuleInsights: [],
};

const BURNOUT_EXPLORE =
  "I'm feeling burnt out lately but I can't tell if I actually need rest or just a change of pace.";

type GenerateLifeTwinResponse = (
  query: import('../DigitalLifeTwinCore').LifeTwinQuery,
  userContext: UserContext,
  personality: Record<string, unknown>,
  analysis: Record<string, unknown>,
  userDefinedContext?: Array<Record<string, unknown>>,
  globalPatterns?: Array<Record<string, unknown>>,
  responseMode?: import('../../utils/responseMode').AIResponseMode,
  continuityState?: unknown,
  activeTopic?: unknown,
  attachedFiles?: unknown,
  visionImageParts?: unknown,
  traceContext?: { requestId?: string; conversationId?: string; userId?: string },
  streamOptions?: { stream: boolean; onChunk: (text: string) => void },
  moduleContexts?: Record<string, unknown>,
  effectivePreferences?: unknown,
  businessWorkspaceBoundaries?: unknown,
  crossModuleSynthesis?: unknown
) => Promise<Record<string, unknown>>;

async function runGenerateWithQuery(
  core: DigitalLifeTwinCore,
  queryText: string,
  options?: { businessId?: string }
): Promise<void> {
  const generate = (core as unknown as { generateLifeTwinResponse: GenerateLifeTwinResponse })
    .generateLifeTwinResponse.bind(core);

  await generate(
    {
      query: queryText,
      userId: 'user-reasoning-gate',
      context: {
        currentModule: 'ai-chat',
        ...(options?.businessId ? { businessId: options.businessId } : {}),
      },
    },
    baseUserContext,
    {},
    {
      queryType: 'question',
      scope: { type: 'single_module', modules: ['ai-chat'] },
      urgency: 'low',
      relevantPatterns: [],
      relevantRelationships: [],
      requiresAction: false,
      complexity: 'low',
      responseMode: 'conversational',
    }
  );
}

describe('Package C1 — conversation reasoning gating', () => {
  let core: DigitalLifeTwinCore;
  let reasoningSpy: ReturnType<typeof vi.spyOn>;
  let structuredModeSpy: ReturnType<typeof vi.spyOn>;
  let buildProviderDataSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    core = new DigitalLifeTwinCore();
    reasoningSpy = vi.spyOn(conversationReasoningLayer, 'runConversationReasoning');
    structuredModeSpy = vi.spyOn(structuredResponseMode, 'inferStructuredResponseMode');
    buildProviderDataSpy = vi.spyOn(buildProviderDataModule, 'buildProviderData');
    vi.spyOn(
      core as unknown as { callAIProvider: (...args: unknown[]) => Promise<unknown> },
      'callAIProvider'
    ).mockResolvedValue({
      response: 'Test response',
      confidence: 0.8,
      metadata: { provider: 'openai' },
    });
  });

  const cases = [
    { name: 'salt (conversation)', query: 'Why does salt melt ice?', reasoning: 1 },
    {
      name: 'travel recommendation (conversation)',
      query: 'Where should I go for a relaxing three-day trip?',
      reasoning: 1,
    },
    {
      name: 'explore/decide (conversation)',
      query: BURNOUT_EXPLORE,
      reasoning: 1,
    },
    {
      name: 'grounded labor budget',
      query: "What's our current labor budget?",
      businessId: 'biz1',
      reasoning: 0,
    },
    {
      name: 'enterprise labor compare',
      query: 'Compare actual labor cost against budget.',
      businessId: 'biz1',
      reasoning: 0,
    },
    {
      name: 'meeting action',
      query: 'Move my 2 PM meeting to 3 PM.',
      reasoning: 0,
    },
  ] as const;

  for (const c of cases) {
    it(`${c.name}: reasoning calls=${c.reasoning}`, async () => {
      reasoningSpy.mockClear();
      structuredModeSpy.mockClear();
      buildProviderDataSpy.mockClear();

      await runGenerateWithQuery(
        core,
        c.query,
        'businessId' in c ? { businessId: c.businessId } : undefined
      );

      expect(reasoningSpy).toHaveBeenCalledTimes(c.reasoning);
      expect(structuredModeSpy).toHaveBeenCalledTimes(1);

      const providerData = buildProviderDataSpy.mock.results.at(-1)?.value as
        | Record<string, unknown>
        | undefined;
      if (c.reasoning === 0) {
        expect(providerData?.conversationReasoning).toBeUndefined();
      } else {
        expect(providerData?.conversationReasoning).toBeDefined();
        expect(providerData?.responseContract).toBe('conversation');
      }
    });
  }
});
