import { Request, Response } from 'express';
import { NotebookLinkEntityType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { NotesServiceError } from '../services/notes/notesErrors';
import { NotebookLinkServiceError } from '../services/notebook/notebookLinkErrors';
import * as notebookLinkService from '../services/notebook/notebookLinkService';

function mapNotebookLinkError(res: Response, error: unknown): boolean {
  if (error instanceof NotebookLinkServiceError) {
    res.status(error.httpStatus).json({ error: error.message });
    return true;
  }
  if (error instanceof NotesServiceError) {
    res.status(error.httpStatus).json({ error: error.message });
    return true;
  }
  return false;
}

export async function getPageLinks(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const pageId = req.params.pageId;
    if (!pageId || typeof pageId !== 'string') {
      res.status(400).json({ error: 'pageId is required' });
      return;
    }

    const targetTypeRaw = req.query.targetType;
    let targetType: NotebookLinkEntityType | undefined;
    if (typeof targetTypeRaw === 'string' && targetTypeRaw.trim()) {
      const parsed = notebookLinkService.parseEntityType(targetTypeRaw);
      if (!parsed) {
        res.status(400).json({ error: 'Invalid targetType' });
        return;
      }
      targetType = parsed;
    }

    const relationshipTypeRaw = req.query.relationshipType;
    let relationshipType: ReturnType<typeof notebookLinkService.parseRelationshipType> | undefined;
    if (typeof relationshipTypeRaw === 'string' && relationshipTypeRaw.trim()) {
      relationshipType = notebookLinkService.parseRelationshipType(relationshipTypeRaw);
    }

    const includeArchived = req.query.includeArchived === 'true';

    const result = await notebookLinkService.listPageLinks({
      userId,
      pageId,
      targetType,
      relationshipType,
      includeArchived,
    });

    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapNotebookLinkError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in getPageLinks', {
      operation: 'notebook_link_list',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to list page links' });
  }
}

export async function createPageLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const pageId = req.params.pageId;
    if (!pageId || typeof pageId !== 'string') {
      res.status(400).json({ error: 'pageId is required' });
      return;
    }

    const { targetType: targetTypeRaw, targetId, relationshipType, metadata } = req.body ?? {};

    if (!targetId || typeof targetId !== 'string') {
      res.status(400).json({ error: 'targetId is required' });
      return;
    }
    if (!targetTypeRaw || typeof targetTypeRaw !== 'string') {
      res.status(400).json({ error: 'targetType is required' });
      return;
    }

    const targetType = notebookLinkService.parseEntityType(targetTypeRaw);
    if (!targetType || targetType === 'PAGE') {
      res.status(400).json({ error: 'Invalid targetType' });
      return;
    }

    const meta =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : undefined;

    const parsedRelationship =
      typeof relationshipType === 'string'
        ? notebookLinkService.parseRelationshipType(relationshipType)
        : undefined;

    const { link, created } = await notebookLinkService.createPageLink({
      userId,
      pageId,
      targetType,
      targetId,
      relationshipType: parsedRelationship,
      metadata: meta,
    });

    res.status(created ? 201 : 200).json(link);
  } catch (error: unknown) {
    if (mapNotebookLinkError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in createPageLink', {
      operation: 'notebook_link_create',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create page link' });
  }
}

export async function getEntityLinks(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const entityTypeRaw = req.params.entityType;
    const entityId = req.params.entityId;
    if (!entityTypeRaw || typeof entityTypeRaw !== 'string') {
      res.status(400).json({ error: 'entityType is required' });
      return;
    }
    if (!entityId || typeof entityId !== 'string') {
      res.status(400).json({ error: 'entityId is required' });
      return;
    }

    const entityType = notebookLinkService.parseEntityType(entityTypeRaw);
    if (!entityType) {
      res.status(400).json({ error: 'Invalid entityType' });
      return;
    }

    const result = await notebookLinkService.listEntityLinks({
      userId,
      entityType,
      entityId,
    });

    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapNotebookLinkError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in getEntityLinks', {
      operation: 'notebook_link_entity_list',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to list entity links' });
  }
}

export async function archiveNotebookLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const linkId = req.params.linkId;
    if (!linkId || typeof linkId !== 'string') {
      res.status(400).json({ error: 'linkId is required' });
      return;
    }

    await notebookLinkService.archiveNotebookLink({ userId, linkId });
    res.status(204).send();
  } catch (error: unknown) {
    if (mapNotebookLinkError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in archiveNotebookLink', {
      operation: 'notebook_link_archive',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to archive link' });
  }
}
