import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { NotesServiceError } from '../services/notes/notesErrors';
import { NotebookAIServiceError } from '../services/notebook/notebookAIErrors';
import * as notebookAIActionService from '../services/notebook/notebookAIActionService';
import type { NotebookActionItemProposal } from '../services/notebook/notebookAIResultTypes';

function mapError(res: Response, error: unknown): boolean {
  if (error instanceof NotebookAIServiceError) {
    res.status(error.httpStatus).json({ error: error.message });
    return true;
  }
  if (error instanceof NotesServiceError) {
    res.status(error.httpStatus).json({ error: error.message });
    return true;
  }
  return false;
}

function parsePriority(value: unknown): NotebookActionItemProposal['priority'] {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
    return value;
  }
  return null;
}

function parseProposals(body: unknown): NotebookActionItemProposal[] {
  if (!body || typeof body !== 'object') return [];
  const proposals = (body as { proposals?: unknown }).proposals;
  if (!Array.isArray(proposals)) return [];
  return proposals
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
    .map((p) => ({
      title: typeof p.title === 'string' ? p.title : '',
      description: typeof p.description === 'string' ? p.description : null,
      dueDate: typeof p.dueDate === 'string' ? p.dueDate : null,
      priority: parsePriority(p.priority),
    }))
    .filter((p) => p.title.trim());
}

export async function postPageSummary(req: Request, res: Response): Promise<void> {
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
    const result = await notebookAIActionService.summarizePage(pageId, userId);
    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('postPageSummary failed', {
      operation: 'notebook_ai_summary',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to summarize page' });
  }
}

export async function postExtractActionItems(req: Request, res: Response): Promise<void> {
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
    const selectedText =
      typeof req.body?.selectedText === 'string' ? req.body.selectedText : undefined;
    const result = await notebookAIActionService.extractActionItems({
      pageId,
      userId,
      selectedText,
    });
    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('postExtractActionItems failed', {
      operation: 'notebook_ai_extract',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to extract action items' });
  }
}

export async function postConfirmActionItems(req: Request, res: Response): Promise<void> {
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
    const proposals = parseProposals(req.body);
    if (!proposals.length) {
      res.status(400).json({ error: 'proposals array is required' });
      return;
    }
    const result = await notebookAIActionService.confirmExtractedActionItems({
      pageId,
      userId,
      proposals,
    });
    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('postConfirmActionItems failed', {
      operation: 'notebook_ai_confirm',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create action items' });
  }
}

export async function postMeetingRecap(req: Request, res: Response): Promise<void> {
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
    const result = await notebookAIActionService.generateMeetingRecap(pageId, userId);
    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('postMeetingRecap failed', {
      operation: 'notebook_ai_recap',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to generate meeting recap' });
  }
}

export async function postSuggestLinks(req: Request, res: Response): Promise<void> {
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
    const result = await notebookAIActionService.suggestLinks(pageId, userId);
    res.status(200).json(result);
  } catch (error: unknown) {
    if (mapError(res, error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('postSuggestLinks failed', {
      operation: 'notebook_ai_suggest_links',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to suggest links' });
  }
}
