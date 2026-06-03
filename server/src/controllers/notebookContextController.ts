import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { NotesServiceError } from '../services/notes/notesErrors';
import * as notebookContextService from '../services/notebook/notebookContextService';

export async function getPageContext(req: Request, res: Response): Promise<void> {
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

    const context = await notebookContextService.getPageContext(pageId, userId);
    res.status(200).json(context);
  } catch (error: unknown) {
    if (error instanceof NotesServiceError) {
      res.status(error.httpStatus).json({ error: error.message });
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error in getPageContext', {
      operation: 'notebook_page_context',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to load page context' });
  }
}
