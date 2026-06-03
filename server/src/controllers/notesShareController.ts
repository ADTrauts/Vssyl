/**
 * Notes share controller — thin adapter over notesShareService.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { NotesServiceError } from '../services/notes/notesErrors';
import * as notesShare from '../services/notes/notesShareService';

function mapNotesError(res: Response, error: unknown): boolean {
  if (error instanceof NotesServiceError) {
    res.status(error.httpStatus).json({ error: error.message });
    return true;
  }
  return false;
}

export async function shareNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: noteId } = req.params;
    const { sharedWithUserId, role } = req.body;

    if (!noteId) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }
    if (!sharedWithUserId || typeof sharedWithUserId !== 'string') {
      res.status(400).json({ error: 'sharedWithUserId is required' });
      return;
    }

    const shareRole = role === 'editor' ? 'editor' : 'viewer';
    const share = await notesShare.sharePage({
      ownerUserId: userId,
      pageId: noteId,
      sharedWithUserId,
      role: shareRole,
    });

    res.status(201).json(share);
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in shareNote', {
      operation: 'notes_share',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to share note' });
  }
}

export async function revokeShare(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: noteId, userId: targetUserId } = req.params;

    if (!noteId || !targetUserId) {
      res.status(400).json({ error: 'Note ID and user ID are required' });
      return;
    }

    await notesShare.revokePageShare({
      ownerUserId: userId,
      pageId: noteId,
      targetUserId,
    });

    res.status(204).send();
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in revokeShare', {
      operation: 'notes_revoke_share',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to revoke share' });
  }
}

export async function getNoteShares(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: noteId } = req.params;

    if (!noteId) {
      res.status(400).json({ error: 'Note ID is required' });
      return;
    }

    const shares = await notesShare.listPageShares({ ownerUserId: userId, pageId: noteId });
    res.json({ shares });
  } catch (error: unknown) {
    if (mapNotesError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in getNoteShares', {
      operation: 'notes_list_shares',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to list shares' });
  }
}
