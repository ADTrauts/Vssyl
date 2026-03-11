/**
 * Notes Share Controller
 * Share note with user, revoke share, list shares; sends notes_shared notification
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { logger } from '../lib/logger';

/**
 * POST /api/notes/:id/share
 * Share note with a user (viewer or editor). Creates or updates share; notifies recipient.
 */
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

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        createdById: userId,
        deletedAt: null,
      },
      select: { id: true, title: true },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (sharedWithUserId === userId) {
      res.status(400).json({ error: 'Cannot share with yourself' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma client includes NoteShare after generate; types may lag in IDE
    const share = await (prisma as any).noteShare.upsert({
      where: {
        noteId_sharedWithUserId: { noteId, sharedWithUserId },
      },
      create: {
        noteId,
        sharedWithUserId,
        sharedById: userId,
        role: shareRole,
      },
      update: { role: shareRole },
      select: {
        id: true,
        noteId: true,
        sharedWithUserId: true,
        role: true,
        createdAt: true,
      },
    });

    try {
      const sharer = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const sharerName = sharer?.name ?? 'Someone';
      await NotificationService.createNotification({
        type: 'notes_shared',
        title: 'Note shared with you',
        body: `${sharerName} shared "${note.title}" with you as ${shareRole}.`,
        userId: sharedWithUserId,
        data: {
          noteId,
          sharedById: userId,
          role: shareRole,
          noteTitle: note.title,
          actionUrl: '/notes',
        },
      });
    } catch (notificationError) {
      const err = notificationError instanceof Error ? notificationError : new Error('Unknown error');
      logger.warn('Failed to send notes_shared notification', {
        operation: 'notes_share_notification',
        error: { message: err.message, stack: err.stack },
      });
    }

    res.status(201).json(share);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in shareNote:', err);
    res.status(500).json({ error: 'Failed to share note' });
  }
}

/**
 * DELETE /api/notes/:id/share/:userId
 * Revoke share for a user (owner only).
 */
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

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        createdById: userId,
        deletedAt: null,
      },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    await (prisma as any).noteShare.deleteMany({
      where: {
        noteId,
        sharedWithUserId: targetUserId,
      },
    });

    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in revokeShare:', err);
    res.status(500).json({ error: 'Failed to revoke share' });
  }
}

/**
 * GET /api/notes/:id/shares
 * List users this note is shared with (owner only).
 */
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

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        createdById: userId,
        deletedAt: null,
      },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const shares = await (prisma as any).noteShare.findMany({
      where: { noteId },
      select: {
        id: true,
        sharedWithUserId: true,
        role: true,
        createdAt: true,
        sharedWith: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ shares });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in getNoteShares:', err);
    res.status(500).json({ error: 'Failed to list shares' });
  }
}
