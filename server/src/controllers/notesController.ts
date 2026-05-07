/**
 * Notes Module Controller
 * Handles CRUD operations for notes with multi-tenant scoping
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth';

function logNotesError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}
import { Prisma } from '@prisma/client';
import { assertUserOwnedDashboardBusinessAlignment } from '../services/taskDashboardBinding';

/**
 * GET /api/notes
 * List notes with filtering (search, tag, pinned)
 */
export async function getNotes(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId, search, tag, pinned, folderId, sharedWithMe } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    // NoteWhereInput may lag in generated types (shares, folderId)
    const where: Record<string, unknown> = {
      dashboardId,
      deletedAt: null,
    };

    if (String(sharedWithMe) === 'true') {
      where.shares = { some: { sharedWithUserId: userId } };
    } else {
      where.createdById = userId;
    }

    if (businessId && typeof businessId === 'string') {
      where.businessId = businessId;
    } else {
      where.businessId = null;
    }

    if (folderId !== undefined && folderId !== '') {
      if (folderId === 'none' || folderId === '') {
        where.folderId = null;
      } else if (typeof folderId === 'string') {
        where.folderId = folderId;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (tag && typeof tag === 'string') {
      where.tags = { has: tag };
    }

    if (pinned !== undefined && pinned !== '') {
      const pinnedBool = String(pinned) === 'true';
      where.pinned = pinnedBool;
    }

    const notes = await prisma.note.findMany({
      where: where as Prisma.NoteWhereInput,
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        pinned: true,
        dashboardId: true,
        businessId: true,
        folderId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      } as Prisma.NoteSelect,
    });

    const notesWithOwner = notes.map((n) => {
      const { createdById, ...rest } = n;
      return { ...rest, isOwner: createdById === userId };
    });

    res.json({ notes: notesWithOwner });
  } catch (error: unknown) {
    const err = error as Error;
    logNotesError('Error in getNotes', 'notes_list', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

/**
 * GET /api/notes/:id
 * Get a single note by ID
 */
export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }

    const note = await prisma.note.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdById: userId },
          { shares: { some: { sharedWithUserId: userId } } },
        ],
      } as Prisma.NoteWhereInput,
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        pinned: true,
        dashboardId: true,
        businessId: true,
        folderId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        shares: {
          where: { sharedWithUserId: userId },
          select: { role: true },
          take: 1,
        },
      } as Prisma.NoteSelect,
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const noteWithShares = note as { shares?: Array<{ role: string }>; createdById: string; [k: string]: unknown };
    const shareWithMe = noteWithShares.shares?.[0];
    const canEdit = note.createdById === userId || shareWithMe?.role === 'editor';
    const isOwner = note.createdById === userId;
    const { shares: _s, ...noteData } = noteWithShares;
    res.json({ ...noteData, canEdit, isOwner });
  } catch (error: unknown) {
    const err = error as Error;
    logNotesError('Error in getNoteById', 'notes_get', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { title, content, dashboardId, businessId, tags, pinned, folderId } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const normalizedBusinessId =
      businessId && typeof businessId === 'string' ? businessId : null;

    try {
      await assertUserOwnedDashboardBusinessAlignment(
        prisma,
        userId,
        dashboardId,
        normalizedBusinessId
      );
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg === 'Task dashboard not found') {
        res.status(404).json({ error: 'Dashboard not found' });
        return;
      }
      if (msg === 'Task dashboard context mismatch') {
        res.status(400).json({ error: 'Dashboard does not match business context' });
        return;
      }
      throw e;
    }

    if (folderId && typeof folderId === 'string') {
      const folder = await prisma.noteFolder.findFirst({
        where: {
          id: folderId,
          createdById: userId,
          dashboardId,
          businessId: normalizedBusinessId,
        },
      });
      if (!folder) {
        res.status(400).json({ error: 'Folder not found or not in this dashboard' });
        return;
      }
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: typeof content === 'string' ? content : '',
        dashboardId,
        businessId: normalizedBusinessId,
        folderId: folderId && typeof folderId === 'string' ? folderId : null,
        tags: Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string') : [],
        pinned: Boolean(pinned),
        createdById: userId,
        updatedById: userId,
      } as unknown as Prisma.NoteCreateInput,
    });

    res.status(201).json(note);
  } catch (error: unknown) {
    const err = error as Error;
    logNotesError('Error in createNote', 'notes_create', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }

    const { title, content, tags, pinned, folderId } = req.body;

    const existing = await prisma.note.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdById: userId },
          { shares: { some: { sharedWithUserId: userId, role: 'editor' } } },
        ],
      } as Prisma.NoteWhereInput,
    });

    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const data: Record<string, unknown> = {
      updatedBy: { connect: { id: userId } },
    };

    if (title !== undefined && typeof title === 'string') {
      data.title = title.trim();
    }
    if (content !== undefined) {
      data.content = typeof content === 'string' ? content : '';
    }
    if (Array.isArray(tags)) {
      data.tags = tags.filter((t: unknown) => typeof t === 'string');
    }
    if (pinned !== undefined) {
      data.pinned = Boolean(pinned);
    }
    if (folderId !== undefined) {
      data.folder = folderId && typeof folderId === 'string' ? { connect: { id: folderId } } : { disconnect: true };
    }

    const note = await prisma.note.update({
      where: { id },
      data: data as Prisma.NoteUpdateInput,
    });

    res.json(note);
  } catch (error: unknown) {
    const err = error as Error;
    logNotesError('Error in updateNote', 'notes_update', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
}

/**
 * DELETE /api/notes/:id
 * Soft delete a note
 */
export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }

    const existing = await prisma.note.findFirst({
      where: {
        id,
        createdById: userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    await prisma.note.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    logNotesError('Error in deleteNote', 'notes_delete', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
}
