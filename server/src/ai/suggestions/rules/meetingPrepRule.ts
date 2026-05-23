/**
 * meeting_prep_v1 — upcoming calendar event + same-day file activity (Phase 5C).
 */

import type { Prisma } from '@prisma/client';
import { DOMAIN_EVENT_TYPES } from '../../../events/domainEventRegistry';
import {
  CORRELATION_RULE_IDS,
  CORRELATION_WINDOWS,
  SUGGESTION_TYPES,
  type MeetingPrepActionData,
  type SuggestionExplainability,
} from '../suggestionTypes';
import { resolveDashboardIdFromEvent } from '../suggestionEventUtils';
import type { SuggestionCandidate, SuggestionRuleContext } from '../suggestionRuleTypes';
import {
  filterSignalsByTenant,
  isSameUtcDay,
  isWithinFutureMs,
  parseIsoDate,
  parseSignalMetadata,
  resolveBusinessIdFromDashboard,
  resolveTenantScope,
  signalsOfType,
  uniqueEventIds,
} from './ruleContextHelpers';

interface CalendarMatch {
  eventId: string;
  calendarId: string;
  startAt: Date;
  domainEventId: string | null;
}

interface FileMatch {
  fileId: string;
  fileName: string;
  domainEventId: string | null;
}

function extractCalendarMatches(
  signals: ReturnType<typeof signalsOfType>,
  reference: Date
): CalendarMatch[] {
  const matches: CalendarMatch[] = [];
  for (const signal of signals) {
    const meta = parseSignalMetadata(signal);
    const startAt = parseIsoDate(meta.startAt);
    if (!startAt || !isWithinFutureMs(startAt, CORRELATION_WINDOWS.MEETING_PREP_FUTURE_MS, reference)) {
      continue;
    }
    const calendarId = typeof meta.calendarId === 'string' ? meta.calendarId : '';
    if (!calendarId) continue;
    matches.push({
      eventId: signal.entityId ?? '',
      calendarId,
      startAt,
      domainEventId: signal.domainEventId,
    });
  }
  return matches;
}

function extractFileMatches(
  signals: ReturnType<typeof signalsOfType>,
  referenceDay: Date
): FileMatch[] {
  const matches: FileMatch[] = [];
  for (const signal of signals) {
    if (!isSameUtcDay(signal.occurredAt, referenceDay)) continue;
    const meta = parseSignalMetadata(signal);
    const fileName =
      typeof meta.fileName === 'string' && meta.fileName.trim()
        ? meta.fileName.trim()
        : 'File';
    matches.push({
      fileId: signal.entityId ?? '',
      fileName,
      domainEventId: signal.domainEventId,
    });
  }
  return matches.filter((f) => f.fileId);
}

async function resolveFileName(
  ctx: SuggestionRuleContext,
  fileId: string,
  fallback: string
): Promise<string> {
  const file = await ctx.db.file.findUnique({
    where: { id: fileId },
    select: { name: true },
  });
  return file?.name ?? fallback;
}

export async function evaluateMeetingPrepRule(
  ctx: SuggestionRuleContext
): Promise<SuggestionCandidate | null> {
  const { event, recentSignals } = ctx;
  const reference = new Date(event.createdAt);
  const scope = await resolveTenantScope(event, ctx.db);
  const tenantSignals = filterSignalsByTenant(recentSignals, scope);

  let calendarMatches: CalendarMatch[] = [];
  let fileMatches: FileMatch[] = [];

  if (event.type === DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED) {
    const meta = event.metadata ?? {};
    const startAt = parseIsoDate(meta.startAt);
    const calendarId = typeof meta.calendarId === 'string' ? meta.calendarId : '';
    if (!startAt || !calendarId || !isWithinFutureMs(startAt, CORRELATION_WINDOWS.MEETING_PREP_FUTURE_MS, reference)) {
      return null;
    }
    calendarMatches = [
      {
        eventId: event.entityId,
        calendarId,
        startAt,
        domainEventId: event.id,
      },
    ];
    fileMatches = extractFileMatches(
      signalsOfType(tenantSignals, DOMAIN_EVENT_TYPES.FILE_UPLOADED),
      reference
    );
  } else if (event.type === DOMAIN_EVENT_TYPES.FILE_UPLOADED) {
    const meta = event.metadata ?? {};
    const fileName =
      typeof meta.fileName === 'string' && meta.fileName.trim()
        ? meta.fileName.trim()
        : 'File';
    const fromSignals = extractFileMatches(
      signalsOfType(tenantSignals, DOMAIN_EVENT_TYPES.FILE_UPLOADED),
      reference
    );
    const currentFile: FileMatch = {
      fileId: event.entityId,
      fileName,
      domainEventId: event.id,
    };
    const seen = new Set<string>();
    fileMatches = [currentFile, ...fromSignals].filter((f) => {
      if (!f.fileId || seen.has(f.fileId)) return false;
      seen.add(f.fileId);
      return true;
    });
    calendarMatches = extractCalendarMatches(
      signalsOfType(tenantSignals, DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED),
      reference
    );
  } else {
    return null;
  }

  if (
    calendarMatches.length === 0 ||
    fileMatches.length < CORRELATION_WINDOWS.MEETING_PREP_MIN_FILES
  ) {
    return null;
  }

  const calendar = calendarMatches[0];
  const relatedFiles = fileMatches.slice(0, 5);
  const dashboardId =
    resolveDashboardIdFromEvent(event) ??
    tenantSignals.find((s) => s.dashboardId)?.dashboardId ??
    null;
  if (!dashboardId) return null;

  const businessId =
    scope.businessId ?? (await resolveBusinessIdFromDashboard(ctx.db, dashboardId));

  const fileNames = await Promise.all(
    relatedFiles.map((f) => resolveFileName(ctx, f.fileId, f.fileName))
  );

  const relatedFileIds = relatedFiles.map((f) => f.fileId);
  const hoursUntil = Math.round((calendar.startAt.getTime() - reference.getTime()) / (60 * 60 * 1000));
  const timeLabel =
    hoursUntil <= 24 ? 'tomorrow or soon' : `in the next ${Math.min(hoursUntil, 48)} hours`;

  const actionData: MeetingPrepActionData = {
    eventId: calendar.eventId,
    calendarId: calendar.calendarId,
    relatedFileIds,
    suggestedPrompt: `Prepare a briefing for my upcoming meeting. Summarize these ${relatedFileIds.length} related file(s): ${fileNames.join(', ')}. Highlight key decisions, open questions, and action items.`,
    deepLink: `/ai-chat?suggestion=meeting_prep&eventId=${encodeURIComponent(calendar.eventId)}`,
  };

  const explainability: SuggestionExplainability = {
    summary: `You have a meeting ${timeLabel} and ${relatedFileIds.length} related file(s) changed today.`,
    contextUsed: [
      { moduleId: 'calendar', reason: 'Upcoming event within 48 hours' },
      { moduleId: 'drive', reason: `${relatedFileIds.length} file(s) uploaded today` },
    ],
    correlationReason: `${CORRELATION_RULE_IDS.MEETING_PREP_V1}: calendar.event.created + ${relatedFileIds.length}× file.uploaded same day`,
    sourceEventIds: uniqueEventIds(
      [calendar.domainEventId, event.id],
      relatedFiles.map((f) => f.domainEventId)
    ),
  };

  const suppressionKey = `${SUGGESTION_TYPES.MEETING_PREP}:${dashboardId}:${calendar.eventId}`;

  return {
    userId: event.actorUserId,
    dashboardId,
    businessId,
    householdId: event.householdId ?? null,
    suggestionType: SUGGESTION_TYPES.MEETING_PREP,
    title: 'Prepare for your meeting',
    body: `You have a meeting coming up and ${relatedFileIds.length} file(s) were updated today. Would you like a briefing summary?`,
    actionData: actionData as unknown as Prisma.InputJsonValue,
    confidence: Math.min(0.7 + relatedFileIds.length * 0.05, 0.9),
    explainability,
    correlationRuleId: CORRELATION_RULE_IDS.MEETING_PREP_V1,
    suppressionKey,
    priority: hoursUntil <= 24 ? 'high' : 'normal',
    expiresAt: calendar.startAt,
    sourceEventIds: explainability.sourceEventIds,
  };
}
