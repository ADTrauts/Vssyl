import type { Request, Response } from 'express';
import type express from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateJWT } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { geolocationService } from '../../services/geolocationService';
import { requireAdmin } from './adminPortalShared';
import { DigitalLifeTwinService } from '../../ai/core/DigitalLifeTwinService';
import { buildPipelineTrace } from '../../ai/pipeline/buildPipelineTrace';
import { mapOrchestrationToPipelineTraceInput } from '../../ai/pipeline/mapPipelineTraceInputs';
import {
  findPipelineDiagnosticById,
  getPipelineQualityStats,
  listPipelineDiagnosticsFromDb,
  persistPipelineDiagnostic,
} from '../../ai/pipeline/pipelineDiagnosticPersistence';
import {
  getEffectivePipelineCatalog,
  listPipelinePolicyAudit,
  updatePipelineContextSourcePolicy,
  updatePipelineGroundingRulePolicy,
  updatePipelineIntentPolicy,
  updatePipelineSettings,
  updatePipelineToolPolicyRow,
} from '../../ai/pipeline/pipelineCatalogService';
import { extractPipelineTraceFromContext } from '../../ai/pipeline/extractPipelineTraceFromContext';
import { getPipelineTraceById, savePipelineTrace } from '../../ai/pipeline/pipelineTraceStore';
import { evidenceBundleFromTrace } from '../../ai/pipeline/buildPipelineEvidenceBundle';
import {
  exportPipelineDiagnostics,
  exportRecordsToCsv,
  getPipelineRetentionSettings,
  purgeExpiredPipelineDiagnostics,
  updatePipelineRetentionSettings,
} from '../../ai/pipeline/pipelineRetentionService';
import type { AIPipelineTrace } from '../../ai/types/pipelineDiagnostics';
import { enrichTraceWithInsights } from '../../ai/pipeline/pipelineTraceInsights';

const digitalLifeTwin = new DigitalLifeTwinService(prisma);

function parseLimit(value: unknown, fallback = 50): number {
  if (typeof value !== 'string') return fallback;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, 100);
}

function parseDays(value: unknown, fallback = 7): number {
  if (typeof value !== 'string') return fallback;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, 90);
}

function adminUserId(req: Request): string | null {
  return req.user?.id ?? null;
}

function policyErrorStatus(message: string): number {
  if (message.includes('not found')) return 404;
  if (message.includes('Invalid')) return 400;
  return 500;
}

function enrichTracesForAdmin<T extends AIPipelineTrace>(
  traces: T[],
  catalog: Awaited<ReturnType<typeof getEffectivePipelineCatalog>>
) {
  return traces.map((trace) => {
    const withSource = trace as T & { diagnosticSource?: 'TWIN' | 'TEST_LAB' };
    return enrichTraceWithInsights(trace, catalog, {
      diagnosticSource: withSource.diagnosticSource ?? 'TWIN',
    });
  });
}

function enrichSingleTraceForAdmin(
  trace: AIPipelineTrace,
  catalog: Awaited<ReturnType<typeof getEffectivePipelineCatalog>>,
  diagnosticSource?: 'TWIN' | 'TEST_LAB'
) {
  return enrichTraceWithInsights(trace, catalog, {
    diagnosticSource: diagnosticSource ?? 'TWIN',
  });
}

export function registerAdminPortalAiPipelineRoutes(router: express.Router): void {
  router.get('/ai-pipeline/catalog', authenticateJWT, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const catalog = await getEffectivePipelineCatalog();
      res.json({ success: true, data: catalog });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Failed to load pipeline catalog', {
        operation: 'admin_ai_pipeline_catalog',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to load pipeline catalog' });
    }
  });

  router.put(
    '/ai-pipeline/policies/intents/:intentId',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminId = adminUserId(req);
        if (!adminId) return res.status(401).json({ error: 'User not authenticated' });
        const body = req.body as Record<string, unknown>;
        const updated = await updatePipelineIntentPolicy(req.params.intentId, {
          name: typeof body.name === 'string' ? body.name : undefined,
          description: typeof body.description === 'string' ? body.description : undefined,
          triggerExamples: Array.isArray(body.triggerExamples)
            ? body.triggerExamples.map(String)
            : undefined,
          groundingRequired:
            typeof body.groundingRequired === 'boolean' ? body.groundingRequired : undefined,
          enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        }, adminId);
        res.json({ success: true, data: updated });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(policyErrorStatus(err.message)).json({ error: err.message });
      }
    }
  );

  router.put(
    '/ai-pipeline/policies/grounding/:intentId',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminId = adminUserId(req);
        if (!adminId) return res.status(401).json({ error: 'User not authenticated' });
        const body = req.body as Record<string, unknown>;
        const updated = await updatePipelineGroundingRulePolicy(req.params.intentId, {
          requiredSources: Array.isArray(body.requiredSources)
            ? body.requiredSources.map(String)
            : undefined,
          optionalSources: Array.isArray(body.optionalSources)
            ? body.optionalSources.map(String)
            : undefined,
          requirementSummary:
            typeof body.requirementSummary === 'string' ? body.requirementSummary : undefined,
        }, adminId);
        res.json({ success: true, data: updated });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(policyErrorStatus(err.message)).json({ error: err.message });
      }
    }
  );

  router.put(
    '/ai-pipeline/policies/sources/:sourceId',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminId = adminUserId(req);
        if (!adminId) return res.status(401).json({ error: 'User not authenticated' });
        const body = req.body as Record<string, unknown>;
        const updated = await updatePipelineContextSourcePolicy(req.params.sourceId, {
          label: typeof body.label === 'string' ? body.label : undefined,
          description: typeof body.description === 'string' ? body.description : undefined,
          enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
          wiredInTwin: typeof body.wiredInTwin === 'boolean' ? body.wiredInTwin : undefined,
        }, adminId);
        res.json({ success: true, data: updated });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(policyErrorStatus(err.message)).json({ error: err.message });
      }
    }
  );

  router.put(
    '/ai-pipeline/policies/tools/:toolId',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminId = adminUserId(req);
        if (!adminId) return res.status(401).json({ error: 'User not authenticated' });
        const body = req.body as Record<string, unknown>;
        const updated = await updatePipelineToolPolicyRow(req.params.toolId, {
          purpose: typeof body.purpose === 'string' ? body.purpose : undefined,
          requiredIntents: Array.isArray(body.requiredIntents)
            ? body.requiredIntents.map(String)
            : undefined,
          optionalIntents: Array.isArray(body.optionalIntents)
            ? body.optionalIntents.map(String)
            : undefined,
          requiredPermissions: Array.isArray(body.requiredPermissions)
            ? body.requiredPermissions.map(String)
            : undefined,
          fallbackBehavior:
            typeof body.fallbackBehavior === 'string' ? body.fallbackBehavior : undefined,
          enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        }, adminId);
        res.json({ success: true, data: updated });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(policyErrorStatus(err.message)).json({ error: err.message });
      }
    }
  );

  router.put(
    '/ai-pipeline/policies/settings',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminId = adminUserId(req);
        if (!adminId) return res.status(401).json({ error: 'User not authenticated' });
        const body = req.body as Record<string, unknown>;
        const updated = await updatePipelineSettings(
          {
            ...(Array.isArray(body.weakGenericPhrases)
              ? { weakGenericPhrases: body.weakGenericPhrases.map(String) }
              : {}),
            ...(typeof body.enforcementEnabled === 'boolean'
              ? { enforcementEnabled: body.enforcementEnabled }
              : {}),
            ...(typeof body.enforcementMode === 'string' &&
            ['off', 'disclose', 'block', 'regenerate'].includes(body.enforcementMode)
              ? {
                  enforcementMode: body.enforcementMode as
                    | 'off'
                    | 'disclose'
                    | 'block'
                    | 'regenerate',
                }
              : {}),
          },
          adminId
        );
        res.json({ success: true, data: updated });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(policyErrorStatus(err.message)).json({ error: err.message });
      }
    }
  );

  router.get('/ai-pipeline/audit', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseLimit(req.query.limit);
      const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : undefined;
      const entityId = typeof req.query.entityId === 'string' ? req.query.entityId : undefined;
      const entries = await listPipelinePolicyAudit({ limit, entityType, entityId });
      res.json({ success: true, data: { entries, total: entries.length } });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Failed to list pipeline policy audit', {
        operation: 'admin_ai_pipeline_audit_list',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to list policy audit' });
    }
  });

  router.get('/ai-pipeline/quality/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const days = parseDays(req.query.days);
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const stats = await getPipelineQualityStats({ days, userId });
      res.json({ success: true, data: stats });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Failed to load pipeline quality stats', {
        operation: 'admin_ai_pipeline_quality_stats',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to load quality stats' });
    }
  });

  router.get('/ai-pipeline/diagnostics', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseLimit(req.query.limit);
      const userIdFilter = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const catalog = await getEffectivePipelineCatalog();

      const dbTraces = await listPipelineDiagnosticsFromDb({ limit, userId: userIdFilter });
      const seen = new Set(dbTraces.map((t) => t.traceId));

      if (dbTraces.length >= limit) {
        return res.json({
          success: true,
          data: { traces: enrichTracesForAdmin(dbTraces, catalog), total: dbTraces.length },
        });
      }

      const legacy: AIPipelineTrace[] = [];
      const historyRows = await prisma.aIConversationHistory.findMany({
        where: userIdFilter ? { userId: userIdFilter } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          userId: true,
          userQuery: true,
          aiResponse: true,
          confidence: true,
          context: true,
          createdAt: true,
        },
      });

      for (const row of historyRows) {
        const embedded = extractPipelineTraceFromContext(row.context);
        const trace =
          embedded ??
          buildPipelineTrace(
            {
              ...mapOrchestrationToPipelineTraceInput({
                userId: row.userId,
                userMessage: row.userQuery,
                finalResponse: row.aiResponse,
                confidence: row.confidence,
                queryContext:
                  row.context && typeof row.context === 'object' && !Array.isArray(row.context)
                    ? (row.context as Record<string, unknown>)
                    : undefined,
                traceId: `history-${row.id}`,
              }),
              createdAt: row.createdAt.toISOString(),
            },
            { catalog }
          );
        if (seen.has(trace.traceId)) continue;
        seen.add(trace.traceId);
        legacy.push({
          ...trace,
          conversationHistoryId: row.id,
        });
      }

      const combined = [...dbTraces, ...legacy]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      res.json({
        success: true,
        data: { traces: enrichTracesForAdmin(combined, catalog), total: combined.length },
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Failed to list pipeline diagnostics', {
        operation: 'admin_ai_pipeline_diagnostics_list',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to list pipeline diagnostics' });
    }
  });

  router.get('/ai-pipeline/diagnostics/:traceId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { traceId } = req.params;
      const catalog = await getEffectivePipelineCatalog();

      const fromDb = await findPipelineDiagnosticById(traceId);
      if (fromDb) {
        const row = await prisma.aIPipelineDiagnostic.findUnique({
          where: { id: traceId },
          select: { source: true },
        });
        const source = row?.source === 'TEST_LAB' ? 'TEST_LAB' : 'TWIN';
        return res.json({
          success: true,
          data: enrichSingleTraceForAdmin(fromDb, catalog, source),
        });
      }

      const fromMemory = getPipelineTraceById(traceId);
      if (fromMemory) {
        return res.json({
          success: true,
          data: enrichSingleTraceForAdmin(fromMemory, catalog, 'TWIN'),
        });
      }

      if (traceId.startsWith('history-')) {
        const historyId = traceId.slice('history-'.length);
        const row = await prisma.aIConversationHistory.findUnique({
          where: { id: historyId },
          select: {
            id: true,
            userId: true,
            userQuery: true,
            aiResponse: true,
            confidence: true,
            context: true,
            createdAt: true,
          },
        });
        if (!row) {
          return res.status(404).json({ error: 'Diagnostic trace not found' });
        }
        const embedded = extractPipelineTraceFromContext(row.context);
        const trace =
          embedded ??
          buildPipelineTrace(
            {
              ...mapOrchestrationToPipelineTraceInput({
                userId: row.userId,
                userMessage: row.userQuery,
                finalResponse: row.aiResponse,
                confidence: row.confidence,
                queryContext:
                  row.context && typeof row.context === 'object' && !Array.isArray(row.context)
                    ? (row.context as Record<string, unknown>)
                    : undefined,
                traceId: `history-${row.id}`,
              }),
              createdAt: row.createdAt.toISOString(),
            },
            { catalog }
          );
        return res.json({
          success: true,
          data: enrichSingleTraceForAdmin(
            { ...trace, conversationHistoryId: row.id },
            catalog,
            'TWIN'
          ),
        });
      }

      return res.status(404).json({ error: 'Diagnostic trace not found' });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Failed to get pipeline diagnostic', {
        operation: 'admin_ai_pipeline_diagnostics_get',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to get pipeline diagnostic' });
    }
  });

  router.post('/ai-pipeline/test-lab', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const body = req.body as Record<string, unknown>;
      const query = typeof body.query === 'string' ? body.query.trim() : '';
      if (!query) {
        return res.status(400).json({ error: 'query is required' });
      }

      const targetUserId =
        typeof body.userId === 'string' && body.userId.trim() !== ''
          ? body.userId.trim()
          : adminUser.id;

      const context =
        body.context && typeof body.context === 'object' && !Array.isArray(body.context)
          ? (body.context as Record<string, unknown>)
          : {};

      const provider =
        typeof body.provider === 'string' &&
        ['auto', 'openai', 'anthropic'].includes(body.provider)
          ? (body.provider as 'auto' | 'openai' | 'anthropic')
          : undefined;

      const preferredModel = typeof body.model === 'string' ? body.model.trim() : undefined;

      const clientIp = geolocationService.getClientIP(req);
      const response = await digitalLifeTwin.processAsDigitalLifeTwin(query, targetUserId, {
        ...context,
        preferredProvider: provider,
        preferredModel,
        ...(clientIp ? { clientIp } : {}),
        pipelineOptions: {
          adminDryRun: true,
          skipLearning: true,
          skipRememberThat: true,
        },
      });

      const pipelineTrace = response.metadata.pipelineTrace;
      if (pipelineTrace) {
        savePipelineTrace(pipelineTrace);
        await persistPipelineDiagnostic(pipelineTrace, {
          source: 'test_lab',
          force: true,
        });
      }

      void logger.info('Admin AI pipeline test-lab run', {
        operation: 'admin_ai_pipeline_test_lab',
        adminId: adminUser.id,
        targetUserId,
        traceId: pipelineTrace?.traceId,
        genericResponseRisk: pipelineTrace?.genericResponseRisk,
      });

      const catalog = await getEffectivePipelineCatalog();
      const enrichedTrace = pipelineTrace
        ? enrichSingleTraceForAdmin(pipelineTrace, catalog, 'TEST_LAB')
        : undefined;

      res.json({
        success: true,
        data: {
          response: response.response,
          confidence: response.confidence,
          pipelineTrace: enrichedTrace,
          structured: response.structured,
          metadata: {
            provider: response.metadata.provider,
            processingTime: response.metadata.processingTime,
            aiResponseQualityWarnings: response.metadata.aiResponseQualityWarnings,
          },
        },
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Admin AI pipeline test-lab failed', {
        operation: 'admin_ai_pipeline_test_lab_error',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Test lab run failed' });
    }
  });

  router.get('/ai-pipeline/retention', authenticateJWT, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const retention = await getPipelineRetentionSettings();
      res.json({ success: true, data: retention });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/ai-pipeline/retention', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = adminUserId(req);
      if (!adminId) return res.status(401).json({ error: 'User not authenticated' });
      const body = req.body as Record<string, unknown>;
      const retention = await updatePipelineRetentionSettings(
        {
          ...(typeof body.diagnosticRetentionDays === 'number'
            ? { diagnosticRetentionDays: body.diagnosticRetentionDays }
            : {}),
          ...(typeof body.exportRedactUserMessages === 'boolean'
            ? { exportRedactUserMessages: body.exportRedactUserMessages }
            : {}),
          ...(typeof body.exportRedactResponsePreviews === 'boolean'
            ? { exportRedactResponsePreviews: body.exportRedactResponsePreviews }
            : {}),
        },
        adminId
      );
      res.json({ success: true, data: retention });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      res.status(500).json({ error: err.message });
    }
  });

  router.post(
    '/ai-pipeline/retention/purge',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const body = req.body as Record<string, unknown>;
        const dryRun = body.dryRun === true;
        const result = await purgeExpiredPipelineDiagnostics({ dryRun });
        res.json({ success: true, data: result });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(500).json({ error: err.message });
      }
    }
  );

  router.post(
    '/ai-pipeline/diagnostics/export',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const body = req.body as Record<string, unknown>;
        const format = body.format === 'csv' ? 'csv' : 'json';
        const days = typeof body.days === 'number' ? body.days : undefined;
        const userId = typeof body.userId === 'string' ? body.userId : undefined;
        const atRiskOnly = body.atRiskOnly === true;
        const limit = typeof body.limit === 'number' ? body.limit : undefined;

        const exported = await exportPipelineDiagnostics({ days, userId, atRiskOnly, limit });

        if (format === 'csv') {
          const csv = exportRecordsToCsv(exported.records);
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="ai-pipeline-diagnostics-${Date.now()}.csv"`
          );
          return res.send(csv);
        }

        res.json({ success: true, data: exported });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.error('Pipeline diagnostics export failed', {
          operation: 'admin_ai_pipeline_export',
          error: { message: err.message, stack: err.stack },
        });
        res.status(500).json({ error: 'Export failed' });
      }
    }
  );

  router.get(
    '/ai-pipeline/diagnostics/:traceId/evidence',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { traceId } = req.params;
        const fromDb = await findPipelineDiagnosticById(traceId);
        const trace =
          fromDb ??
          getPipelineTraceById(traceId) ??
          null;

        if (!trace) {
          return res.status(404).json({ error: 'Diagnostic trace not found' });
        }

        const bundle = evidenceBundleFromTrace(trace);
        res.json({ success: true, data: { traceId, evidenceBundle: bundle } });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        res.status(500).json({ error: err.message });
      }
    }
  );
}
