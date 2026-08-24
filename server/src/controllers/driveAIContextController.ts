/**
 * File Hub AI Context Provider Controller (thin HTTP layer)
 *
 * Retrieval is delegated to driveAIContextService → driveVisibilityService.
 * Wave 1C: no direct Prisma in this controller.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import {
  buildFileCountAIContext,
  buildRecentFilesAIContext,
  buildStorageStatsAIContext,
} from '../services/driveAIContextService';

function parseOptionalDashboardId(req: Request): string | null | undefined {
  const raw = req.query.dashboardId;
  if (raw === undefined || raw === null || raw === '') return undefined;
  return typeof raw === 'string' ? raw : undefined;
}

function parseOptionalQuery(req: Request): string | undefined {
  const raw = req.query.query ?? req.query.q;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * GET /api/drive/ai/context/recent
 */
export async function getRecentFilesContext(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payload = await buildRecentFilesAIContext(userId, parseOptionalDashboardId(req), {
      query: parseOptionalQuery(req),
    });

    res.json({
      success: true,
      ...payload,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in getRecentFilesContext', {
      operation: 'getRecentFilesContext',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent files context',
      error: err.message || 'Unknown error',
    });
  }
}

/**
 * GET /api/drive/ai/context/storage
 */
export async function getStorageStatsContext(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payload = await buildStorageStatsAIContext(userId, parseOptionalDashboardId(req));

    res.json({
      success: true,
      ...payload,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in getStorageStatsContext', {
      operation: 'getStorageStatsContext',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch storage stats context',
      error: err.message || 'Unknown error',
    });
  }
}

/**
 * GET /api/drive/ai/query/count
 */
export async function getFileCount(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const typeRaw = req.query.type;
    const type = typeof typeRaw === 'string' ? typeRaw : 'all';
    const folderIdRaw = req.query.folderId;
    const folderId = typeof folderIdRaw === 'string' ? folderIdRaw : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payload = await buildFileCountAIContext(userId, {
      type,
      folderId,
      dashboardId: parseOptionalDashboardId(req),
    });

    res.json({
      success: true,
      ...payload,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in getFileCount', {
      operation: 'getFileCount',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get file count',
      error: err.message || 'Unknown error',
    });
  }
}
