/**
 * Phase 6 — Evaluation & correction workflow tests (extends Phase 4 services).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  assertEvaluationTransition,
  canTransitionEvaluationStatus,
} from '../evaluationWorkflowStateMachine';
import { kindForDestination } from '../correctionWorkItemService';
import { normalizeEvaluationWorkflowStatus } from 'vssyl-shared';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
  },
}));

vi.mock('../../intelligence/regressionCaseService', () => ({
  createAIRegressionCase: vi.fn(async () => ({ id: 'reg1' })),
}));

vi.mock('../../intelligence/evaluationService', () => ({
  persistAIEvaluation: vi.fn(),
}));

vi.mock('../../intelligence/correctionRouting', () => ({
  routeCorrectionForRootCause: vi.fn(() => ({ destinations: ['KNOWLEDGE_ENGINE'] })),
}));

describe('Phase 6 evaluation lifecycle', () => {
  it('normalizes Phase 4 statuses for display', () => {
    expect(normalizeEvaluationWorkflowStatus('PENDING')).toBe('NEW');
    expect(normalizeEvaluationWorkflowStatus('ASSIGNED')).toBe('TRIAGED');
    expect(normalizeEvaluationWorkflowStatus('RESOLVED')).toBe('CLOSED');
  });

  it('allows the happy-path transitions', () => {
    expect(canTransitionEvaluationStatus('NEW', 'UNDER_REVIEW')).toBe(true);
    expect(canTransitionEvaluationStatus('UNDER_REVIEW', 'ROOT_CAUSE_CONFIRMED')).toBe(true);
    expect(canTransitionEvaluationStatus('ROOT_CAUSE_CONFIRMED', 'CORRECTION_CREATED')).toBe(true);
    expect(canTransitionEvaluationStatus('CORRECTION_CREATED', 'CORRECTION_APPROVED')).toBe(true);
    expect(canTransitionEvaluationStatus('CORRECTION_APPROVED', 'REGRESSION_CREATED')).toBe(true);
    expect(canTransitionEvaluationStatus('REGRESSION_CREATED', 'VERIFIED')).toBe(true);
    expect(canTransitionEvaluationStatus('VERIFIED', 'CLOSED')).toBe(true);
  });

  it('blocks terminal regression', () => {
    expect(canTransitionEvaluationStatus('CLOSED', 'NEW')).toBe(false);
    expect(assertEvaluationTransition('REJECTED', 'UNDER_REVIEW').ok).toBe(false);
  });

  it('supports duplicate / deferred / cancelled', () => {
    expect(canTransitionEvaluationStatus('NEW', 'DUPLICATE')).toBe(true);
    expect(canTransitionEvaluationStatus('TRIAGED', 'DEFERRED')).toBe(true);
    expect(canTransitionEvaluationStatus('UNDER_REVIEW', 'CANCELLED')).toBe(true);
  });
});

describe('Phase 6 work item kinds', () => {
  it('maps destinations to internal work-item kinds', () => {
    expect(kindForDestination('PROMPT_POLICY')).toBe('PROMPT_REVIEW');
    expect(kindForDestination('KNOWLEDGE_ENGINE')).toBe('KNOWLEDGE_REVIEW');
    expect(kindForDestination('TOOL_OWNER')).toBe('TOOL_REVIEW');
    expect(kindForDestination('BUSINESS_ADMIN')).toBe('BUSINESS_REVIEW');
  });
});

describe('Phase 6 workflow service integration (mock prisma)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateEvaluationWorkflow rejects illegal transitions and appends history on legal ones', async () => {
    const store: Record<string, unknown> = {
      id: 'ev1',
      executionRecordId: 'ex1',
      workflowStatus: 'NEW',
      assignedToUserId: null,
      priority: null,
      severity: null,
      confidence: null,
      resolutionCode: null,
      commentsJson: [],
      historyJson: [],
    };
    const prisma = {
      aIEvaluation: {
        findUnique: vi.fn(async () => ({ ...store })),
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(store, data);
          return { ...store };
        }),
      },
      notification: { create: vi.fn(async () => ({})) },
    };

    const { updateEvaluationWorkflow } = await import('../operationsWorkflowService');
    const bad = await updateEvaluationWorkflow(prisma as never, 'ev1', 'actor', {
      workflowStatus: 'VERIFIED',
    });
    expect(bad.ok).toBe(false);

    const good = await updateEvaluationWorkflow(prisma as never, 'ev1', 'actor', {
      workflowStatus: 'UNDER_REVIEW',
      comment: 'starting review',
      assignedToUserId: 'op1',
    });
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.row.workflowStatus).toBe('UNDER_REVIEW');
    }
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('approving a correction generates work items and can link a regression', async () => {
    const correction = {
      id: 'c1',
      executionRecordId: 'ex1',
      evaluationId: 'ev1',
      rootCauseCode: 'RETRIEVAL',
      destinationsJson: ['KNOWLEDGE_ENGINE', 'PROMPT_POLICY'],
      overrideDestinationsJson: null,
      status: 'ROUTED',
      routingApprovalStatus: 'PENDING_REVIEW',
      assignedOwnerId: 'owner1',
      rationale: 'fix retrieval',
      commentsJson: [],
      historyJson: [],
      resolvedAt: null,
    };
    const workItems: unknown[] = [];
    const evalStore: Record<string, unknown> = {
      id: 'ev1',
      executionRecordId: 'ex1',
      workflowStatus: 'CORRECTION_CREATED',
      assignedToUserId: null,
      priority: null,
      severity: null,
      confidence: null,
      resolutionCode: null,
      commentsJson: [],
      historyJson: [],
    };
    const prisma = {
      aICorrectionRoute: {
        findUnique: vi.fn(async () => ({ ...correction })),
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          ...correction,
          ...data,
        })),
      },
      aICorrectionWorkItem: {
        findMany: vi.fn(async () => workItems),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = {
            id: `wi-${workItems.length + 1}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          workItems.push(row);
          return row;
        }),
      },
      aIEvaluation: {
        findUnique: vi.fn(async () => ({ ...evalStore })),
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(evalStore, data);
          return { ...evalStore };
        }),
      },
      aIExecutionRecord: {
        findUnique: vi.fn(async () => ({ userQuery: 'what files?' })),
      },
      aIRegressionCase: {
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data),
      },
      notification: { create: vi.fn(async () => ({})) },
    };

    const { updateCorrectionRoute } = await import('../operationsWorkflowService');
    const result = await updateCorrectionRoute(prisma as never, 'c1', 'actor', {
      routingApprovalStatus: 'APPROVED',
      createRegression: true,
    });
    expect(result).not.toBeNull();
    expect(result!.workItems.length).toBeGreaterThan(0);
    expect(result!.regressionId).toBe('reg1');
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
