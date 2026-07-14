/**
 * Phase 8B — Canonical Skill entry helpers for productized pilots.
 * Product surfaces call these (or compat wrappers) → executeSkill → domain implementations.
 */
import type {
  NotebookExtractActionItemsResult,
  NotebookPageSummaryResult,
} from '../../services/notebook/notebookAIResultTypes';
import type { DocumentType, InvoiceExtraction } from '../types/documentExtraction';
import { NotebookAIServiceError } from '../../services/notebook/notebookAIErrors';
import { executeSkill } from './skillRunner';

export async function runNotebookPageSummarySkill(params: {
  pageId: string;
  userId: string;
  businessId?: string | null;
  requestId?: string;
  conversationId?: string;
}): Promise<NotebookPageSummaryResult> {
  const result = await executeSkill({
    skillKey: 'notebook_page_summary',
    input: { pageId: params.pageId },
    userId: params.userId,
    businessId: params.businessId,
    requestId: params.requestId,
    conversationId: params.conversationId,
    moduleId: 'notebook',
  });

  if (!result.ok || !result.output) {
    throw new NotebookAIServiceError(
      result.error ?? 'Notebook summary Skill failed',
      result.status === 'REJECTED' ? 'forbidden' : 'unavailable',
      result.status === 'REJECTED' ? 400 : 503
    );
  }

  return {
    summary: String(result.output.summary ?? ''),
    keyDecisions: Array.isArray(result.output.keyDecisions)
      ? (result.output.keyDecisions as string[])
      : [],
    openTasks: Array.isArray(result.output.openTasks)
      ? (result.output.openTasks as string[])
      : [],
    risksAndFollowUps: Array.isArray(result.output.risksAndFollowUps)
      ? (result.output.risksAndFollowUps as string[])
      : [],
    warnings: Array.isArray(result.output.warnings) ? (result.output.warnings as string[]) : [],
  };
}

export async function runNotebookActionExtractionSkill(params: {
  pageId: string;
  userId: string;
  selectedText?: string;
  businessId?: string | null;
  requestId?: string;
  conversationId?: string;
}): Promise<NotebookExtractActionItemsResult> {
  const input: Record<string, unknown> = { pageId: params.pageId };
  if (params.selectedText) input.selectedText = params.selectedText;

  const result = await executeSkill({
    skillKey: 'notebook_action_extraction',
    input,
    userId: params.userId,
    businessId: params.businessId,
    requestId: params.requestId,
    conversationId: params.conversationId,
    moduleId: 'notebook',
  });

  if (!result.ok || !result.output) {
    throw new NotebookAIServiceError(
      result.error ?? 'Notebook action extraction Skill failed',
      result.status === 'REJECTED' ? 'forbidden' : 'unavailable',
      result.status === 'REJECTED' ? 400 : 503
    );
  }

  const proposals = Array.isArray(result.output.proposals)
    ? (result.output.proposals as NotebookExtractActionItemsResult['proposals'])
    : [];

  return {
    proposals,
    warnings: Array.isArray(result.output.warnings)
      ? (result.output.warnings as string[])
      : [],
  };
}

export async function runStructuredDocumentExtractionSkill(params: {
  documentText: string;
  documentType: DocumentType;
  userId: string;
  businessId?: string | null;
  requestId?: string;
}): Promise<{ success: true; data: InvoiceExtraction } | { success: false; error: string }> {
  const result = await executeSkill({
    skillKey: 'structured_document_extraction',
    input: {
      documentText: params.documentText,
      documentType: params.documentType,
    },
    userId: params.userId,
    businessId: params.businessId,
    requestId: params.requestId,
  });

  if (!result.ok || !result.output) {
    return { success: false, error: result.error ?? 'Document extraction Skill failed' };
  }

  if (result.output.success === true && result.output.data && typeof result.output.data === 'object') {
    return {
      success: true,
      data: result.output.data as InvoiceExtraction,
    };
  }

  return {
    success: false,
    error:
      typeof result.output.error === 'string'
        ? result.output.error
        : 'Document extraction did not succeed',
  };
}
