import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  lookupTagsByEntity,
  lookupTagsByLabel,
  lookupTagsByModule,
} from '../context-graph/tagIndexService.js';
import type { EntityRef } from '../context-graph/contextGraphTypes.js';
import { TAG_INDEX_CONTRACT_VERSION } from '../context-graph/tagDescriptorTypes.js';

function getUserId(req: Request): string | null {
  return (req as AuthenticatedRequest).user?.id ?? null;
}

function parseLimit(value: unknown, fallback = 25): number {
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), 50);
}

function parseNullableScopeId(value: unknown): string | null | undefined {
  if (typeof value === 'string') {
    return value === 'null' ? null : value;
  }
  return undefined;
}

function parseScope(req: Request) {
  const q = req.query;
  const dashboardId = typeof q.dashboardId === 'string' ? q.dashboardId : undefined;
  const businessId = parseNullableScopeId(q.businessId);
  const householdId = parseNullableScopeId(q.householdId);
  return { dashboardId, businessId, householdId };
}

function parseEntityRef(req: Request): EntityRef | null {
  const q = req.query;
  if (
    typeof q.moduleId !== 'string' ||
    typeof q.entityType !== 'string' ||
    typeof q.entityId !== 'string'
  ) {
    return null;
  }
  return { moduleId: q.moduleId, entityType: q.entityType, entityId: q.entityId };
}

export async function getTagsSearchHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const tag =
      (typeof req.query.tag === 'string' && req.query.tag) ||
      (typeof req.query.q === 'string' && req.query.q) ||
      '';
    if (!tag.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'CG_INVALID_TAG', message: 'Query parameter tag or q is required' },
      });
      return;
    }

    const result = await lookupTagsByLabel(userId, tag, parseScope(req), parseLimit(req.query.limit));

    res.setHeader('X-Context-Graph-Tag-Index-Version', TAG_INDEX_CONTRACT_VERSION);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Tag index error';
    res.status(500).json({ success: false, error: { code: 'CG_TAG_INDEX', message } });
  }
}

export async function getTagsByEntityHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const ref = parseEntityRef(req);
    if (!ref) {
      res.status(400).json({
        success: false,
        error: { code: 'CG_INVALID_DESCRIPTOR', message: 'moduleId, entityType, entityId required' },
      });
      return;
    }

    const result = await lookupTagsByEntity(userId, ref);

    res.setHeader('X-Context-Graph-Tag-Index-Version', TAG_INDEX_CONTRACT_VERSION);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Tag index error';
    res.status(500).json({ success: false, error: { code: 'CG_TAG_INDEX', message } });
  }
}

export async function getTagsByModuleHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'CG_UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const moduleId = typeof req.query.moduleId === 'string' ? req.query.moduleId : '';
    if (!moduleId.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'CG_INVALID_MODULE', message: 'moduleId query parameter required' },
      });
      return;
    }

    const result = await lookupTagsByModule(
      userId,
      moduleId,
      parseScope(req),
      parseLimit(req.query.limit)
    );

    res.setHeader('X-Context-Graph-Tag-Index-Version', TAG_INDEX_CONTRACT_VERSION);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Tag index error';
    res.status(500).json({ success: false, error: { code: 'CG_TAG_INDEX', message } });
  }
}
