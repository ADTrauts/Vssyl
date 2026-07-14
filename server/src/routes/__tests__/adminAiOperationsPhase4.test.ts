/**
 * Phase 4 — AI Operations Center API + RBAC tests.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';
import {
  buildOperationsAuthContext,
  requireOperationsPermission,
  resolveOperationsRole,
} from '../../ai/operations/operationsRbac';
import { aggregatePlatformMetrics } from '../../ai/intelligence/platformMetrics';
import { buildExecutionExplanation } from '../../ai/intelligence/explainability';
import { buildExecutionRecordSnapshot } from '../../ai/intelligence/executionRecordService';
import { routeCorrectionForRootCause } from '../../ai/intelligence/correctionRouting';
import * as operationsQuery from '../../ai/operations/operationsQueryService';
import * as operationsMetrics from '../../ai/operations/operationsMetricsService';

describe('Phase 4 operations RBAC', () => {
  it('PLATFORM_ADMIN has write permissions', () => {
    const ctx = {
      userId: 'u1',
      platformRole: 'ADMIN',
      operationsRole: 'PLATFORM_ADMIN' as const,
      permissions: new Set([
        'operations:read',
        'evaluations:write',
        'corrections:write',
      ] as const),
    };
    expect(requireOperationsPermission(ctx as never, 'evaluations:write').ok).toBe(true);
  });

  it('READ_ONLY_AUDITOR lacks write', () => {
    const ctx = buildOperationsAuthContext({
      user: { id: 'u1', role: 'ADMIN' },
      headers: { 'x-ai-operations-role': 'READ_ONLY_AUDITOR' },
    } as never);
    expect(ctx.operationsRole).toBe('READ_ONLY_AUDITOR');
    expect(requireOperationsPermission(ctx, 'evaluations:write').ok).toBe(false);
  });

  it('Phase 6 SUPPORT_ENGINEER can write evaluations but not settings', () => {
    const ctx = buildOperationsAuthContext({
      user: { id: 'u1', role: 'ADMIN' },
      headers: { 'x-ai-operations-role': 'SUPPORT_ENGINEER' },
    } as never);
    expect(ctx.operationsRole).toBe('SUPPORT_ENGINEER');
    expect(requireOperationsPermission(ctx, 'evaluations:write').ok).toBe(true);
    expect(requireOperationsPermission(ctx, 'settings:read').ok).toBe(false);
  });

  it('resolves platform admin from JWT ADMIN role', () => {
    const role = resolveOperationsRole({ user: { id: 'a', role: 'ADMIN' }, headers: {} } as never);
    expect(role).toBe('PLATFORM_ADMIN');
  });
});

describe('Phase 4 pure services', () => {
  it('aggregates metrics', () => {
    const values = aggregatePlatformMetrics({
      executions: [{ id: '1', latencyMs: 100, toolProposed: true, hadApproval: true, toolSuccessCount: 1, toolFailureCount: 0 }],
      evaluations: [{ executionRecordId: '1', evaluatorRole: 'USER', score: 0.8, labels: ['HELPFUL'], rootCauses: [] }],
      corrections: [],
      regressions: [],
    });
    expect(values.some((v) => v.id === 'approval_rate')).toBe(true);
  });

  it('builds explainability without private reasoning', () => {
    const record = buildExecutionRecordSnapshot({ userId: 'u1', surface: 'TWIN', provider: 'openai' });
    const ex = buildExecutionExplanation(record);
    expect(ex.excludesPrivateReasoning).toBe(true);
  });

  it('routes corrections', () => {
    expect(routeCorrectionForRootCause('RETRIEVAL').destinations).toContain('KNOWLEDGE_ENGINE');
  });
});

describe('Phase 4 admin AI operations API auth', () => {
  const app = createTestApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('GET /api/admin/ai/operations/health requires auth', async () => {
    await request(app).get('/api/admin/ai/operations/health').expect(401);
  });

  it('GET /api/admin/ai/operations/health allows platform admin', async () => {
    vi.spyOn(operationsMetrics, 'getOperationsOverview').mockResolvedValue({
      executionCount: 0,
      pendingEvaluations: 0,
      openCorrections: 0,
      activeRegressions: 0,
      recentMetrics: [],
    });
    const res = await request(app)
      .get('/api/admin/ai/operations/health')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.observeOnly).toBe(true);
  });

  it('GET /api/admin/ai/operations/executions returns list shape', async () => {
    vi.spyOn(operationsQuery, 'listExecutionRecords').mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
    });
    const res = await request(app)
      .get('/api/admin/ai/operations/executions')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('denies non-admin user', async () => {
    await request(app)
      .get('/api/admin/ai/operations/health')
      .set(createAuthHeader(regularUser))
      .expect(403);
  });
});
