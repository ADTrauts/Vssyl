/**
 * Phase 4 — AI Operations Center REST API.
 * Mount: /api/admin/ai/operations
 */
import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import {
  buildOperationsAuthContext,
  canAccessBusinessRecord,
  requireOperationsPermission,
} from '../ai/operations/operationsRbac';
import {
  listCorrections,
  listEvaluations,
  listExecutionRecords,
  listRegressions,
} from '../ai/operations/operationsQueryService';
import { getExecutionDetail } from '../ai/operations/operationsDetailService';
import {
  addRootCauses,
  bulkUpdateEvaluations,
  createOperatorEvaluation,
  createOperatorRegression,
  reviewRootCause,
  updateCorrectionRoute,
  updateEvaluationWorkflow,
} from '../ai/operations/operationsWorkflowService';
import {
  getOperationsMetrics,
  getOperationsOverview,
} from '../ai/operations/operationsMetricsService';
import { buildReplayPreparationPreview } from '../ai/operations/replayPreparationService';
import { buildExecutionExplanation } from '../ai/intelligence/explainability';
import { getAIExecutionRecord } from '../ai/intelligence/executionRecordService';
import type {
  AIEvaluationInput,
  AIRegressionCaseInput,
  AIRootCauseCode,
} from 'vssyl-shared';

const router: express.Router = express.Router();

function authCtx(req: express.Request) {
  return buildOperationsAuthContext(req);
}

function businessScope(ctx: ReturnType<typeof authCtx>) {
  if (['BUSINESS_ADMIN', 'BUSINESS_AI_MANAGER'].includes(ctx.operationsRole)) {
    return ctx.businessId;
  }
  return undefined;
}

function parseListQuery(req: express.Request) {
  const q = req.query;
  const str = (key: string) => (typeof q[key] === 'string' ? q[key] : undefined);
  return {
    page: str('page') ? Number(str('page')) : undefined,
    pageSize: str('pageSize') ? Number(str('pageSize')) : undefined,
    sortBy: str('sortBy'),
    sortDir: str('sortDir') === 'asc' ? 'asc' as const : str('sortDir') === 'desc' ? 'desc' as const : undefined,
    search: str('search'),
    userId: str('userId'),
    businessId: str('businessId'),
    provider: str('provider'),
    surface: str('surface'),
    conversationId: str('conversationId'),
    executionId: str('executionId'),
    dateFrom: str('dateFrom'),
    dateTo: str('dateTo'),
    workflowStatus: str('workflowStatus') as never,
    priority: str('priority') as never,
    assignedToUserId: str('assignedToUserId'),
    correctionStatus: str('correctionStatus'),
    regressionStatus: str('regressionStatus'),
  };
}

router.use(authenticateJWT);

router.get('/overview', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'operations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const data = await getOperationsOverview(prisma, businessScope(ctx));
  return res.json({ success: true, data });
});

router.get('/executions', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:search');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const data = await listExecutionRecords(prisma, parseListQuery(req), businessScope(ctx));
  return res.json({ success: true, data });
});

router.get('/executions/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const detail = await getExecutionDetail(prisma, req.params.id);
  if (!detail) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, detail.record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  return res.json({ success: true, data: detail });
});

router.get('/executions/:id/explain', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'explainability:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const record = await getAIExecutionRecord(prisma, req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  const detail = await getExecutionDetail(prisma, req.params.id);
  const explanation = buildExecutionExplanation(record, {
    sourcesUsed: detail?.retrievedSources,
    toolsUsed: detail?.linkedActionExecutions.map((a) => a.actionName),
    groundingNotes: detail?.diagnostics?.groundingRequired
      ? ['Grounding was required for this execution path']
      : ['Grounding checks passed or were not required'],
    whyMemoryNotUsed: detail?.retrievedSources?.some((s) => s.startsWith('memory:'))
      ? undefined
      : ['No personal memory items matched retrieval criteria for this turn'],
    whyProviderSelected: record.routingSummary
      ? `Recorded routing summary on execution (observe-only; no ModelTier changes in Phase 4).`
      : undefined,
  });
  return res.json({ success: true, data: explanation });
});

router.post('/executions/:id/evaluations', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'evaluations:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const body = req.body as AIEvaluationInput & { priority?: string; severity?: string; confidence?: number };
  if (!body.labels?.length) {
    return res.status(400).json({ success: false, error: 'labels required' });
  }
  const record = await getAIExecutionRecord(prisma, req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  const result = await createOperatorEvaluation(prisma, {
    ...body,
    executionRecordId: req.params.id,
    evaluatorRole: body.evaluatorRole ?? 'VSSYL_OPERATOR',
    evaluatorUserId: ctx.userId,
  });
  return res.status(201).json({ success: true, data: result });
});

router.get('/evaluations', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'evaluations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const data = await listEvaluations(prisma, parseListQuery(req), businessScope(ctx));
  return res.json({ success: true, data });
});

router.patch('/evaluations/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'evaluations:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const row = await updateEvaluationWorkflow(prisma, req.params.id, ctx.userId, req.body);
  if (!row) return res.status(404).json({ success: false, error: 'Evaluation not found' });
  return res.json({ success: true, data: row });
});

router.post('/evaluations/bulk', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'evaluations:bulk');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { ids, patch } = req.body as { ids: string[]; patch: Record<string, unknown> };
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids required' });
  }
  const updated = await bulkUpdateEvaluations(prisma, ctx.userId, ids, patch as never);
  return res.json({ success: true, data: { updated } });
});

router.post('/evaluations/:id/root-causes', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'root_causes:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { codes, notes } = req.body as { codes: AIRootCauseCode[]; notes?: string };
  if (!codes?.length) return res.status(400).json({ success: false, error: 'codes required' });
  const created = await addRootCauses(prisma, req.params.id, ctx.userId, codes, notes);
  return res.status(201).json({ success: true, data: created });
});

router.patch('/root-causes/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'root_causes:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { reviewStatus, notes } = req.body as { reviewStatus: 'APPROVED' | 'REJECTED'; notes?: string };
  if (!reviewStatus) return res.status(400).json({ success: false, error: 'reviewStatus required' });
  const row = await reviewRootCause(prisma, req.params.id, ctx.userId, reviewStatus, notes);
  if (!row) return res.status(404).json({ success: false, error: 'Root cause not found' });
  return res.json({ success: true, data: row });
});

router.get('/corrections', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'corrections:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const data = await listCorrections(prisma, parseListQuery(req), businessScope(ctx));
  return res.json({ success: true, data });
});

router.patch('/corrections/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'corrections:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const row = await updateCorrectionRoute(prisma, req.params.id, ctx.userId, req.body);
  if (!row) return res.status(404).json({ success: false, error: 'Correction not found' });
  return res.json({ success: true, data: row });
});

router.get('/regressions', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'regressions:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const data = await listRegressions(prisma, parseListQuery(req), businessScope(ctx));
  return res.json({ success: true, data });
});

router.post('/regressions', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'regressions:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const body = req.body as AIRegressionCaseInput & { ownerUserId?: string; priority?: string };
  if (!body.executionRecordId || !body.title || !body.originalRequest) {
    return res.status(400).json({ success: false, error: 'executionRecordId, title, originalRequest required' });
  }
  const result = await createOperatorRegression(prisma, {
    ...body,
    ownerUserId: body.ownerUserId ?? ctx.userId,
  });
  return res.status(201).json({ success: true, data: result });
});

router.get('/metrics', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'metrics:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;
  const data = await getOperationsMetrics(prisma, { from, to }, businessScope(ctx));
  return res.json({ success: true, data });
});

router.post('/executions/:id/replay/prepare', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'replay:prepare');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const preview = await buildReplayPreparationPreview(prisma, {
    executionRecordId: req.params.id,
    mode: req.body?.mode ?? 'IDENTICAL',
    providerOverride: req.body?.providerOverride,
    modelOverride: req.body?.modelOverride,
    promptPolicyVersionOverride: req.body?.promptPolicyVersionOverride,
  });
  if (!preview) return res.status(404).json({ success: false, error: 'Execution not found' });
  return res.json({ success: true, data: preview });
});

router.get('/health', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'operations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  return res.json({
    success: true,
    data: {
      status: 'ok',
      role: ctx.operationsRole,
      observeOnly: true,
      replayExecutionEnabled: false,
      productShell: 'ai-pipeline',
    },
  });
});

export default router;
