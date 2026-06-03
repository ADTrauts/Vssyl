/**
 * Notes AI context — reads via notesVisibilityService (trashedAt excluded).
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import * as notesVisibility from '../services/notes/notesVisibilityService';

export async function getRecentNotesContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ success: false, message: 'dashboardId is required' });
      return;
    }

    const notes = await notesVisibility.listRecentPagesForAi({
      userId,
      dashboardId,
      businessId: businessId && typeof businessId === 'string' ? businessId : null,
    });

    const context = {
      summary: {
        totalCount: notes.length,
        pinnedCount: notes.filter((n) => n.pinned).length,
        status: notes.length > 0 ? 'has-data' : 'empty',
      },
      details: {
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title,
          tags: n.tags,
          pinned: n.pinned,
          lastUpdated: n.updatedAt.toISOString(),
        })),
      },
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'notes',
        endpoint: 'recent',
        businessId: businessId && typeof businessId === 'string' ? businessId : null,
        dashboardId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getRecentNotesContext', {
      operation: 'notes_ai_context_recent',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch context',
      error: err.message,
    });
  }
}

export async function getPinnedNotesContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ success: false, message: 'dashboardId is required' });
      return;
    }

    const notes = await notesVisibility.listPinnedPagesForAi({
      userId,
      dashboardId,
      businessId: businessId && typeof businessId === 'string' ? businessId : null,
    });

    const context = {
      summary: {
        totalCount: notes.length,
        status: notes.length > 0 ? 'has-data' : 'empty',
      },
      details: {
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title,
          tags: n.tags,
          pinned: n.pinned,
          lastUpdated: n.updatedAt.toISOString(),
        })),
      },
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'notes',
        endpoint: 'pinned',
        businessId: businessId && typeof businessId === 'string' ? businessId : null,
        dashboardId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getPinnedNotesContext', {
      operation: 'notes_ai_context_pinned',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch context',
      error: err.message,
    });
  }
}
