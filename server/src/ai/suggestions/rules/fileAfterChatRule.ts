/**
 * file_after_chat_v1 — file upload after chat activity (Phase 5C).
 */

import type { Prisma } from '@prisma/client';
import { DOMAIN_EVENT_TYPES } from '../../../events/domainEventRegistry';
import { linkEntitiesAcrossModules } from '../../context/entityLinking';
import {
  CORRELATION_RULE_IDS,
  CORRELATION_WINDOWS,
  SUGGESTION_TYPES,
  type FileReviewActionData,
  type SuggestionExplainability,
} from '../suggestionTypes';
import { resolveDashboardIdFromEvent } from '../suggestionEventUtils';
import type { SuggestionCandidate, SuggestionRuleContext } from '../suggestionRuleTypes';
import {
  filterSignalsByTenant,
  isWithinMs,
  parseSignalMetadata,
  resolveBusinessIdFromDashboard,
  resolveTenantScope,
  signalsOfType,
  uniqueEventIds,
} from './ruleContextHelpers';

interface ChatMatch {
  conversationId: string;
  threadId?: string;
  hasAttachments: boolean;
  domainEventId: string | null;
  occurredAt: Date;
}

interface FileMatch {
  fileId: string;
  fileName: string;
  domainEventId: string | null;
  occurredAt: Date;
}

function extractChatMatches(signals: ReturnType<typeof signalsOfType>): ChatMatch[] {
  const matches: ChatMatch[] = [];
  for (const signal of signals) {
    const meta = parseSignalMetadata(signal);
    const conversationId =
      typeof meta.conversationId === 'string' ? meta.conversationId : '';
    if (!conversationId) continue;
    matches.push({
      conversationId,
      threadId: typeof meta.threadId === 'string' ? meta.threadId : undefined,
      hasAttachments:
        meta.hasAttachments === true ||
        (typeof meta.attachmentCount === 'number' && meta.attachmentCount > 0),
      domainEventId: signal.domainEventId,
      occurredAt: signal.occurredAt,
    });
  }
  return matches;
}

function extractFileMatches(signals: ReturnType<typeof signalsOfType>): FileMatch[] {
  return signals.map((signal) => {
    const meta = parseSignalMetadata(signal);
    const fileName =
      typeof meta.fileName === 'string' && meta.fileName.trim()
        ? meta.fileName.trim()
        : 'File';
    return {
      fileId: signal.entityId ?? '',
      fileName,
      domainEventId: signal.domainEventId,
      occurredAt: signal.occurredAt,
    };
  }).filter((f) => f.fileId);
}

function pairChatAndFile(
  chat: ChatMatch,
  file: FileMatch,
  reference: Date
): boolean {
  const windowMs = CORRELATION_WINDOWS.FILE_AFTER_CHAT_MS;
  const chatFirst = chat.occurredAt <= file.occurredAt;
  if (chatFirst) {
    return file.occurredAt.getTime() - chat.occurredAt.getTime() <= windowMs;
  }
  return isWithinMs(chat.occurredAt, windowMs, file.occurredAt);
}

function hasEntityLinkBoost(fileId: string, conversationId: string): boolean {
  const links = linkEntitiesAcrossModules({
    moduleContexts: {
      chat: {
        context: {
          recentConversations: [
            {
              id: conversationId,
              attachments: [{ fileId }],
            },
          ],
        },
      },
      drive: {
        context: {
          recentFiles: [{ id: fileId, name: 'linked' }],
        },
      },
    },
  });
  return links.linkedFiles.some((f) => f.fileId === fileId);
}

export async function evaluateFileAfterChatRule(
  ctx: SuggestionRuleContext
): Promise<SuggestionCandidate | null> {
  const { event, recentSignals } = ctx;
  const reference = new Date(event.createdAt);
  const scope = await resolveTenantScope(event, ctx.db);
  const tenantSignals = filterSignalsByTenant(recentSignals, scope);

  const chatSignals = signalsOfType(tenantSignals, DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT);
  const fileSignals = signalsOfType(tenantSignals, DOMAIN_EVENT_TYPES.FILE_UPLOADED);

  let chatMatches = extractChatMatches(chatSignals);
  let fileMatches = extractFileMatches(fileSignals);

  if (event.type === DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT) {
    const meta = event.metadata ?? {};
    const conversationId =
      typeof meta.conversationId === 'string' ? meta.conversationId : '';
    if (!conversationId) return null;
    chatMatches = [
      {
        conversationId,
        threadId: typeof meta.threadId === 'string' ? meta.threadId : undefined,
        hasAttachments: meta.hasAttachments === true,
        domainEventId: event.id,
        occurredAt: reference,
      },
      ...chatMatches.filter((c) => c.domainEventId !== event.id),
    ];
  } else if (event.type === DOMAIN_EVENT_TYPES.FILE_UPLOADED) {
    const meta = event.metadata ?? {};
    const fileName =
      typeof meta.fileName === 'string' && meta.fileName.trim()
        ? meta.fileName.trim()
        : 'File';
    fileMatches = [
      {
        fileId: event.entityId,
        fileName,
        domainEventId: event.id,
        occurredAt: reference,
      },
      ...fileMatches.filter((f) => f.domainEventId !== event.id),
    ];
  } else {
    return null;
  }

  let bestChat: ChatMatch | null = null;
  let bestFile: FileMatch | null = null;
  let entityLinked = false;

  for (const chat of chatMatches) {
    for (const file of fileMatches) {
      if (!pairChatAndFile(chat, file, reference)) continue;
      const linked = hasEntityLinkBoost(file.fileId, chat.conversationId);
      if (!bestChat || linked) {
        bestChat = chat;
        bestFile = file;
        entityLinked = linked;
      }
    }
  }

  if (!bestChat || !bestFile) return null;

  const dashboardId =
    resolveDashboardIdFromEvent(event) ??
    tenantSignals.find((s) => s.dashboardId)?.dashboardId ??
    null;
  if (!dashboardId) return null;

  const businessId =
    scope.businessId ?? (await resolveBusinessIdFromDashboard(ctx.db, dashboardId));

  let fileName = bestFile.fileName;
  const dbFile = await ctx.db.file.findUnique({
    where: { id: bestFile.fileId },
    select: { name: true },
  });
  if (dbFile?.name) fileName = dbFile.name;

  const actionData: FileReviewActionData = {
    fileId: bestFile.fileId,
    fileName,
    conversationId: bestChat.conversationId,
    suggestedPrompt: `Review "${fileName}" in the context of recent chat activity. Summarize what changed and whether any follow-up is needed.`,
    deepLink: `/ai-chat?fileIds=${encodeURIComponent(bestFile.fileId)}&suggestion=file_review`,
  };

  const explainability: SuggestionExplainability = {
    summary: `"${fileName}" was updated after activity in a related chat thread.`,
    contextUsed: [
      { moduleId: 'chat', reason: 'Recent message activity' },
      { moduleId: 'drive', reason: 'File updated within 4 hours' },
    ],
    correlationReason: `${CORRELATION_RULE_IDS.FILE_AFTER_CHAT_V1}: chat.message.sent + file.uploaded within 4h${entityLinked ? ' (entity link)' : ''}`,
    sourceEventIds: uniqueEventIds(
      [bestChat.domainEventId, bestFile.domainEventId, event.id]
    ),
  };

  const suppressionKey = `${SUGGESTION_TYPES.FILE_REVIEW}:${dashboardId}:${bestFile.fileId}`;

  return {
    userId: event.actorUserId,
    dashboardId,
    businessId,
    householdId: event.householdId ?? null,
    suggestionType: SUGGESTION_TYPES.FILE_REVIEW,
    title: 'Review updated file',
    body: `"${fileName}" was updated after chat activity. Would you like to review what changed?`,
    actionData: actionData as unknown as Prisma.InputJsonValue,
    confidence: entityLinked ? 0.78 : bestChat.hasAttachments ? 0.72 : 0.68,
    explainability,
    correlationRuleId: CORRELATION_RULE_IDS.FILE_AFTER_CHAT_V1,
    suppressionKey,
    priority: 'normal',
    sourceEventIds: explainability.sourceEventIds,
  };
}
