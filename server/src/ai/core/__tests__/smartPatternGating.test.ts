import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DigitalLifeTwinCore } from '../DigitalLifeTwinCore';
import type { UserContext } from '../../context/CrossModuleContextEngine';
import * as structuredResponseMode from '../../utils/structuredResponseMode';
import * as AIContextAssembler from '../../context/AIContextAssembler';

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
  userId: 'user-gate-test',
  activeModules: ['ai-chat'],
  currentFocus: { module: 'ai-chat' },
  preferences: {},
  patterns: [],
  relationships: [],
  crossModuleInsights: [],
};

type GenerateLifeTwinResponse = (
  query: Parameters<DigitalLifeTwinCore['processAsDigitalTwin']>[0] extends never
    ? never
    : import('../DigitalLifeTwinCore').LifeTwinQuery,
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
  crossModuleSynthesis?: unknown,
  conversationReasoning?: unknown
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
      userId: 'user-gate-test',
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

describe('Package B — SmartPattern / semantic gating', () => {
  let core: DigitalLifeTwinCore;
  let analyzeSpy: ReturnType<typeof vi.fn>;
  let enhanceSpy: ReturnType<typeof vi.fn>;
  let structuredModeSpy: ReturnType<typeof vi.spyOn>;
  let assembleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    core = new DigitalLifeTwinCore();
    assembleSpy = vi.spyOn(AIContextAssembler, 'assembleAIContext');
    analyzeSpy = vi.fn().mockResolvedValue({
      patterns: [
        {
          id: 'p1',
          userId: 'user-gate-test',
          type: 'behavioral',
          pattern: 'test',
          confidence: 0.8,
          frequency: 1,
          lastSeen: new Date(),
          metadata: {},
        },
      ],
      predictions: [],
      suggestions: [],
    });
    enhanceSpy = vi.fn().mockResolvedValue({
      originalQuery: 'q',
      enhancedContext: 'q',
      relatedQueries: [],
      confidenceBoost: 0,
      suggestedCategories: ['general'],
    });
    (
      core as unknown as {
        smartPatternEngine: {
          analyzeAndPredict: typeof analyzeSpy;
          enhanceQueryWithSemantics: typeof enhanceSpy;
        };
      }
    ).smartPatternEngine = {
      analyzeAndPredict: analyzeSpy,
      enhanceQueryWithSemantics: enhanceSpy,
    };
    vi.spyOn(
      core as unknown as { callAIProvider: (...args: unknown[]) => Promise<unknown> },
      'callAIProvider'
    ).mockResolvedValue({
      response: 'Test response',
      confidence: 0.8,
      metadata: { provider: 'openai' },
    });
    structuredModeSpy = vi.spyOn(structuredResponseMode, 'inferStructuredResponseMode');
  });

  const cases = [
    { name: 'conversation (salt)', query: 'Why does salt melt ice?', analyze: 0, enhance: 0 },
    {
      name: 'conversation (EBITDA)',
      query: 'Explain the difference between gross profit and EBITDA.',
      analyze: 0,
      enhance: 0,
    },
    {
      name: 'conversation (travel)',
      query: 'Where should I go for a relaxing three-day trip?',
      analyze: 0,
      enhance: 0,
    },
    {
      name: 'grounded (labor budget)',
      query: "What's our current labor budget?",
      businessId: 'biz1',
      analyze: 0,
      enhance: 0,
    },
    {
      name: 'enterprise non-action (labor compare)',
      query: 'Compare actual labor cost against budget.',
      businessId: 'biz1',
      analyze: 1,
      enhance: 1,
    },
    {
      name: 'enterprise action (meeting)',
      query: 'Move my 2 PM meeting to 3 PM.',
      analyze: 0,
      enhance: 0,
    },
  ] as const;

  for (const c of cases) {
    it(`${c.name}: analyze=${c.analyze}, enhance=${c.enhance}`, async () => {
      analyzeSpy.mockClear();
      enhanceSpy.mockClear();
      structuredModeSpy.mockClear();

      await runGenerateWithQuery(core, c.query, 'businessId' in c ? { businessId: c.businessId } : undefined);

      expect(analyzeSpy).toHaveBeenCalledTimes(c.analyze);
      expect(enhanceSpy).toHaveBeenCalledTimes(c.enhance);
      expect(structuredModeSpy).toHaveBeenCalledTimes(1);
    });
  }

  it('enterprise action (meeting): assembled context omits SmartPattern/Semantic blocks', async () => {
    analyzeSpy.mockClear();
    enhanceSpy.mockClear();
    assembleSpy.mockClear();

    await runGenerateWithQuery(core, 'Move my 2 PM meeting to 3 PM.');

    expect(analyzeSpy).toHaveBeenCalledTimes(0);
    expect(enhanceSpy).toHaveBeenCalledTimes(0);

    const assemblyInput = assembleSpy.mock.calls[0]?.[0];
    expect(assemblyInput?.smartAnalysis).toBeUndefined();
    expect(assemblyInput?.semanticEnhancement).toBeUndefined();

    const titles = (assemblyInput ? assembleSpy.mock.results[0]?.value : undefined)?.contextBlocks?.map(
      (b: { title: string }) => b.title
    ) ?? [];
    expect(titles).not.toContain('Smart pattern analysis');
    expect(titles).not.toContain('Semantic enhancement');

    const evidenceLabels =
      assembleSpy.mock.results[0]?.value?.evidence?.map((e: { label: string }) => e.label) ?? [];
    expect(evidenceLabels).not.toContain('Smart pattern engine output');
    expect(evidenceLabels).not.toContain('Semantic query enhancement');
  });

  it('enterprise non-action (labor compare): stages run and SmartPattern/Semantic reach assembly', async () => {
    analyzeSpy.mockClear();
    enhanceSpy.mockClear();
    assembleSpy.mockClear();

    await runGenerateWithQuery(core, 'Compare actual labor cost against budget.', { businessId: 'biz1' });

    expect(analyzeSpy).toHaveBeenCalledTimes(1);
    expect(enhanceSpy).toHaveBeenCalledTimes(1);

    const assemblyInput = assembleSpy.mock.calls[0]?.[0];
    expect(assemblyInput?.smartAnalysis).toBeDefined();
    expect(assemblyInput?.semanticEnhancement).toBeDefined();

    const titles = assembleSpy.mock.results[0]?.value?.contextBlocks?.map(
      (b: { title: string }) => b.title
    ) ?? [];
    expect(titles).toContain('Smart pattern analysis');

    const evidenceLabels =
      assembleSpy.mock.results[0]?.value?.evidence?.map((e: { label: string }) => e.label) ?? [];
    expect(evidenceLabels).toContain('Smart pattern engine output');
    expect(evidenceLabels).toContain('Semantic query enhancement');
  });
});
