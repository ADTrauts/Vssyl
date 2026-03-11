/**
 * Notes Module AI Context Controller
 * Provides context data about notes to the AI system
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

/**
 * GET /api/notes/ai/context/recent
 * Returns recent notes for AI context
 */
export async function getRecentNotesContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'dashboardId is required',
      });
      return;
    }

    const where = {
      createdById: userId,
      dashboardId,
      deletedAt: null,
      ...(businessId && typeof businessId === 'string' ? { businessId } : { businessId: null }),
    };

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 15,
      select: {
        id: true,
        title: true,
        tags: true,
        pinned: true,
        updatedAt: true,
      },
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

/**
 * GET /api/notes/ai/context/pinned
 * Returns pinned notes for AI context
 */
export async function getPinnedNotesContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'dashboardId is required',
      });
      return;
    }

    const where = {
      createdById: userId,
      dashboardId,
      pinned: true,
      deletedAt: null,
      ...(businessId && typeof businessId === 'string' ? { businessId } : { businessId: null }),
    };

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        tags: true,
        pinned: true,
        updatedAt: true,
      },
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
