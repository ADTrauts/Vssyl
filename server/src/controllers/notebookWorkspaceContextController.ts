import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { TodoServiceError } from '../services/todo/todoErrors';
import * as notebookWorkspaceContextService from '../services/notebook/notebookWorkspaceContextService';

function parseDashboardId(req: Request): string | null {
  const raw = req.query.dashboardId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function parseBusinessId(req: Request): string | null | undefined {
  const raw = req.query.businessId;
  if (raw === undefined || raw === null || raw === '') return null;
  return typeof raw === 'string' ? raw : null;
}

function mapError(res: Response, error: unknown): boolean {
  if (error instanceof TodoServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export async function getWorkspaceContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const dashboardId = parseDashboardId(req);
    if (!dashboardId) {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const authUser = (req as AuthenticatedRequest).user;
    const context = await notebookWorkspaceContextService.getWorkspaceContext({
      userId,
      dashboardId,
      businessId: parseBusinessId(req),
      greetingName: authUser?.name ?? null,
    });

    res.status(200).json(context);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('getWorkspaceContext failed', {
      operation: 'notebook_workspace_context',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to load workspace context' });
  }
}

export async function getWorkspaceInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const dashboardId = parseDashboardId(req);
    if (!dashboardId) {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const result = await notebookWorkspaceContextService.getWorkspaceInsights({
      userId,
      dashboardId,
      businessId: parseBusinessId(req),
    });

    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('getWorkspaceInsights failed', {
      operation: 'notebook_workspace_insights',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to load workspace insights' });
  }
}
