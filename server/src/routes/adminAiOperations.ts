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
  listWorkItemsForCorrection,
  reviewRootCause,
  updateCorrectionRoute,
  updateEvaluationWorkflow,
  updateRegressionCase,
  updateWorkItemStatus,
} from '../ai/operations/operationsWorkflowService';
import {
  getOperationsMetrics,
  getOperationsOverview,
} from '../ai/operations/operationsMetricsService';
import { buildReplayPreparationPreview } from '../ai/operations/replayPreparationService';
import { buildExecutionExplanation } from '../ai/intelligence/explainability';
import { getAIExecutionRecord } from '../ai/intelligence/executionRecordService';
import {
  getObservationCompleteness,
  getObservationEvents,
  getObservationHealthPayload,
  getObservationLinkedArtifacts,
  getObservationTimeline,
  listObservationFailures,
  purgeObservationRetention,
  estimateObservationRetentionBacklog,
} from '../ai/observation/observationApi';
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
  const result = await updateEvaluationWorkflow(prisma, req.params.id, ctx.userId, req.body);
  if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });
  return res.json({ success: true, data: result.row });
});

router.post('/evaluations/bulk', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'evaluations:bulk');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { ids, patch } = req.body as { ids: string[]; patch: Record<string, unknown> };
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids required' });
  }
  const data = await bulkUpdateEvaluations(prisma, ctx.userId, ids, patch as never);
  return res.json({ success: true, data });
});

router.post('/evaluations/:id/root-causes', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'root_causes:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { codes, notes, confidence } = req.body as {
    codes: AIRootCauseCode[];
    notes?: string;
    confidence?: number;
  };
  if (!codes?.length) return res.status(400).json({ success: false, error: 'codes required' });
  const created = await addRootCauses(prisma, req.params.id, ctx.userId, codes, notes, confidence);
  return res.status(201).json({ success: true, data: created });
});

router.patch('/root-causes/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'root_causes:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { reviewStatus, notes, confidence, ownerUserId } = req.body as {
    reviewStatus: 'APPROVED' | 'REJECTED';
    notes?: string;
    confidence?: number;
    ownerUserId?: string | null;
  };
  if (!reviewStatus) return res.status(400).json({ success: false, error: 'reviewStatus required' });
  const row = await reviewRootCause(
    prisma,
    req.params.id,
    ctx.userId,
    reviewStatus,
    notes,
    confidence,
    ownerUserId
  );
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
  const result = await updateCorrectionRoute(prisma, req.params.id, ctx.userId, req.body);
  if (!result) return res.status(404).json({ success: false, error: 'Correction not found' });
  return res.json({ success: true, data: result });
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

router.patch('/regressions/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'regressions:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const row = await updateRegressionCase(prisma, req.params.id, ctx.userId, req.body);
  if (!row) return res.status(404).json({ success: false, error: 'Regression not found' });
  return res.json({ success: true, data: row });
});

router.get('/corrections/:id/work-items', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'corrections:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const data = await listWorkItemsForCorrection(prisma, req.params.id);
  return res.json({ success: true, data });
});

router.patch('/work-items/:id', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'corrections:write');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { status, assignedOwnerId } = req.body as {
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
    assignedOwnerId?: string | null;
  };
  if (!status) return res.status(400).json({ success: false, error: 'status required' });
  const row = await updateWorkItemStatus(prisma, req.params.id, ctx.userId, status, assignedOwnerId);
  if (!row) return res.status(404).json({ success: false, error: 'Work item not found' });
  return res.json({ success: true, data: row });
});

router.get('/reports/workflow', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'metrics:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;
  const { getWorkflowReport } = await import('../ai/operations/operationsMetricsService');
  const data = await getWorkflowReport(prisma, { from, to }, businessScope(ctx));
  return res.json({ success: true, data });
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
      observation: getObservationHealthPayload(),
    },
  });
});

router.get('/observation/health', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'operations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  try {
    await estimateObservationRetentionBacklog(prisma);
  } catch {
    /* non-fatal */
  }
  return res.json({ success: true, data: getObservationHealthPayload() });
});

router.post('/observation/retention/purge', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'operations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const body = (req.body ?? {}) as {
    dryRun?: boolean;
    purgeAfterDays?: number;
    batchLimit?: number;
    includeHubs?: boolean;
  };
  // Default dry-run=true unless explicitly false
  const data = await purgeObservationRetention(prisma, {
    dryRun: body.dryRun !== false,
    purgeAfterDays: body.purgeAfterDays,
    batchLimit: body.batchLimit,
    includeHubs: body.includeHubs === true,
  });
  return res.json({ success: true, data });
});

router.get('/executions/:id/completeness', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const record = await getAIExecutionRecord(prisma, req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  const data = await getObservationCompleteness(prisma, req.params.id);
  return res.json({ success: true, data });
});

router.get('/observation/failures', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:search');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const data = await listObservationFailures(prisma, {
    businessId: businessScope(ctx),
    limit,
  });
  return res.json({ success: true, data });
});

router.get('/executions/:id/events', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const record = await getAIExecutionRecord(prisma, req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  const data = await getObservationEvents(prisma, req.params.id);
  return res.json({ success: true, data });
});

router.get('/executions/:id/timeline', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const record = await getAIExecutionRecord(prisma, req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  const data = await getObservationTimeline(prisma, req.params.id);
  return res.json({ success: true, data });
});

router.get('/executions/:id/artifacts', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'executions:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const record = await getAIExecutionRecord(prisma, req.params.id);
  if (!record) return res.status(404).json({ success: false, error: 'Execution not found' });
  if (!canAccessBusinessRecord(ctx, record.businessId)) {
    return res.status(403).json({ success: false, error: 'Business scope denied' });
  }
  const data = await getObservationLinkedArtifacts(prisma, req.params.id);
  return res.json({ success: true, data });
});

/** Phase 7 — Model Routing observe-only (shadow comparisons; no policy edits). */
router.get('/routing/overview', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'metrics:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { getShadowRoutingOverview, listCanonicalModels } = await import('../ai/routing');
  const { AI_CAPABILITY_DEFINITIONS } = await import('../ai/routing/capabilityModel');
  const { AI_ROUTING_TIER_DEFINITIONS } = await import('../ai/routing/routingTiers');
  const { AI_MODEL_ROUTING_POLICY_VERSION } = await import('vssyl-shared');
  const { FALLBACK_CHAIN_DOCUMENTATION } = await import('../ai/routing/routingPolicy');
  return res.json({
    success: true,
    data: {
      overview: getShadowRoutingOverview(),
      policyVersion: AI_MODEL_ROUTING_POLICY_VERSION,
      capabilities: Object.values(AI_CAPABILITY_DEFINITIONS),
      tiers: Object.values(AI_ROUTING_TIER_DEFINITIONS),
      catalog: listCanonicalModels().map((m) => ({
        catalogKey: m.catalogKey,
        provider: m.provider,
        label: m.label,
        tier: m.tier,
        capabilities: m.capabilities,
        status: m.status,
        // providerModelId omitted from operator summary cards — adapters own native ids
      })),
      fallbackDocumentation: FALLBACK_CHAIN_DOCUMENTATION,
      shadowMode: true,
      productionRoutingUnchanged: true,
    },
  });
});

router.get('/routing/shadow', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'metrics:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
  const { listRecentShadowComparisons } = await import('../ai/routing');
  return res.json({
    success: true,
    data: {
      items: listRecentShadowComparisons(Number.isFinite(limit) ? limit : 50),
    },
  });
});

/** Phase 8/8B — Skill Registry (canonical productization observe). */
router.get('/skills/overview', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'operations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const {
    listSkillDefinitions,
    listSkillRegistryItems,
  } = await import('../ai/skills/skillRegistry');
  const { summarizeSkillMetrics } = await import('../ai/skills/skillMetrics');
  const { listDurableSkillQuality } = await import('../ai/skills/skillDurableQuality');
  const { fingerprintSkillBundle } = await import('../ai/skills/skillFingerprints');
  const { getSkillDefinition } = await import('../ai/skills/skillRegistry');
  const { AI_SKILLS_POLICY_VERSION } = await import('vssyl-shared');
  const all = listSkillDefinitions();
  const items = listSkillRegistryItems();
  const processMetrics = summarizeSkillMetrics();
  const durableBySkill = await listDurableSkillQuality(
    prisma,
    items.map((i) => i.key)
  );
  const bySkill: Record<string, number> = {};
  for (const d of items) {
    bySkill[d.key] =
      durableBySkill[d.key]?.executionCount ?? summarizeSkillMetrics(d.key).executionCount;
  }
  const fingerprints: Record<string, string> = {};
  for (const item of items) {
    const def = getSkillDefinition(item.key);
    if (def) fingerprints[`${def.key}@${def.version}`] = fingerprintSkillBundle(def).bundleHash;
  }
  return res.json({
    success: true,
    data: {
      overview: {
        policyVersion: AI_SKILLS_POLICY_VERSION,
        skillCount: items.length,
        activeCount: all.filter((d) => d.status === 'ACTIVE').length,
        draftCount: all.filter((d) => d.status === 'DRAFT').length,
        deprecatedCount: all.filter((d) => d.status === 'DEPRECATED').length,
        recentExecutions: Object.values(durableBySkill).reduce(
          (a, s) => a + s.executionCount,
          0
        ),
        successCount: Object.values(durableBySkill).reduce((a, s) => a + s.successCount, 0),
        failureCount: Object.values(durableBySkill).reduce((a, s) => a + s.failureCount, 0),
        bySkill,
      },
      items,
      metrics: processMetrics,
      durableQuality: durableBySkill,
      fingerprints,
      productionRoutingUnchanged: true,
      customerCreatedSkillsEnabled: false,
      industryPacksEnabled: false,
      canonicalProductization: true,
    },
  });
});

router.get('/skills/:key', async (req, res) => {
  const ctx = authCtx(req);
  const gate = requireOperationsPermission(ctx, 'operations:read');
  if (!gate.ok) return res.status(gate.status).json({ success: false, error: gate.error });
  const { getSkillDefinition, listVersionsForKey } = await import('../ai/skills/skillRegistry');
  const { summarizeSkillMetrics } = await import('../ai/skills/skillMetrics');
  const { getSkillInstructionAsset } = await import('../ai/skills/skillInstructionAssets');
  const { getDurableSkillQualitySummary } = await import('../ai/skills/skillDurableQuality');
  const { fingerprintSkillBundle, assertSkillFingerprintIntegrity } = await import(
    '../ai/skills/skillFingerprints'
  );
  const def = getSkillDefinition(req.params.key);
  if (!def) return res.status(404).json({ success: false, error: 'Skill not found' });
  const durableQuality = await getDurableSkillQualitySummary(prisma, def.key);
  const fingerprint = fingerprintSkillBundle(def);
  const integrity = assertSkillFingerprintIntegrity(def);

  const recentIds = durableQuality.recentExecutionIds;
  let evaluations: unknown[] = [];
  let corrections: unknown[] = [];
  let regressions: unknown[] = [];
  try {
    [evaluations, corrections, regressions] = await Promise.all([
      recentIds.length
        ? prisma.aIEvaluation.findMany({
            where: { executionRecordId: { in: recentIds } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              executionRecordId: true,
              workflowStatus: true,
              score: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
      recentIds.length
        ? prisma.aICorrectionRoute.findMany({
            where: { executionRecordId: { in: recentIds } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              executionRecordId: true,
              status: true,
              rootCauseCode: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
      recentIds.length
        ? prisma.aIRegressionCase.findMany({
            where: { executionRecordId: { in: recentIds } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              executionRecordId: true,
              status: true,
              title: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);
  } catch {
    /* intelligence tables may be absent in some local DBs */
  }

  return res.json({
    success: true,
    data: {
      definition: def,
      versions: listVersionsForKey(req.params.key),
      metrics: summarizeSkillMetrics(req.params.key),
      durableQuality,
      fingerprint,
      integrity,
      instructionAsset: getSkillInstructionAsset(def.instructionAssetKey) ?? null,
      evaluationHistory: evaluations,
      corrections,
      regressions,
      certification: {
        status: def.status,
        notes: def.certificationNotes ?? null,
        evaluationProfileId: def.evaluationProfile.id,
        activatedAt: def.activatedAt ?? null,
      },
    },
  });
});

export default router;
