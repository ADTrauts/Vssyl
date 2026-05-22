import { describe, expect, it } from 'vitest';
import {
  buildContextDensityReport,
  classifyProviderFailure,
  toContextDensitySummary,
} from '../contextDensityReport';
import type { AIAssembledContext } from '../AIContextAssembler';

function minimalAssembled(overrides?: Partial<AIAssembledContext>): AIAssembledContext {
  return {
    scope: 'personal',
    usedModules: ['dashboard'],
    evidence: [],
    contextBlocks: [
      {
        title: 'Active modules and current focus',
        sourceType: 'module',
        content: {},
        priority: 'high',
        tier: 'tier4_cross_module',
        budgetTokensEstimate: 120,
      },
      {
        title: 'Collective learning patterns',
        sourceType: 'system',
        content: {},
        priority: 'low',
        tier: 'tier4_cross_module',
        budgetTokensEstimate: 40,
      },
    ],
    assumptions: [],
    risks: [],
    missingContext: ['No specific module context was supplied beyond defaults.'],
    assemblyMetrics: {
      blocksLoaded: 8,
      blocksAfterProfile: 6,
      blocksRanked: 5,
      blocksInjected: 2,
      profileExcludedCount: 2,
      contextBudgetTokens: 6000,
      tokensUsedEstimate: 160,
      moduleContextsLoaded: 1,
      moduleBlocksLoaded: 1,
      matchedHighRelevance: 1,
      memoryFactsLoaded: 3,
      memoryFactsInjected: 2,
      recalledMessagesLoaded: 0,
    },
    ...overrides,
  };
}

describe('contextDensityReport', () => {
  it('classifies provider failures', () => {
    expect(classifyProviderFailure({ code: 'ECONNABORTED' }).reason).toBe('timeout');
    expect(classifyProviderFailure({ response: { status: 404 } }).reason).toBe('not_found');
    expect(classifyProviderFailure({ response: { status: 401 } }).reason).toBe('auth');
  });

  it('builds provider, memory, and block counts', () => {
    const report = buildContextDensityReport({
      assembled: minimalAssembled(),
      providerFetchAudit: [
        {
          moduleId: 'drive',
          providerName: 'recent_files',
          status: 'succeeded',
          cacheHit: true,
          latencyMs: 12,
        },
        {
          moduleId: 'todo',
          providerName: 'overview',
          status: 'failed',
          failureReason: 'timeout',
          failureMessage: 'Provider request timed out',
        },
      ],
      assemblyMetrics: minimalAssembled().assemblyMetrics,
    });

    expect(report.providers.succeeded).toBe(1);
    expect(report.providers.failed).toBe(1);
    expect(report.providers.cacheHits).toBe(1);
    expect(report.memory.factsLoaded).toBe(3);
    expect(report.memory.factsInjected).toBe(2);
    expect(report.blocks.synthetic).toBe(1);
    expect(report.blocks.live).toBe(1);
    expect(report.blocks.loaded).toBe(8);
    expect(report.blocks.injected).toBe(2);
  });

  it('summarizes for twin metadata', () => {
    const report = buildContextDensityReport({
      assembled: minimalAssembled(),
      providerFetchAudit: [],
    });
    const summary = toContextDensitySummary(report);
    expect(summary.blocksInjected).toBe(2);
    expect(summary.tokenBudget).toBe(6000);
    expect(summary.missingContextCount).toBe(1);
  });
});
