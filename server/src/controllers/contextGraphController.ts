import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  ContextGraphForbiddenError,
  ContextGraphNotFoundError,
  parseContainerRoot,
  parseEntityRoot,
  parseTenantScope,
  resolveContextBundle,
  resolveVLinkBundle,
} from '../context-graph/contextGraphOrchestrator.js';
import { MAX_DEPTH, DEFAULT_DEPTH } from '../context-graph/contextGraphTypes.js';
import {
  AI_PIPELINE_CONSUMER,
  bundleToAiGroundingPayload,
} from '../context-graph/contextBundleAiContract.js';
import { resolveVLinkBundlesForAi } from '../context-graph/contextGraphBundleProvider.js';
import {
  composeKnowledgeFromContextBundles,
  orchestrateKnowledgeBundle,
} from '../knowledge/knowledgeCompositionOrchestrator.js';
import { toOperatorDiagnosticsView } from '../knowledge/knowledgeCompositionDiagnostics.js';
import { toOperatorConvergenceView } from '../knowledge/knowledgeConvergenceDiagnostics.js';
import { retrieveNeighborhoods } from '../knowledge/knowledgeNeighborhoodService.js';
import type { KnowledgeConsumerId } from '../knowledge/knowledgeTypes.js';

function getUserId(req: Request): string | null {
  return (req as AuthenticatedRequest).user?.id ?? null;
}

function parseDepth(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') return DEFAULT_DEPTH;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_DEPTH;
  return Math.min(Math.floor(n), MAX_DEPTH);
}

function parseBudget(value: unknown, fallback: number): number {
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), 200);
}

function handleContextGraphError(res: Response, error: unknown): void {
  if (error instanceof ContextGraphNotFoundError) {
    res.status(404).json({ success: false, error: { code: 'CG_NOT_FOUND', message: error.message } });
    return;
  }
  if (error instanceof ContextGraphForbiddenError) {
    res.status(403).json({ success: false, error: { code: 'CG_FORBIDDEN', message: error.message } });
    return;
  }
  const message = error instanceof Error ? error.message : 'Context graph error';
  res.status(500).json({ success: false, error: { code: 'CG_INTERNAL', message } });
}

export async function getVLinkBundleHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const bundle = await resolveVLinkBundle({
      userId,
      vlinkIdOrCode: req.params.id,
      options: {
        depth: parseDepth(req.query.depth),
        nodeBudget: parseBudget(req.query.nodeBudget, 50),
        edgeBudget: parseBudget(req.query.edgeBudget, 50),
        consumer: 'hub_ui',
      },
    });

    res.setHeader('X-Context-Graph-Contract-Version', '1.0');
    res.json({
      success: true,
      data: bundle,
      meta: {
        truncated: bundle.composition.truncated,
        depthUsed: bundle.composition.depthUsed,
        nodesReturned: bundle.nodes.length,
        edgesReturned: bundle.edges.length,
        nodesOmitted: bundle.composition.nodesOmitted,
      },
    });
  } catch (error: unknown) {
    handleContextGraphError(res, error);
  }
}

export async function postBundleResolveHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const tenantScope = parseTenantScope(req.body);
    if (!tenantScope) {
      res.status(400).json({
        success: false,
        error: { code: 'CG_INVALID_DESCRIPTOR', message: 'tenantScope.dashboardId and scope are required' },
      });
      return;
    }

    const containerRoot = parseContainerRoot(req.body);
    const entityRoot = parseEntityRoot(req.body);
    const root = containerRoot ?? entityRoot;

    if (!root) {
      res.status(400).json({
        success: false,
        error: { code: 'CG_INVALID_DESCRIPTOR', message: 'Valid root descriptor required' },
      });
      return;
    }

    const bodyOptions =
      req.body && typeof req.body === 'object' && 'options' in req.body
        ? (req.body as { options?: Record<string, unknown> }).options
        : undefined;

    const bundle = await resolveContextBundle({
      userId,
      root,
      tenantScope,
      options: {
        depth: parseDepth(bodyOptions?.depth),
        nodeBudget: parseBudget(bodyOptions?.nodeBudget, 50),
        edgeBudget: parseBudget(bodyOptions?.edgeBudget, 50),
        consumer:
          bodyOptions?.consumer === 'ai_pipeline' ||
          bodyOptions?.consumer === 'hub_ui' ||
          bodyOptions?.consumer === 'search'
            ? bodyOptions.consumer
            : 'api_client',
        kind: containerRoot ? 'vlink' : 'resolved',
      },
    });

    res.setHeader('X-Context-Graph-Contract-Version', '1.0');
    res.json({
      success: true,
      data: bundle,
      meta: {
        truncated: bundle.composition.truncated,
        depthUsed: bundle.composition.depthUsed,
        nodesReturned: bundle.nodes.length,
        edgesReturned: bundle.edges.length,
        nodesOmitted: bundle.composition.nodesOmitted,
      },
    });
  } catch (error: unknown) {
    handleContextGraphError(res, error);
  }
}

/**
 * AI pipeline grounding endpoint — returns formal ContextBundleDescriptor payloads.
 * Read-only; consumer fixed to ai_pipeline; uses constitutional bundle provider.
 */
export async function postAiGroundingBundleHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const tenantScope = parseTenantScope(req.body);
    const bodyRecord =
      req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

    const vlinkIdsRaw = bodyRecord.vlinkIds;
    const vlinkIds = Array.isArray(vlinkIdsRaw)
      ? vlinkIdsRaw.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
      : [];

    const containerRoot = parseContainerRoot(req.body);
    const entityRoot = parseEntityRoot(req.body);

    if (vlinkIds.length > 0) {
      const providerResult = await resolveVLinkBundlesForAi({
        userId,
        vlinkIdsOrCodes: vlinkIds,
        depth: parseDepth(bodyRecord.depth),
        nodeBudget: parseBudget(bodyRecord.nodeBudget, 30),
        edgeBudget: parseBudget(bodyRecord.edgeBudget, 30),
      });

      res.setHeader('X-Context-Graph-Contract-Version', '1.0');
      res.json({
        success: true,
        data: {
          consumer: AI_PIPELINE_CONSUMER,
          bundles: providerResult.bundles,
          groundingPayloads: providerResult.groundingPayloads,
          estimatedTokens: providerResult.estimatedTokens,
        },
        meta: {
          bundlesRequested: providerResult.bundlesRequested,
          bundlesUsed: providerResult.bundlesUsed,
          totalNodes: providerResult.totalNodes,
          totalRestrictedNodes: providerResult.totalRestrictedNodes,
          totalOmittedNodes: providerResult.totalOmittedNodes,
        },
      });
      return;
    }

    const root = containerRoot ?? entityRoot;
    if (!root || !tenantScope) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CG_INVALID_DESCRIPTOR',
          message: 'Provide vlinkIds[] or valid root + tenantScope',
        },
      });
      return;
    }

    const bundle = await resolveContextBundle({
      userId,
      root,
      tenantScope,
      options: {
        depth: parseDepth(bodyRecord.depth),
        nodeBudget: parseBudget(bodyRecord.nodeBudget, 30),
        edgeBudget: parseBudget(bodyRecord.edgeBudget, 30),
        consumer: 'ai_pipeline',
        kind: containerRoot ? 'vlink' : 'resolved',
      },
    });

    const groundingPayload = bundleToAiGroundingPayload(bundle);

    res.setHeader('X-Context-Graph-Contract-Version', '1.0');
    res.json({
      success: true,
      data: {
        consumer: AI_PIPELINE_CONSUMER,
        bundles: [bundle],
        groundingPayloads: [groundingPayload],
        estimatedTokens: groundingPayload.estimatedTokens,
      },
      meta: {
        bundlesRequested: 1,
        bundlesUsed: 1,
        totalNodes: bundle.nodes.length,
        totalRestrictedNodes: bundle.summaries.stats.restrictedNodeCount,
        totalOmittedNodes: bundle.composition.nodesOmitted,
      },
    });
  } catch (error: unknown) {
    handleContextGraphError(res, error);
  }
}

function parseKnowledgeConsumer(value: unknown): KnowledgeConsumerId {
  const allowed: KnowledgeConsumerId[] = [
    'project_assistant',
    'planning',
    'business_operations',
    'local_discovery',
    'ai_pipeline',
    'hub_ui',
    'api_client',
    'admin_diagnostic',
  ];
  if (typeof value === 'string' && allowed.includes(value as KnowledgeConsumerId)) {
    return value as KnowledgeConsumerId;
  }
  return 'api_client';
}

export async function postKnowledgeComposeHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const bodyRecord =
      req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const consumer = parseKnowledgeConsumer(bodyRecord.consumer);
    const tenantScope = parseTenantScope(req.body);
    const containerRoot = parseContainerRoot(req.body);
    const entityRoot = parseEntityRoot(req.body);
    const vlinkIdOrCode =
      typeof bodyRecord.vlinkIdOrCode === 'string' ? bodyRecord.vlinkIdOrCode : undefined;

    const orchestrated = await orchestrateKnowledgeBundle({
      userId,
      vlinkIdOrCode,
      root: containerRoot ?? entityRoot ?? undefined,
      tenantScope: tenantScope ?? undefined,
      consumer,
      converge: true,
      options: {
        depth: parseDepth(bodyRecord.depth),
        nodeBudget: parseBudget(bodyRecord.nodeBudget, 50),
        edgeBudget: parseBudget(bodyRecord.edgeBudget, 50),
        consumer: consumer === 'ai_pipeline' ? 'ai_pipeline' : 'api_client',
      },
    });

    if (orchestrated.knowledgeBundles.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'KB_EMPTY', message: 'No context bundles resolved for composition' },
      });
      return;
    }

    res.setHeader('X-Knowledge-Bundle-Contract-Version', '1.0');
    res.setHeader('X-Knowledge-Neighborhood-Contract-Version', '1.0');
    res.json({
      success: true,
      data: {
        bundles: orchestrated.knowledgeBundles,
        neighborhoods: orchestrated.knowledgeNeighborhoods,
        contextBundles: orchestrated.contextBundles,
        diagnostics: orchestrated.composition.diagnostics,
        convergenceDiagnostics: orchestrated.convergenceDiagnostics,
      },
      meta: {
        bundlesComposed: orchestrated.knowledgeBundles.length,
        compositionDurationMs: orchestrated.composition.compositionDurationMs,
        consumer,
      },
    });
  } catch (error: unknown) {
    handleContextGraphError(res, error);
  }
}

export async function postKnowledgeDiagnosticsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const bodyRecord =
      req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const contextBundlesRaw = bodyRecord.contextBundles;
    const consumer = parseKnowledgeConsumer(bodyRecord.consumer);

    if (!Array.isArray(contextBundlesRaw) || contextBundlesRaw.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'KB_INVALID_INPUT', message: 'contextBundles[] required' },
      });
      return;
    }

    const composition = composeKnowledgeFromContextBundles({
      contextBundles: contextBundlesRaw as import('../context-graph/contextGraphTypes.js').ContextBundleDescriptor[],
      consumer,
    });

    res.setHeader('X-Knowledge-Bundle-Contract-Version', '1.0');
    res.json({
      success: true,
      data: {
        aggregate: composition.diagnostics,
        bundles: composition.bundles.map((b) => toOperatorDiagnosticsView(b)),
      },
    });
  } catch (error: unknown) {
    handleContextGraphError(res, error);
  }
}

export async function postKnowledgeNeighborhoodHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const bodyRecord =
      req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const consumer = parseKnowledgeConsumer(bodyRecord.consumer);
    const tenantScope = parseTenantScope(req.body);
    const containerRoot = parseContainerRoot(req.body);
    const entityRoot = parseEntityRoot(req.body);
    const vlinkIdOrCode =
      typeof bodyRecord.vlinkIdOrCode === 'string' ? bodyRecord.vlinkIdOrCode : undefined;

    const orchestrated = await retrieveNeighborhoods({
      userId,
      consumer,
      vlinkIdOrCode,
      root: containerRoot ?? entityRoot ?? undefined,
      tenantScope: tenantScope ?? undefined,
      options: {
        depth: parseDepth(bodyRecord.depth),
        nodeBudget: parseBudget(bodyRecord.nodeBudget, 50),
        edgeBudget: parseBudget(bodyRecord.edgeBudget, 50),
        consumer: consumer === 'ai_pipeline' ? 'ai_pipeline' : 'api_client',
      },
    });

    if (orchestrated.neighborhoods.length === 0) {
      if (orchestrated.bundles.length === 0) {
        res.status(404).json({
          success: false,
          error: { code: 'KN_EMPTY', message: 'No knowledge resolved for neighborhood' },
        });
        return;
      }
      res.status(503).json({
        success: false,
        error: {
          code: 'KN_CONVERGENCE_DISABLED',
          message: 'Knowledge convergence not enabled — set KNOWLEDGE_CONVERGENCE_ENABLED=true',
        },
        data: { bundles: orchestrated.bundles },
      });
      return;
    }

    res.setHeader('X-Knowledge-Neighborhood-Contract-Version', '1.0');
    res.setHeader('X-Knowledge-Card-Contract-Version', '1.0');
    res.json({
      success: true,
      data: {
        neighborhoods: orchestrated.neighborhoods,
        knowledgeCards: orchestrated.knowledgeCards,
        bundles: orchestrated.bundles,
        serviceDiagnostics: orchestrated.diagnostics,
        operatorViews: orchestrated.neighborhoods.map((n) => toOperatorConvergenceView(n)),
        source: orchestrated.source,
      },
    });
  } catch (error: unknown) {
    handleContextGraphError(res, error);
  }
}
