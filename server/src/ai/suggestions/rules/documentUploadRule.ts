/**
 * document_upload_v1 — file.uploaded with document mime (Phase 5B).
 */

import type { Prisma } from '@prisma/client';
import {
  CORRELATION_RULE_IDS,
  isDocumentMime,
  SUGGESTION_TYPES,
  type DocumentUploadActionData,
  type SuggestionExplainability,
} from '../suggestionTypes';
import { resolveDashboardIdFromEvent } from '../suggestionEventUtils';
import type { SuggestionCandidate, SuggestionRuleContext } from '../suggestionRuleTypes';
import {
  resolveBusinessIdFromDashboard,
  resolveTenantScope,
} from './ruleContextHelpers';

export async function evaluateDocumentUploadRule(
  ctx: SuggestionRuleContext
): Promise<SuggestionCandidate | null> {
  const { event } = ctx;
  const metadata = event.metadata ?? {};
  const fileType = typeof metadata.fileType === 'string' ? metadata.fileType : '';
  if (!isDocumentMime(fileType)) {
    return null;
  }

  const dashboardId = resolveDashboardIdFromEvent(event);
  if (!dashboardId) {
    return null;
  }

  let fileName =
    typeof metadata.fileName === 'string' && metadata.fileName.trim()
      ? metadata.fileName.trim()
      : null;

  if (!fileName) {
    const file = await ctx.db.file.findUnique({
      where: { id: event.entityId },
      select: { name: true },
    });
    fileName = file?.name ?? 'Document';
  }

  const businessId =
    (await resolveTenantScope(event, ctx.db)).businessId ??
    (await resolveBusinessIdFromDashboard(ctx.db, dashboardId));

  const suppressionKey = `${SUGGESTION_TYPES.DOCUMENT_UPLOAD}:${dashboardId}:${event.entityId}`;
  const actionData: DocumentUploadActionData = {
    fileId: event.entityId,
    fileName,
    suggestedActions: ['extract_document', 'add_reminder'],
    suggestedPrompt: `Extract key information from "${fileName}". Identify important details like dates, amounts, names, and any actionable items.`,
  };

  const explainability: SuggestionExplainability = {
    summary: `You uploaded "${fileName}". I can help extract key info or set a reminder.`,
    contextUsed: [{ moduleId: 'drive', reason: 'Document uploaded to your workspace' }],
    correlationReason: `${CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1}: file.uploaded with document mime type`,
    sourceEventIds: [event.id],
  };

  return {
    userId: event.actorUserId,
    dashboardId,
    businessId,
    householdId: event.householdId ?? null,
    suggestionType: SUGGESTION_TYPES.DOCUMENT_UPLOAD,
    title: 'Document uploaded',
    body: `You uploaded "${fileName}". Would you like me to extract key info (e.g. invoice/receipt) or add a reminder from it?`,
    actionData: actionData as unknown as Prisma.InputJsonValue,
    confidence: 0.75,
    explainability,
    correlationRuleId: CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1,
    suppressionKey,
    priority: 'normal',
    sourceEventIds: [event.id],
  };
}
