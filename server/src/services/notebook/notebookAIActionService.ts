import { listAccessibleTasks } from '../todoVisibilityService';
import { searchEvents } from '../calendarVisibilityService';
import { aiCreateTask } from '../todoAIActionService';
import * as notebookLinkService from './notebookLinkService';
import { NotebookAIServiceError } from './notebookAIErrors';
import { loadGroundedAIContext } from './notebookAIContextService';
import {
  buildExtractActionItemsPrompt,
  buildMeetingRecapPrompt,
  buildSuggestLinksPrompt,
  buildSummarizePrompt,
} from './notebookAIPromptBuilder';
import { parseNotebookAIJson, runNotebookAICompletion } from './notebookAICompletion';
import type {
  NotebookActionItemProposal,
  NotebookConfirmActionItemsResult,
  NotebookExtractActionItemsResult,
  NotebookLinkSuggestion,
  NotebookMeetingRecapResult,
  NotebookPageSummaryResult,
  NotebookSuggestLinksResult,
} from './notebookAIResultTypes';

function mergeWarnings(ctxWarnings: string[], extra: string[] = []): string[] {
  return [...ctxWarnings, ...extra];
}

function ensureReadable(ctx: Awaited<ReturnType<typeof loadGroundedAIContext>>): void {
  if (!ctx.page.canEdit && !ctx.page.isOwner) {
    // read-only collaborators may still use summarize; writes checked separately
  }
}

export async function summarizePage(
  pageId: string,
  userId: string
): Promise<NotebookPageSummaryResult> {
  const ctx = await loadGroundedAIContext(pageId, userId);
  ensureReadable(ctx);

  const { system, user } = buildSummarizePrompt(ctx);
  const completion = await runNotebookAICompletion({
    userId,
    businessId: ctx.businessId,
    systemPrompt: system,
    userPrompt: user,
    jsonMode: true,
  });

  if (!completion.success) {
    throw new NotebookAIServiceError(completion.error, 'unavailable', 503);
  }

  const parsed = parseNotebookAIJson<{
    summary?: string;
    keyDecisions?: string[];
    openTasks?: string[];
    risksAndFollowUps?: string[];
  }>(completion.text);

  return {
    summary: parsed?.summary?.trim() || completion.text.slice(0, 2000),
    keyDecisions: Array.isArray(parsed?.keyDecisions) ? parsed.keyDecisions : [],
    openTasks: Array.isArray(parsed?.openTasks) ? parsed.openTasks : [],
    risksAndFollowUps: Array.isArray(parsed?.risksAndFollowUps) ? parsed.risksAndFollowUps : [],
    warnings: mergeWarnings(ctx.warnings),
  };
}

export async function extractActionItems(params: {
  pageId: string;
  userId: string;
  selectedText?: string;
}): Promise<NotebookExtractActionItemsResult> {
  const ctx = await loadGroundedAIContext(params.pageId, params.userId);
  const { system, user } = buildExtractActionItemsPrompt(ctx, params.selectedText);

  const completion = await runNotebookAICompletion({
    userId: params.userId,
    businessId: ctx.businessId,
    systemPrompt: system,
    userPrompt: user,
    jsonMode: true,
  });

  if (!completion.success) {
    throw new NotebookAIServiceError(completion.error, 'unavailable', 503);
  }

  const parsed = parseNotebookAIJson<{ proposals?: NotebookActionItemProposal[] }>(completion.text);
  const proposals = Array.isArray(parsed?.proposals)
    ? parsed.proposals.filter((p) => p?.title?.trim())
    : [];

  return {
    proposals: proposals.map((p) => ({
      title: p.title.trim(),
      description: p.description?.trim() || null,
      dueDate: p.dueDate ?? null,
      priority: p.priority ?? null,
    })),
    warnings: mergeWarnings(ctx.warnings),
  };
}

export async function confirmExtractedActionItems(params: {
  pageId: string;
  userId: string;
  proposals: NotebookActionItemProposal[];
}): Promise<NotebookConfirmActionItemsResult> {
  const ctx = await loadGroundedAIContext(params.pageId, params.userId);
  if (!ctx.page.canEdit) {
    throw new NotebookAIServiceError('You do not have permission to edit this page', 'forbidden', 403);
  }

  const created: NotebookConfirmActionItemsResult['created'] = [];
  const errors: NotebookConfirmActionItemsResult['errors'] = [];

  for (const proposal of params.proposals) {
    const title = proposal.title?.trim();
    if (!title) continue;

    const outcome = await aiCreateTask({
      userId: params.userId,
      title,
      description: proposal.description ?? undefined,
      dashboardId: ctx.dashboardId,
      businessId: ctx.businessId,
      dueDate: proposal.dueDate ?? undefined,
      priority: proposal.priority ?? undefined,
    });

    if (!outcome.success) {
      errors.push({ title, error: outcome.error });
      continue;
    }

    const task = outcome.data as { id: string };
    try {
      const { link } = await notebookLinkService.createPageLink({
        userId: params.userId,
        pageId: params.pageId,
        targetType: 'TASK',
        targetId: task.id,
        relationshipType: 'ACTION_SOURCE',
        metadata: {
          actionSource: 'ai_extract',
          extractedTitle: title.slice(0, 200),
        },
      });
      created.push({ taskId: task.id, linkId: link.id, title });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to link task to page';
      errors.push({ title, error: msg });
    }
  }

  return { created, errors, warnings: ctx.warnings };
}

export async function generateMeetingRecap(
  pageId: string,
  userId: string
): Promise<NotebookMeetingRecapResult> {
  const ctx = await loadGroundedAIContext(pageId, userId);
  const extra: string[] = [];
  if (!ctx.events.length) {
    extra.push('No linked calendar event — recap is based on page content and linked tasks only.');
  }

  const { system, user } = buildMeetingRecapPrompt(ctx);
  const completion = await runNotebookAICompletion({
    userId,
    businessId: ctx.businessId,
    systemPrompt: system,
    userPrompt: user,
    jsonMode: true,
  });

  if (!completion.success) {
    throw new NotebookAIServiceError(completion.error, 'unavailable', 503);
  }

  const parsed = parseNotebookAIJson<{
    recap?: string;
    decisions?: string[];
    actionItems?: NotebookActionItemProposal[];
    followUpAgenda?: string[];
  }>(completion.text);

  return {
    recap: parsed?.recap?.trim() || '',
    decisions: Array.isArray(parsed?.decisions) ? parsed.decisions : [],
    actionItems: Array.isArray(parsed?.actionItems)
      ? parsed.actionItems.filter((a) => a?.title?.trim())
      : [],
    followUpAgenda: Array.isArray(parsed?.followUpAgenda) ? parsed.followUpAgenda : [],
    warnings: mergeWarnings(ctx.warnings, extra),
  };
}

async function buildLinkCandidates(
  ctx: Awaited<ReturnType<typeof loadGroundedAIContext>>,
  userId: string
): Promise<string> {
  const linkedTaskIds = new Set(ctx.tasks.map((t) => t.targetId));
  const linkedEventIds = new Set(ctx.events.map((e) => e.targetId));

  const lines: string[] = [];

  const tasks = await listAccessibleTasks({
    userId,
    dashboardId: ctx.dashboardId,
    businessId: ctx.businessId ?? undefined,
  });
  for (const task of tasks.slice(0, 15)) {
    if (linkedTaskIds.has(task.id)) continue;
    lines.push(`TASK ${task.id} — ${task.title} [${task.status}]`);
  }

  const searchText = ctx.page.title.trim() || ctx.page.content.slice(0, 80).trim();
  if (searchText) {
    const now = new Date();
    const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString();
    const events = await searchEvents({
      userId,
      text: searchText,
      start,
      end,
    });
    for (const ev of events.slice(0, 10)) {
      if (linkedEventIds.has(ev.id)) continue;
      lines.push(`CALENDAR_EVENT ${ev.id} — ${ev.title}`);
    }
  }

  if (!lines.length) {
    return '(no additional candidates in scope — suggest based on page themes only without inventing IDs)';
  }
  return lines.join('\n');
}

export async function suggestLinks(
  pageId: string,
  userId: string
): Promise<NotebookSuggestLinksResult> {
  const ctx = await loadGroundedAIContext(pageId, userId);
  const candidates = await buildLinkCandidates(ctx, userId);
  const { system, user } = buildSuggestLinksPrompt(ctx, candidates);

  const completion = await runNotebookAICompletion({
    userId,
    businessId: ctx.businessId,
    systemPrompt: system,
    userPrompt: user,
    jsonMode: true,
  });

  if (!completion.success) {
    throw new NotebookAIServiceError(completion.error, 'unavailable', 503);
  }

  const parsed = parseNotebookAIJson<{ suggestions?: NotebookLinkSuggestion[] }>(completion.text);
  const linkedIds = new Set([
    ...ctx.tasks.map((t) => t.targetId),
    ...ctx.files.map((f) => f.targetId),
    ...ctx.events.map((e) => e.targetId),
  ]);

  const suggestions = (Array.isArray(parsed?.suggestions) ? parsed.suggestions : [])
    .filter(
      (s) =>
        s?.targetId &&
        (s.targetType === 'TASK' ||
          s.targetType === 'FILE' ||
          s.targetType === 'CALENDAR_EVENT') &&
        !linkedIds.has(s.targetId)
    )
    .map((s) => ({
      targetType: s.targetType,
      targetId: s.targetId,
      label: s.label?.trim() || s.targetId,
      reason: s.reason?.trim() || '',
    }));

  return {
    suggestions,
    warnings: mergeWarnings(ctx.warnings, [
      'Suggestions are read-only. Confirm linking manually in the page rail.',
    ]),
  };
}
