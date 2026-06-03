/**
 * Notes / Notebook Pages Controller — thin HTTP adapter over notes services.
 */

import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotesServiceError } from '../services/notes/notesErrors';
import { NotesTrashError } from '../services/notes/notesErrors';
import * as notesVisibility from '../services/notes/notesVisibilityService';
import * as notesPage from '../services/notes/notesPageService';
import * as notesTrash from '../services/notes/notesTrashService';

function logNotesError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function mapNotesError(res: Response, error: unknown): boolean {
  if (error instanceof NotesServiceError) {
    res.status(error.httpStatus).json({ error: error.message });
    return true;
  }
  if (error instanceof NotesTrashError) {
    if (error.code === 'forbidden') {
      res.status(403).json({ error: 'Not authorized' });
      return true;
    }
    if (error.code === 'not_found') {
      res.status(404).json({ error: 'Page not found' });
      return true;
    }
  }
  return false;
}

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

    const notes = await notesVisibility.listPages({
      userId,
      dashboardId,
      businessId: businessId && typeof businessId === 'string' ? businessId : null,
      search: search && typeof search === 'string' ? search : undefined,
      tag: tag && typeof tag === 'string' ? tag : undefined,
      pinned: pinned !== undefined && pinned !== '' ? String(pinned) === 'true' : undefined,
      folderId:
        !sharedWithMe || String(sharedWithMe) !== 'true'
          ? folderId !== undefined && folderId !== ''
            ? folderId === 'none' || folderId === ''
              ? ''
              : typeof folderId === 'string'
                ? folderId
                : undefined
            : undefined
          : undefined,
      sharedWithMe: String(sharedWithMe) === 'true',
    });

    res.json({ notes });
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    logNotesError('Error in getNotes', 'notes_list', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

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

    const page = await notesVisibility.getPageById(id, userId);
    if (!page) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(page);
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    logNotesError('Error in getNoteById', 'notes_get', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { title, content, dashboardId, businessId, tags, pinned, folderId } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const note = await notesPage.createPage({
      userId,
      title,
      content,
      dashboardId,
      businessId: businessId && typeof businessId === 'string' ? businessId : null,
      tags,
      pinned,
      folderId: folderId && typeof folderId === 'string' ? folderId : null,
    });

    res.status(201).json(note);
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    logNotesError('Error in createNote', 'notes_create', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

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

    const note = await notesPage.updatePage({
      userId,
      pageId: id,
      title,
      content,
      tags,
      pinned,
      folderId,
    });

    res.json(note);
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    logNotesError('Error in updateNote', 'notes_update', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
}

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

    await notesTrash.softTrashPage(userId, id);
    res.status(204).send();
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    logNotesError('Error in deleteNote', 'notes_delete', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
}
