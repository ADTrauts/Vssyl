/**
 * @deprecated Use ambientSuggestionService via domain events (Phase 5A).
 * Kept for backward-compatible imports during migration.
 */

export type { DocumentUploadContext } from './ambientSuggestionServiceLegacyTypes';

import type { DocumentUploadContext } from './ambientSuggestionServiceLegacyTypes';
import { ambientSuggestionService } from './ambientSuggestionService';
import { logger } from '../lib/logger';

/**
 * @deprecated Prefer domain event → AIEventConsumer → ambientSuggestionService.
 */
export async function onFileUploaded(context: DocumentUploadContext): Promise<void> {
  void logger.debug('onFileUploaded deprecated — use domain event path', {
    operation: 'proactive_suggestion_deprecated',
    userId: context.userId,
    fileId: context.fileId,
  });
  if (!context.dashboardId) {
    return;
  }
  await ambientSuggestionService.processDomainEvent({
    id: `legacy-upload-${context.fileId}`,
    type: 'file.uploaded',
    actorUserId: context.userId,
    dashboardId: context.dashboardId,
    businessId: context.businessId ?? null,
    householdId: null,
    entityType: 'File',
    entityId: context.fileId,
    action: 'create',
    metadata: {
      fileType: context.mimetype,
      fileName: context.fileName,
      dashboardId: context.dashboardId,
    },
    createdAt: new Date().toISOString(),
  });
}
