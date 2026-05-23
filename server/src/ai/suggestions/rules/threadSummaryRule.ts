/**
 * thread_activity_spike_v1 — high message volume in a thread (Phase 5C).
 */

import type { Prisma } from '@prisma/client';
import { DOMAIN_EVENT_TYPES } from '../../../events/domainEventRegistry';
import {
  CORRELATION_RULE_IDS,
  CORRELATION_WINDOWS,
  SUGGESTION_TYPES,
  type SuggestionExplainability,
  type ThreadSummaryActionData,
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

export async function evaluateThreadSummaryRule(
  ctx: SuggestionRuleContext
): Promise<SuggestionCandidate | null> {
  const { event, recentSignals } = ctx;

  if (event.type !== DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT) {
    return null;
  }

  const meta = event.metadata ?? {};
  const conversationId =
    typeof meta.conversationId === 'string' ? meta.conversationId : '';
  const threadId = typeof meta.threadId === 'string' ? meta.threadId : undefined;

  if (!conversationId || !threadId) {
    return null;
  }

  const reference = new Date(event.createdAt);
  const scope = await resolveTenantScope(event, ctx.db);
  const tenantSignals = filterSignalsByTenant(recentSignals, scope);

  const chatSignals = signalsOfType(tenantSignals, DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT);
  const matching = chatSignals.filter((signal) => {
    const signalMeta = parseSignalMetadata(signal);
    const signalThreadId =
      typeof signalMeta.threadId === 'string' ? signalMeta.threadId : undefined;
    if (signalThreadId !== threadId) return false;
    return isWithinMs(signal.occurredAt, CORRELATION_WINDOWS.THREAD_SPIKE_MS, reference);
  });

  const messageCount = matching.length;
  if (messageCount < CORRELATION_WINDOWS.THREAD_SPIKE_MIN_MESSAGES) {
    return null;
  }

  const dashboardId =
    resolveDashboardIdFromEvent(event) ??
    tenantSignals.find((s) => s.dashboardId)?.dashboardId ??
    null;
  if (!dashboardId) return null;

  const businessId =
    scope.businessId ?? (await resolveBusinessIdFromDashboard(ctx.db, dashboardId));

  const actionData: ThreadSummaryActionData = {
    conversationId,
    threadId,
    messageCount,
    suggestedPrompt: `Summarize this busy chat thread (${messageCount} messages recently). Capture key decisions, action items, and open questions.`,
    deepLink: `/ai-chat?suggestion=thread_summary&conversationId=${encodeURIComponent(conversationId)}`,
  };

  const sourceEventIds = uniqueEventIds(
    matching.map((s) => s.domainEventId),
    [event.id]
  );

  const explainability: SuggestionExplainability = {
    summary: `This thread had ${messageCount} messages in the last 2 hours — a summary might help.`,
    contextUsed: [{ moduleId: 'chat', reason: `${messageCount} messages in thread (2h window)` }],
    correlationReason: `${CORRELATION_RULE_IDS.THREAD_ACTIVITY_SPIKE_V1}: ${messageCount}× chat.message.sent same threadId within 2h`,
    sourceEventIds,
  };

  const suppressionKey = `${SUGGESTION_TYPES.THREAD_SUMMARY}:${dashboardId}:${threadId}`;

  return {
    userId: event.actorUserId,
    dashboardId,
    businessId,
    householdId: event.householdId ?? null,
    suggestionType: SUGGESTION_TYPES.THREAD_SUMMARY,
    title: 'Summarize this thread?',
    body: `There's been a lot of activity in this thread (${messageCount} messages recently). Would you like a summary?`,
    actionData: actionData as unknown as Prisma.InputJsonValue,
    confidence: Math.min(0.65 + messageCount * 0.01, 0.85),
    explainability,
    correlationRuleId: CORRELATION_RULE_IDS.THREAD_ACTIVITY_SPIKE_V1,
    suppressionKey,
    priority: messageCount >= 20 ? 'high' : 'normal',
    sourceEventIds,
  };
}
