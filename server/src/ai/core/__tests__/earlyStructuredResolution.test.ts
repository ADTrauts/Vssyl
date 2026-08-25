import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { DigitalLifeTwinService } from '../DigitalLifeTwinService';
import type { LifeTwinQuery } from '../DigitalLifeTwinCore';
import * as structuredResponseMode from '../../utils/structuredResponseMode';
import * as responseModeModule from '../../utils/responseMode';
import * as conversationMemoryService from '../../../services/aiConversationMemoryService';
import * as messageRecallService from '../../../services/aiMessageRecallService';
import * as memoryRetrievalModule from '../../memory/MemoryRetrievalService';
import { resolveContextProfile } from '../../context/contextProfile';

const callOrder: string[] = [];

vi.mock('../../../services/aiConversationMemoryService', () => ({
  getRecentConversationMemory: vi.fn(async () => {
    callOrder.push('recentConversationMemory');
    return [];
  }),
}));

vi.mock('../../../services/aiMessageRecallService', () => ({
  hasExplicitRecallIntent: vi.fn(() => false),
  recallRelevantMessages: vi.fn(async () => {
    callOrder.push('recallRelevantMessages');
    return [];
  }),
}));

vi.mock('../../memory/MemoryRetrievalService', () => ({
  memoryRetrievalService: {
    retrieve: vi.fn(async () => {
      callOrder.push('memoryRetrieval');
      return { facts: [], report: undefined };
    }),
  },
}));

vi.mock('../../../services/userMemoryFactService', () => ({
  maybePersistRememberThatFact: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../providers/OpenAIProvider', () => ({ OpenAIProvider: vi.fn() }));
vi.mock('../providers/AnthropicProvider', () => ({ AnthropicProvider: vi.fn() }));
vi.mock('../providers/LocalProvider', () => ({ LocalProvider: vi.fn() }));
vi.mock('../privacy/PrivacyDataRouter', () => ({ PrivacyDataRouter: vi.fn() }));
vi.mock('./PersonalityEngine', () => ({ PersonalityEngine: vi.fn() }));
vi.mock('./DecisionEngine', () => ({ DecisionEngine: vi.fn() }));
vi.mock('./LearningEngine', () => ({ LearningEngine: vi.fn() }));
vi.mock('./ActionExecutor', () => ({ ActionExecutor: vi.fn() }));
vi.mock('../context/CrossModuleContextEngine', () => ({ CrossModuleContextEngine: vi.fn() }));

const processAsDigitalTwinMock = vi.fn(async (_query: LifeTwinQuery) => {
  callOrder.push('core');
  return {
    response: 'ok',
    confidence: 1,
    metadata: { provider: 'test', model: 'test', tokens: 0, cost: 0, processingTime: 0 },
  };
});

vi.mock('../DigitalLifeTwinCore', () => ({
  DigitalLifeTwinCore: vi.fn().mockImplementation(() => ({
    processAsDigitalTwin: processAsDigitalTwinMock,
  })),
}));

type RoutingHelper = {
  resolveCanonicalTwinRouting: (
    query: string,
    context: Record<string, unknown>,
    conversationHistory: unknown[]
  ) => {
    resolvedResponseMode: string;
    structuredResolution: ReturnType<typeof structuredResponseMode.inferStructuredResponseMode>;
  };
};

describe('Package C2 — early structured resolution', () => {
  let service: DigitalLifeTwinService;
  let structuredSpy: MockInstance<typeof structuredResponseMode.inferStructuredResponseMode>;
  let responseModeSpy: MockInstance<typeof responseModeModule.inferResponseMode>;

  beforeEach(() => {
    callOrder.length = 0;
    processAsDigitalTwinMock.mockClear();
    service = new DigitalLifeTwinService({
      aIConversation: { findFirst: vi.fn().mockResolvedValue(null) },
      aIMessage: { findMany: vi.fn().mockResolvedValue([]) },
    } as never);

    const originalStructured = structuredResponseMode.inferStructuredResponseMode;
    structuredSpy = vi
      .spyOn(structuredResponseMode, 'inferStructuredResponseMode')
      .mockImplementation((input) => {
        callOrder.push('inferStructuredResponseMode');
        return originalStructured(input);
      });

    const originalResponseMode = responseModeModule.inferResponseMode;
    responseModeSpy = vi.spyOn(responseModeModule, 'inferResponseMode').mockImplementation((input) => {
      callOrder.push('inferResponseMode');
      return originalResponseMode(input);
    });
  });

  it('resolves routing after history load and before memory retrieval', async () => {
    await service.processAsDigitalLifeTwin('Why does salt melt ice?', 'user-c2');

    expect(callOrder.indexOf('inferResponseMode')).toBeGreaterThanOrEqual(0);
    expect(callOrder.indexOf('inferStructuredResponseMode')).toBeGreaterThan(
      callOrder.indexOf('inferResponseMode')
    );
    expect(callOrder.indexOf('recentConversationMemory')).toBeGreaterThan(
      callOrder.indexOf('inferStructuredResponseMode')
    );
    expect(callOrder.indexOf('recallRelevantMessages')).toBeGreaterThan(
      callOrder.indexOf('inferStructuredResponseMode')
    );
    expect(callOrder.indexOf('memoryRetrieval')).toBeGreaterThan(
      callOrder.indexOf('inferStructuredResponseMode')
    );
    expect(callOrder.indexOf('core')).toBeGreaterThan(callOrder.indexOf('memoryRetrieval'));

    expect(responseModeSpy).toHaveBeenCalledTimes(1);
    expect(structuredSpy).toHaveBeenCalledTimes(1);

    const lifeTwinQuery = processAsDigitalTwinMock.mock.calls[0]?.[0] as LifeTwinQuery;
    expect(lifeTwinQuery.structuredResolution).toBeDefined();
    expect(lifeTwinQuery.resolvedResponseMode).toBeDefined();
    expect(lifeTwinQuery.structuredResolution?.responseContract).toBe('conversation');
  });

  it('streaming path uses the same early resolution ordering', async () => {
    const res = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    callOrder.length = 0;
    await service.processAsDigitalLifeTwinStreaming(
      "What's our current labor budget?",
      'user-c2-stream',
      { businessId: 'biz1' },
      res
    );

    expect(structuredSpy).toHaveBeenCalledTimes(1);
    expect(responseModeSpy).toHaveBeenCalledTimes(1);
    expect(callOrder.indexOf('inferStructuredResponseMode')).toBeLessThan(
      callOrder.indexOf('recentConversationMemory')
    );

    const lifeTwinQuery = processAsDigitalTwinMock.mock.calls[0]?.[0] as LifeTwinQuery;
    expect(lifeTwinQuery.structuredResolution?.responseContract).toBe('grounded_answer');
  });

  const matrix = [
    {
      name: 'salt',
      query: 'Why does salt melt ice?',
      context: {},
      contract: 'conversation',
      reqAuth: false,
      isAction: false,
      profile: 'conversation',
    },
    {
      name: 'EBITDA',
      query: 'Explain the difference between gross profit and EBITDA.',
      context: {},
      contract: 'conversation',
      reqAuth: false,
      isAction: false,
      profile: 'conversation',
    },
    {
      name: 'travel',
      query: 'Where should I go for a relaxing three-day trip?',
      context: {},
      contract: 'conversation',
      reqAuth: false,
      isAction: false,
      profile: 'conversation',
    },
    {
      name: 'labor budget',
      query: "What's our current labor budget?",
      context: { businessId: 'biz1' },
      contract: 'grounded_answer',
      reqAuth: true,
      isAction: false,
      profile: 'grounded',
    },
    {
      name: 'meetings tomorrow',
      query: 'What meetings do I have tomorrow?',
      context: {},
      contract: 'grounded_answer',
      reqAuth: true,
      isAction: false,
      profile: 'grounded',
    },
    {
      name: 'Sarah files',
      query: 'What files did Sarah share with me?',
      context: {},
      contract: 'grounded_answer',
      reqAuth: true,
      isAction: false,
      profile: 'grounded',
    },
    {
      name: 'labor compare',
      query: 'Compare actual labor cost against budget.',
      context: { businessId: 'biz1' },
      contract: 'enterprise',
      reqAuth: true,
      isAction: false,
      profile: 'enterprise',
    },
    {
      name: 'meeting action',
      query: 'Move my 2 PM meeting to 3 PM.',
      context: {},
      contract: 'enterprise',
      reqAuth: false,
      isAction: true,
      profile: 'enterprise',
    },
    {
      name: 'attached file',
      query: 'Summarize this attached file.',
      context: { fileIds: ['file-1'] },
      contract: 'grounded_answer',
      reqAuth: true,
      isAction: false,
      profile: 'grounded',
    },
    {
      name: 'business salt',
      query: 'Why does salt melt ice?',
      context: { businessId: 'biz1' },
      contract: 'conversation',
      reqAuth: false,
      isAction: false,
      profile: 'conversation',
    },
    {
      name: 'calendar salt',
      query: 'Why does salt melt ice?',
      context: { currentModule: 'calendar' },
      contract: 'conversation',
      reqAuth: false,
      isAction: false,
      profile: 'conversation',
    },
    {
      name: 'calendar schedule',
      query: 'What meetings do I have tomorrow?',
      context: { currentModule: 'calendar' },
      contract: 'grounded_answer',
      reqAuth: true,
      isAction: false,
      profile: 'grounded',
    },
  ] as const;

  for (const row of matrix) {
    it(`routing matrix: ${row.name}`, () => {
      const helper = service as unknown as RoutingHelper;
      const { structuredResolution } = helper.resolveCanonicalTwinRouting(
        row.query,
        row.context,
        []
      );

      expect(structuredResolution.responseContract).toBe(row.contract);
      expect(structuredResolution.requiresAuthoritativeContext).toBe(row.reqAuth);
      expect(structuredResolution.isActionRequest).toBe(row.isAction);
      expect(
        resolveContextProfile(structuredResolution.mode, {
          responseContract: structuredResolution.responseContract,
          requiresAuthoritativeContext: structuredResolution.requiresAuthoritativeContext,
        })
      ).toBe(row.profile);
    });
  }
});
