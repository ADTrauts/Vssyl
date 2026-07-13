/**
 * Phase 3 — AI Intelligence Platform unit tests (observational; no Twin runtime).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  buildExecutionRecordSnapshot,
  createAIExecutionRecord,
} from '../executionRecordService';
import { classifyRootCauses, persistAIEvaluation } from '../evaluationService';
import {
  routeCorrectionForRootCause,
  routeCorrectionsForRootCauses,
  overlayModuleDestinations,
  suggestRootCausesFromLabels,
} from '../correctionRouting';
import { buildRegressionCaseDraft, createAIRegressionCase } from '../regressionCaseService';
import { aggregatePlatformMetrics, getMetricDefinitions } from '../platformMetrics';
import { buildExecutionTimeline, buildSimpleTurnTimeline } from '../executionTimeline';
import { buildExecutionExplanation } from '../explainability';
import { getReplayContract } from '../replayContract';
import { AI_OPERATOR_API_CONTRACTS } from '../operatorApiContracts';

describe('Phase 3 execution record', () => {
  it('builds a canonical snapshot with one id and reconstructable timeline', () => {
    const snap = buildExecutionRecordSnapshot({
      userId: 'u1',
      surface: 'TWIN',
      conversationHistoryId: 'h1',
      pipelineDiagnosticId: 'trace-1',
      userQuery: 'What is on my calendar?',
      aiResponseSummary: 'You have 2 meetings',
      provider: 'openai',
      model: 'gpt-4o',
      linked: { actionExecutionIds: ['ae1'], approvalIds: ['ap1'] },
      timeline: buildExecutionTimeline({
        requestReceivedAt: '2026-07-12T12:00:00.000Z',
        intentAt: '2026-07-12T12:00:00.100Z',
        intentLabels: ['calendar'],
        contextBuiltAt: '2026-07-12T12:00:00.200Z',
        knowledgeRetrievedAt: '2026-07-12T12:00:00.300Z',
        promptBuiltAt: '2026-07-12T12:00:00.400Z',
        providerCalledAt: '2026-07-12T12:00:00.500Z',
        provider: 'openai',
        model: 'gpt-4o',
        responseAt: '2026-07-12T12:00:01.000Z',
      }),
    });

    expect(snap.id).toBeTruthy();
    expect(snap.linked.conversationHistoryId).toBe('h1');
    expect(snap.linked.pipelineDiagnosticId).toBe('trace-1');
    expect(snap.linked.actionExecutionIds).toEqual(['ae1']);
    expect(snap.timeline.map((e) => e.stage)).toEqual([
      'REQUEST_RECEIVED',
      'INTENT',
      'CONTEXT_BUILT',
      'KNOWLEDGE_RETRIEVED',
      'PROMPT_BUILT',
      'PROVIDER_CALLED',
      'RESPONSE',
    ]);
  });

  it('persists via prisma create with linked artifacts', async () => {
    const create = vi.fn().mockResolvedValue({});
    const prisma = { aIExecutionRecord: { create } } as never;
    const snap = await createAIExecutionRecord(prisma, {
      userId: 'u1',
      surface: 'TWIN',
      conversationHistoryId: 'h1',
      provider: 'openai',
      model: 'gpt-4o',
      usage: { latencyMs: 120, tokensUsed: 50, costUsd: 0.01 },
    });
    expect(create).toHaveBeenCalledOnce();
    const data = create.mock.calls[0][0].data;
    expect(data.id).toBe(snap.id);
    expect(data.surface).toBe('TWIN');
    expect(data.mutatesRuntime).toBeUndefined();
    expect(Array.isArray(data.timelineJson) || data.timelineJson).toBeTruthy();
  });
});

describe('Phase 3 evaluation + root cause', () => {
  it('classifies root causes from evaluation labels', () => {
    const causes = classifyRootCauses({
      labels: ['WRONG_RETRIEVAL', 'WRONG_MEMORY', 'WRONG_TOOL'],
    });
    expect(causes).toEqual(expect.arrayContaining(['RETRIEVAL', 'PERSONAL_MEMORY', 'TOOL']));
  });

  it('persists evaluation with mutatesRuntime false and optional correction routes', async () => {
    const evalCreate = vi.fn().mockResolvedValue({});
    const routeCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      aIEvaluation: { create: evalCreate },
      aICorrectionRoute: { create: routeCreate },
    } as never;

    const result = await persistAIEvaluation(prisma, {
      executionRecordId: 'er1',
      evaluatorRole: 'VSSYL_OPERATOR',
      labels: ['INCORRECT', 'WRONG_RETRIEVAL'],
      score: 0.2,
      rootCauses: ['RETRIEVAL', 'HALLUCINATION'],
    });

    expect(result.mutatesRuntime).toBe(false);
    expect(evalCreate.mock.calls[0][0].data.mutatesRuntime).toBe(false);
    expect(routeCreate).toHaveBeenCalled();
    expect(result.rootCauses).toEqual(['RETRIEVAL', 'HALLUCINATION']);
  });
});

describe('Phase 3 correction routing', () => {
  it('routes wrong calendar / memory / retrieval / prompt / tool / model / business / personal', () => {
    expect(routeCorrectionForRootCause('RETRIEVAL').destinations).toContain('KNOWLEDGE_ENGINE');
    expect(routeCorrectionForRootCause('PROMPT').destinations).toContain('PROMPT_POLICY');
    expect(routeCorrectionForRootCause('TOOL').destinations).toContain('TOOL_OWNER');
    expect(routeCorrectionForRootCause('ROUTING').destinations).toContain('ROUTING_POLICY');
    expect(routeCorrectionForRootCause('BUSINESS_DATA').destinations).toEqual(
      expect.arrayContaining(['BUSINESS_ADMIN', 'SOURCE_OF_RECORD_OWNER'])
    );
    expect(routeCorrectionForRootCause('PERSONAL_MEMORY').destinations).toEqual(
      expect.arrayContaining(['PERSONAL_MEMORY', 'MEMORY_REVIEW'])
    );

    const withCal = overlayModuleDestinations(routeCorrectionForRootCause('SOURCE_OF_RECORD'), {
      wrongCalendar: true,
    });
    expect(withCal.destinations).toContain('CALENDAR_MODULE');
  });

  it('maps labels to root causes then destinations', () => {
    const causes = suggestRootCausesFromLabels(['WRONG_BUSINESS_DATA']);
    const plans = routeCorrectionsForRootCauses(causes);
    expect(plans[0]?.destinations).toContain('BUSINESS_ADMIN');
  });
});

describe('Phase 3 regression case', () => {
  it('builds draft with expectations', () => {
    const draft = buildRegressionCaseDraft({
      executionRecordId: 'er1',
      title: 'Calendar grounding',
      originalRequest: 'When is my next meeting?',
      expectations: {
        expectedBehavior: 'Cite calendar SoR',
        expectedTools: [],
        expectedGrounding: 'required',
        expectedSources: ['calendar'],
      },
      tags: ['calendar', 'grounding'],
    });
    expect(draft.status).toBe('DRAFT');
    expect(draft.expectations.expectedSources).toEqual(['calendar']);
  });

  it('persists regression case', async () => {
    const create = vi.fn().mockResolvedValue({});
    const prisma = { aIRegressionCase: { create } } as never;
    const row = await createAIRegressionCase(prisma, {
      executionRecordId: 'er1',
      title: 't',
      originalRequest: 'q',
      expectations: { expectedBehavior: 'ok' },
    });
    expect(create).toHaveBeenCalledOnce();
    expect(row.id).toBeTruthy();
  });
});

describe('Phase 3 metrics', () => {
  it('exposes metric definitions including hallucination and regression pass rate', () => {
    const ids = getMetricDefinitions().map((d) => d.id);
    expect(ids).toContain('hallucination_rate');
    expect(ids).toContain('regression_pass_rate');
    expect(getMetricDefinitions().every((d) => d.knowledgeScoped === true)).toBe(true);
  });

  it('aggregates sample metrics', () => {
    const values = aggregatePlatformMetrics({
      executions: [
        { id: '1', provider: 'openai', latencyMs: 100, corrected: true, toolProposed: true, hadApproval: true, toolSuccessCount: 1, toolFailureCount: 0 },
        { id: '2', provider: 'openai', latencyMs: 200, corrected: false, toolProposed: true, hadApproval: false, toolSuccessCount: 0, toolFailureCount: 1 },
      ],
      evaluations: [
        { executionRecordId: '1', evaluatorRole: 'USER', score: 0.9, labels: ['HELPFUL'], rootCauses: [] },
        {
          executionRecordId: '2',
          evaluatorRole: 'VSSYL_OPERATOR',
          score: 0.2,
          labels: ['INCORRECT'],
          rootCauses: ['HALLUCINATION', 'GROUNDING'],
        },
      ],
      corrections: [
        { destinations: ['PERSONAL_MEMORY'], status: 'OPEN' },
        { destinations: ['KNOWLEDGE_ENGINE'], status: 'RESOLVED' },
      ],
      regressions: [
        { status: 'PASSING' },
        { status: 'FAILING' },
        { status: 'ACTIVE' },
      ],
    });

    const byId = Object.fromEntries(values.map((v) => [v.id, v]));
    expect(byId.hallucination_rate?.value).toBe(0.5);
    expect(byId.correction_rate?.value).toBe(0.5);
    expect(byId.approval_rate?.value).toBe(0.5);
    expect(byId.tool_success_rate?.value).toBe(0.5);
    expect(byId.tool_failure_rate?.value).toBe(0.5);
    expect(byId.regression_pass_rate?.value).toBeCloseTo(1 / 3);
    expect(byId.memory_correction_rate?.value).toBe(0.5);
    expect(byId.knowledge_promotion_rate?.value).toBe(1);
  });
});

describe('Phase 3 explainability + replay + operator APIs', () => {
  it('builds explainability without private reasoning', () => {
    const record = buildExecutionRecordSnapshot({
      userId: 'u1',
      surface: 'TWIN',
      provider: 'openai',
      model: 'gpt-4o',
      timeline: buildSimpleTurnTimeline({
        startedAt: '2026-07-12T12:00:00.000Z',
        completedAt: '2026-07-12T12:00:01.000Z',
        provider: 'openai',
        model: 'gpt-4o',
      }),
    });
    const explanation = buildExecutionExplanation(record, {
      sourcesUsed: ['calendar'],
      whyMemoryNotUsed: ['No relevant personal memory matched intent'],
    });
    expect(explanation.excludesPrivateReasoning).toBe(true);
    expect(explanation.sourcesUsed).toEqual(['calendar']);
    expect(explanation.whyProviderSelected).toMatch(/openai/);
  });

  it('exposes replay contract with dryRun and governed execution fences', () => {
    const c = getReplayContract();
    expect(c.requestShape.dryRun).toBe(true);
    expect(c.requestShape.respectGovernedExecution).toBe(true);
    expect(c.nonGoals).toEqual(expect.arrayContaining([expect.stringMatching(/second execution/i)]));
  });

  it('documents operator API contracts for execution→evaluation→correction→regression', () => {
    const paths = AI_OPERATOR_API_CONTRACTS.map((c) => c.path);
    expect(paths.some((p) => p.includes('/executions'))).toBe(true);
    expect(paths.some((p) => p.includes('/evaluations'))).toBe(true);
    expect(paths.some((p) => p.includes('/corrections'))).toBe(true);
    expect(paths.some((p) => p.includes('/regressions'))).toBe(true);
    expect(paths.some((p) => p.includes('/metrics'))).toBe(true);
    expect(paths.some((p) => p.includes('/replay'))).toBe(true);
  });
});
