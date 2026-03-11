/**
 * Notes Folders Controller
 * CRUD for note folders with multi-tenant scoping
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

// Prisma client includes noteFolder after generate; types may lag in IDE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noteFolderDb = (prisma as any).noteFolder as any;

/**
 * GET /api/notes/folders
 * List folders for dashboard/business
 */
export async function getFolders(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const where: { createdById: string; dashboardId: string; businessId: string | null } = {
      createdById: userId,
      dashboardId,
      businessId: businessId && typeof businessId === 'string' ? businessId : null,
    };

    const folders = await noteFolderDb.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        dashboardId: true,
        businessId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { notes: true } },
      },
    });

    res.json({ folders });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in getFolders:', err);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
}

/**
 * POST /api/notes/folders
 * Create a folder
 */
export async function createFolder(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, dashboardId, businessId, parentId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const folder = await noteFolderDb.create({
      data: {
        name: name.trim(),
        dashboardId,
        businessId: businessId && typeof businessId === 'string' ? businessId : null,
        parentId: parentId && typeof parentId === 'string' ? parentId : null,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
        dashboardId: true,
        businessId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(folder);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in createFolder:', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

/**
 * PUT /api/notes/folders/:id
 * Update a folder (rename, move)
 */
export async function updateFolder(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Folder ID is required' });
      return;
    }

    const { name, parentId } = req.body;

    const existing = await noteFolderDb.findFirst({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    const data: { name?: string; parent?: { connect: { id: string } } | { disconnect: true } } = {};
    if (name !== undefined && typeof name === 'string') {
      data.name = name.trim();
    }
    if (parentId !== undefined) {
      data.parent = parentId && typeof parentId === 'string' ? { connect: { id: parentId } } : { disconnect: true };
    }

    const folder = await noteFolderDb.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        dashboardId: true,
        businessId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(folder);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in updateFolder:', err);
    res.status(500).json({ error: 'Failed to update folder' });
  }
}

/**
 * DELETE /api/notes/folders/:id
 * Delete folder; notes in folder become unfiled (folderId set null)
 */
export async function deleteFolder(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Folder ID is required' });
      return;
    }

    const existing = await noteFolderDb.findFirst({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    await noteFolderDb.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in deleteFolder:', err);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}
