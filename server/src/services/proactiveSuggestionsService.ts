/**
 * Phase 7: Proactive AI suggestions. Creates suggestions from events (e.g. document upload).
 * No auto-execution; user must accept or dismiss.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from './notificationService';

const DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function isDocumentMime(mimetype: string): boolean {
  const lower = mimetype.toLowerCase();
  if (DOCUMENT_MIMES.some((m) => lower === m)) return true;
  if (lower.startsWith('text/') || lower.includes('pdf') || lower.includes('document')) return true;
  return false;
}

export interface DocumentUploadContext {
  userId: string;
  fileId: string;
  fileName: string;
  mimetype: string;
}

/**
 * Called after a file is uploaded. If it's a document, create an AI suggestion and notify the user.
 * Does not block; errors are logged.
 */
export async function onFileUploaded(context: DocumentUploadContext): Promise<void> {
  if (!isDocumentMime(context.mimetype)) return;
  try {
    const suggestion = await prisma.aISuggestion.create({
      data: {
        userId: context.userId,
        type: 'document_upload',
        title: 'Document uploaded',
        body: `You uploaded "${context.fileName}". Would you like me to extract key info (e.g. invoice/receipt) or add a reminder from it?`,
        actionData: {
          fileId: context.fileId,
          fileName: context.fileName,
          suggestedActions: ['extract_document', 'add_reminder'],
          suggestedPrompt: `Extract key information from "${context.fileName}". Identify important details like dates, amounts, names, and any actionable items.`,
        },
        status: 'PENDING',
      },
    });
    await NotificationService.createNotification({
      userId: context.userId,
      type: 'ai_suggestion',
      title: 'AI suggestion',
      body: suggestion.body,
      data: {
        suggestionId: suggestion.id,
        fileId: context.fileId,
        actionUrl: `/ai-chat?suggestion=${suggestion.id}`,
      },
    });
    await logger.info('Proactive suggestion created', {
      operation: 'proactive_suggestion_created',
      suggestionId: suggestion.id,
      userId: context.userId,
      fileId: context.fileId,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await logger.warn('Failed to create proactive suggestion', {
      operation: 'proactive_suggestion_error',
      userId: context.userId,
      fileId: context.fileId,
      error: { message: error.message, stack: error.stack },
    });
  }
}
