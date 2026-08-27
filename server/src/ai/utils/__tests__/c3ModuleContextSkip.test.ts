/**
 * C3 — Skip MODULE ContextProvider orchestration for safe conversation turns.
 * Mechanical eligibility + Core call-count proof. Does not change contracts/routing.
 */
import { describe, expect, it, vi, beforeEach, type MockInstance } from 'vitest';
import { shouldRetrieveModuleContext } from '../shouldRetrieveModuleContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { DigitalLifeTwinCore } from '../../core/DigitalLifeTwinCore';
import type { CrossModuleContextEngine } from '../../context/CrossModuleContextEngine';
import * as pipelineGrounding from '../../pipeline/pipelineGroundingRetrieval';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

function resolve(query: string, opts?: {
  businessId?: string;
  currentModule?: string;
  fileIds?: string[];
  historyLength?: number;
}) {
  return inferStructuredResponseMode({
    query,
    businessId: opts?.businessId,
    currentModule: opts?.currentModule,
    fileIds: opts?.fileIds,
    hasAttachedFiles: Boolean(opts?.fileIds?.length),
    isFollowUp: (opts?.historyLength ?? 0) > 0,
  });
}

function hasFiles(fileIds?: string[]): boolean {
  return Array.isArray(fileIds) && fileIds.some((id) => typeof id === 'string' && id.trim() !== '');
}

describe('C3 — shouldRetrieveModuleContext eligibility', () => {
  const skipQueries = [
    'Why does salt melt ice?',
    'Explain photosynthesis.',
    'What is a mortgage?',
    'How does a heat pump work?',
    // Note: "pros and cons of …" currently routes to enterprise comparison (pre-existing
    // ENTERPRISE_COMPARISON_DELIVERABLE) — not C3-eligible until contract is conversation.
    'What washing machine should I buy?',
    'What should I look for in a washing machine?',
    'Which laptop should I get?',
    'Where should I go in October?',
    'Which house would you choose?',
    'What washing machine did I say I liked?',
    'What house budget did I tell you?',
    'Help me with my school paper.',
    'Explain fixed versus adjustable mortgages.',
  ] as const;

  it.each(skipQueries)('SKIP eligible: %s', (q) => {
    const r = resolve(q);
    expect(shouldRetrieveModuleContext(r, false)).toBe(false);
  });

  it('pros-and-cons product wording is enterprise comparison today → do not skip', () => {
    const r = resolve('What are the pros and cons of front-load washers?');
    expect(r.responseContract).not.toBe('conversation');
    expect(shouldRetrieveModuleContext(r, false)).toBe(true);
  });

  it('SKIP: personal recall + businessId', () => {
    const r = resolve('What house budget did I tell you?', { businessId: BIZ });
    expect(r.requiresAuthoritativeContext).toBe(false);
    expect(r.responseContract).toBe('conversation');
    expect(shouldRetrieveModuleContext(r, false)).toBe(false);
  });

  it('SKIP: HR module + unrelated recommendation', () => {
    const r = resolve('What washing machine should I buy?', { currentModule: 'hr', businessId: BIZ });
    expect(r.requiresAuthoritativeContext).toBe(false);
    expect(shouldRetrieveModuleContext(r, false)).toBe(false);
  });

  it('SKIP: Calendar + school paper', () => {
    const r = resolve('Help me with my school paper.', { currentModule: 'calendar' });
    expect(shouldRetrieveModuleContext(r, false)).toBe(false);
  });

  it('SKIP: Drive + mortgage explanation', () => {
    const r = resolve('Explain fixed versus adjustable mortgages.', { currentModule: 'drive' });
    expect(shouldRetrieveModuleContext(r, false)).toBe(false);
  });

  const doNotSkip: Array<{ q: string; opts?: Parameters<typeof resolve>[1] }> = [
    { q: "What's on my calendar today?" },
    { q: "What's my next meeting?" },
    { q: 'Am I free tomorrow?' },
    { q: 'What files do I have?' },
    { q: 'What files are shared with me?' },
    { q: 'What tasks are waiting for me?' },
    { q: 'Are we over budget?', opts: { businessId: BIZ } },
    { q: 'Are we fully staffed?', opts: { businessId: BIZ } },
    { q: "Who's out today?", opts: { businessId: BIZ } },
    { q: "What's our labor budget?", opts: { businessId: BIZ } },
    { q: 'Give me an HR overview.', opts: { businessId: BIZ } },
    { q: 'How many employees do we have?', opts: { businessId: BIZ } },
    { q: 'Who is my manager?', opts: { businessId: BIZ } },
    { q: "What's my job title?", opts: { businessId: BIZ } },
    { q: 'What files did Sarah share with me?' },
    { q: 'Who owns this file?' },
    { q: 'What did Sarah send me?' },
    { q: "What's next?", opts: { currentModule: 'calendar' } },
    { q: "What's new?", opts: { currentModule: 'drive' } },
    { q: 'How many?', opts: { currentModule: 'hr', businessId: BIZ } },
    { q: 'Message Sarah.' },
    { q: 'Tell Sarah I\'ll be late.' },
    { q: 'Share this with Sarah.' },
    { q: 'What needs my attention?' },
    { q: "What's going on?" },
    { q: "What's going on today?" },
    { q: 'Are there any problems?' },
    { q: 'Anything I should know?' },
    { q: 'Anything important?' },
    { q: 'What changed?' },
    { q: 'What changed since yesterday?' },
    { q: 'Explain this PDF.', opts: { fileIds: ['file-1'] } },
    { q: 'Explain that more simply.', opts: { historyLength: 2 } },
  ];

  it.each(doNotSkip)('DO NOT SKIP: $q', ({ q, opts }) => {
    const r = resolve(q, opts);
    expect(shouldRetrieveModuleContext(r, hasFiles(opts?.fileIds))).toBe(true);
  });

  it('missing resolution → retrieve (safe)', () => {
    expect(shouldRetrieveModuleContext(undefined, false)).toBe(true);
  });

  it('B′ blocks skip while reqAuth stays false', () => {
    const r = resolve('What needs my attention?');
    expect(r.requiresAuthoritativeContext).toBe(false);
    expect(r.responseContract).toBe('conversation');
    expect(r.isBroadDiscovery).toBe(true);
    expect(shouldRetrieveModuleContext(r, false)).toBe(true);
  });

  it('follow-up blocks skip', () => {
    const r = resolve('Explain that more simply.', { historyLength: 2 });
    expect(r.isFollowUp).toBe(true);
    expect(shouldRetrieveModuleContext(r, false)).toBe(true);
  });

  it('attachments block skip even if contract conversation', () => {
    const r = resolve('Explain this PDF.', { fileIds: ['f1'] });
    expect(shouldRetrieveModuleContext(r, true)).toBe(true);
  });
});

describe('C3 — response-contract equivalence (routing axes unchanged)', () => {
  it.each([
    ['Why does salt melt ice?', 'conversation'],
    ['What washing machine should I buy?', 'conversation'],
    ['What washing machine did I say I liked?', 'conversation'],
    ["What's my next meeting?", 'grounded_answer'],
  ] as const)('%s → %s', (q, contract) => {
    const r = resolve(q);
    expect(r.responseContract).toBe(contract);
    // Gate does not mutate resolution
    shouldRetrieveModuleContext(r, false);
    expect(r.responseContract).toBe(contract);
  });
});

describe('C3 — Core getContextForAIQuery call counts', () => {
  const getContextForAIQuery = vi.fn().mockResolvedValue({
    query: 'q',
    moduleContexts: { calendar: { summary: 'meetings' } },
    relevantModuleCount: 1,
    fullContext: {
      userId: 'user-c3',
      timestamp: new Date(),
      activeModules: ['calendar'],
      crossModuleInsights: [],
      currentFocus: { module: 'calendar', activity: 'x', priority: 'medium', timeSpent: 0 },
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
        relationships: {
          score: 50,
          socialConnections: 0,
          communicationHealth: 0.5,
          networkGrowth: 0,
        },
        goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
      },
    },
  });

  const mockEngine = {
    getContextForAIQuery,
    getUserContext: vi.fn().mockResolvedValue(null),
  } as unknown as CrossModuleContextEngine;

  let core: DigitalLifeTwinCore;
  let groundingSpy: MockInstance<typeof pipelineGrounding.runPipelineGroundingRetrieval>;

  beforeEach(() => {
    getContextForAIQuery.mockClear();
    core = new DigitalLifeTwinCore(mockEngine);
    groundingSpy = vi.spyOn(pipelineGrounding, 'runPipelineGroundingRetrieval').mockResolvedValue({
      moduleContextsPatch: {},
      toolsUsed: [],
      contextRetrieved: [],
      sourcesUsed: [],
      requiredSourceFailures: [],
      staleContextWarnings: [],
    } as Awaited<ReturnType<typeof pipelineGrounding.runPipelineGroundingRetrieval>>);

    vi.spyOn(
      core as unknown as { callAIProvider: (...args: unknown[]) => Promise<unknown> },
      'callAIProvider'
    ).mockResolvedValue({
      response: 'ok',
      confidence: 0.9,
      metadata: { provider: 'openai' },
    });

    // Avoid deep personality / learning / DB side paths where practical
    vi.spyOn(
      core as unknown as {
        analyzeQuery: (...args: unknown[]) => Promise<unknown>;
      },
      'analyzeQuery'
    ).mockResolvedValue({
      queryType: 'question',
      scope: { type: 'general', modules: [] },
      urgency: 'low',
      relevantPatterns: [],
      relevantRelationships: [],
      requiresAction: false,
      complexity: 'low',
      responseMode: 'conversational',
    });

    vi.spyOn(
      core as unknown as {
        identifyCrossModuleConnections: (...args: unknown[]) => Promise<unknown>;
      },
      'identifyCrossModuleConnections'
    ).mockResolvedValue([]);

    vi.spyOn(
      core as unknown as { determineActions: (...args: unknown[]) => Promise<unknown> },
      'determineActions'
    ).mockResolvedValue([]);

    // Avoid personality profile FK writes for synthetic userId
    const personalityEngine = (core as unknown as {
      personalityEngine: { getPersonalityProfile: (...a: unknown[]) => Promise<unknown> };
    }).personalityEngine;
    vi.spyOn(personalityEngine, 'getPersonalityProfile').mockResolvedValue({
      userId: 'user-c3',
      preferences: {},
      traits: {},
    });

    const prisma = (core as unknown as { prisma: Record<string, unknown> }).prisma;
    vi.spyOn(prisma.user as { findUnique: (...a: unknown[]) => Promise<unknown> }, 'findUnique').mockResolvedValue({
      name: 'Test',
      email: 't@example.com',
    });
    vi.spyOn(
      prisma.userAIContext as { findMany: (...a: unknown[]) => Promise<unknown> },
      'findMany'
    ).mockResolvedValue([]);
    vi.spyOn(
      prisma.globalPattern as { findMany: (...a: unknown[]) => Promise<unknown> },
      'findMany'
    ).mockResolvedValue([]);
  });

  async function runCore(
    queryText: string,
    opts?: {
      businessId?: string;
      currentModule?: string;
      fileIds?: string[];
      history?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
      userMemoryFacts?: unknown[];
      recalledMessages?: unknown[];
    }
  ) {
    const history = opts?.history ?? [];
    const structuredResolution = inferStructuredResponseMode({
      query: queryText,
      isFollowUp: history.length > 0,
      fileIds: opts?.fileIds,
      hasAttachedFiles: Boolean(opts?.fileIds?.length),
      businessId: opts?.businessId,
      currentModule: opts?.currentModule ?? 'ai-chat',
    });

    return core.processAsDigitalTwin({
      query: queryText,
      userId: 'user-c3',
      structuredResolution,
      conversationHistory: history,
      context: {
        currentModule: opts?.currentModule ?? 'ai-chat',
        ...(opts?.businessId ? { businessId: opts.businessId } : {}),
        ...(opts?.fileIds ? { fileIds: opts.fileIds } : {}),
        ...(opts?.userMemoryFacts ? { userMemoryFacts: opts.userMemoryFacts } : {}),
        ...(opts?.recalledMessages ? { recalledMessages: opts.recalledMessages } : {}),
      },
    });
  }

  const skipCases: Array<{
    name: string;
    q: string;
    opts?: Parameters<typeof runCore>[1];
  }> = [
    { name: 'salt', q: 'Why does salt melt ice?' },
    { name: 'washer recommend', q: 'What washing machine should I buy?' },
    { name: 'washer recall', q: 'What washing machine did I say I liked?' },
    {
      name: 'recall + businessId',
      q: 'What house budget did I tell you?',
      opts: { businessId: BIZ },
    },
    {
      name: 'HR + washer buy',
      q: 'What washing machine should I buy?',
      opts: { currentModule: 'hr', businessId: BIZ },
    },
    {
      name: 'Calendar + school paper',
      q: 'Help me with my school paper.',
      opts: { currentModule: 'calendar' },
    },
  ];

  it.each(skipCases)('SKIP call count 0: $name', async ({ q, opts }) => {
    await runCore(q, opts);
    expect(getContextForAIQuery).toHaveBeenCalledTimes(0);
  });

  const retrieveCases: Array<{
    name: string;
    q: string;
    opts?: Parameters<typeof runCore>[1];
  }> = [
    { name: 'next meeting', q: "What's my next meeting?" },
    { name: 'shared files', q: 'What files are shared with me?' },
    { name: 'manager', q: 'Who is my manager?', opts: { businessId: BIZ } },
    { name: 'over budget', q: 'Are we over budget?', opts: { businessId: BIZ } },
    {
      name: 'W1 next',
      q: "What's next?",
      opts: { currentModule: 'calendar' },
    },
    { name: 'action', q: 'Message Sarah.' },
    {
      name: 'follow-up',
      q: 'Explain that more simply.',
      opts: {
        history: [
          { role: 'user', content: 'Explain compound interest.', timestamp: new Date(0) },
          { role: 'assistant', content: 'Prior.', timestamp: new Date(1) },
        ],
      },
    },
    {
      name: 'attachment',
      q: 'Explain this PDF.',
      opts: { fileIds: ['file-abc'] },
    },
    { name: 'B′ attention', q: 'What needs my attention?' },
  ];

  it.each(retrieveCases)('DO NOT SKIP call count 1: $name', async ({ q, opts }) => {
    await runCore(q, opts);
    expect(getContextForAIQuery).toHaveBeenCalledTimes(1);
  });

  it('personal recall preserves memory/history on query when module skip', async () => {
    const memory = [{ id: 'm1', content: 'Liked LG washer', confidence: 0.9 }];
    const recalled = [{ role: 'user', content: 'I like LG', snippet: 'I like LG' }];
    // Empty thread history: F-GUARD must not force retrieval; cross-session recall still on context.
    const history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }> = [];

    // Spy generate to capture LifeTwinQuery without full provider path complexity
    const generateSpy = vi
      .spyOn(
        core as unknown as {
          generateLifeTwinResponse: (...args: unknown[]) => Promise<unknown>;
        },
        'generateLifeTwinResponse'
      )
      .mockResolvedValue({
        response: 'You liked an LG washer.',
        confidence: 0.9,
        reasoning: [],
        personalityAlignment: 0.5,
        actions: [],
        insights: [],
        connections: [],
        metadata: { processingTime: 1, modulesAnalyzed: [], patternsUsed: [] },
      });

    await runCore('What washing machine did I say I liked?', {
      history,
      userMemoryFacts: memory,
      recalledMessages: recalled,
    });

    expect(getContextForAIQuery).toHaveBeenCalledTimes(0);
    expect(generateSpy).toHaveBeenCalled();
    const lifeTwinQuery = generateSpy.mock.calls[0]?.[0] as {
      conversationHistory?: unknown[];
      context: Record<string, unknown>;
      structuredResolution?: { responseContract?: string; isFollowUp?: boolean };
    };
    expect(lifeTwinQuery.structuredResolution?.responseContract).toBe('conversation');
    expect(lifeTwinQuery.structuredResolution?.isFollowUp).not.toBe(true);
    expect(lifeTwinQuery.context.userMemoryFacts).toEqual(memory);
    expect(lifeTwinQuery.context.recalledMessages).toEqual(recalled);
  });

  it('grounding prepass remains callable after module skip; live web runs with enforcement OFF', async () => {
    groundingSpy.mockClear();
    await runCore('Why does salt melt ice?');
    expect(getContextForAIQuery).toHaveBeenCalledTimes(0);
    expect(groundingSpy).not.toHaveBeenCalled();

    groundingSpy.mockClear();
    getContextForAIQuery.mockClear();
    await runCore('What are average mortgage rates today?');
    expect(getContextForAIQuery).toHaveBeenCalledTimes(0);
    expect(groundingSpy).toHaveBeenCalledTimes(1);
    expect(typeof pipelineGrounding.runPipelineGroundingRetrieval).toBe('function');
    expect(typeof pipelineGrounding.shouldRunPipelineGroundingRetrieval).toBe('function');
  });
});
