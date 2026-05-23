import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { AISuggestionSignal } from '@prisma/client';
import { DOMAIN_EVENT_TYPES } from '../../../events/domainEventRegistry';
import type { DomainEvent } from '../../../events/types';
import { evaluateMeetingPrepRule } from '../rules/meetingPrepRule';
import { evaluateThreadSummaryRule } from '../rules/threadSummaryRule';
import type { SuggestionRuleContext } from '../suggestionRuleTypes';
import { SuggestionCorrelationService } from '../SuggestionCorrelationService';
import { CORRELATION_RULE_IDS, SUGGESTION_TYPES } from '../suggestionTypes';

function signal(partial: Partial<AISuggestionSignal> & { metadata?: Record<string, unknown> }): AISuggestionSignal {
  return {
    id: partial.id ?? 'sig-1',
    userId: partial.userId ?? 'user-1',
    dashboardId: partial.dashboardId ?? 'dash-1',
    businessId: partial.businessId ?? null,
    domainEventId: partial.domainEventId ?? 'dom-1',
    domainEventType: partial.domainEventType ?? DOMAIN_EVENT_TYPES.FILE_UPLOADED,
    entityType: partial.entityType ?? 'File',
    entityId: partial.entityId ?? 'file-1',
    sourceModule: partial.sourceModule ?? 'drive',
    occurredAt: partial.occurredAt ?? new Date(),
    metadata: partial.metadata ?? {},
    processedAt: partial.processedAt ?? null,
    ruleIds: partial.ruleIds ?? [],
  };
}

function ruleContext(
  event: DomainEvent,
  recentSignals: AISuggestionSignal[],
  db?: PrismaClient
): SuggestionRuleContext {
  return {
    event,
    signalId: 'sig-current',
    db:
      db ??
      ({
        file: { findUnique: vi.fn().mockResolvedValue({ name: 'Q2-plan.pdf' }) },
        dashboard: { findUnique: vi.fn().mockResolvedValue({ businessId: null }) },
      } as unknown as PrismaClient),
    recentSignals,
  };
}

describe('Phase 5C correlation rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('meeting_prep_v1: calendar + same-day file upload → candidate with explainability', async () => {
    const now = new Date('2026-05-22T14:00:00.000Z');
    const startAt = new Date('2026-05-23T10:00:00.000Z');

    const fileEvent: DomainEvent = {
      id: 'evt-file-1',
      type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
      actorUserId: 'user-1',
      dashboardId: 'dash-1',
      entityType: 'File',
      entityId: 'file-abc',
      action: 'create',
      metadata: {
        fileType: 'application/pdf',
        fileName: 'Q2-plan.pdf',
        dashboardId: 'dash-1',
      },
      createdAt: now.toISOString(),
    };

    const recentSignals = [
      signal({
        id: 'sig-cal',
        domainEventType: DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED,
        entityId: 'cal-event-1',
        domainEventId: 'dom-cal-1',
        occurredAt: new Date(now.getTime() - 60 * 60 * 1000),
        metadata: {
          calendarId: 'cal-1',
          startAt: startAt.toISOString(),
          endAt: new Date('2026-05-23T11:00:00.000Z').toISOString(),
        },
      }),
      signal({
        id: 'sig-file',
        domainEventType: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
        entityId: 'file-abc',
        domainEventId: 'evt-file-1',
        occurredAt: now,
        metadata: { fileName: 'Q2-plan.pdf', fileType: 'application/pdf' },
      }),
    ];

    const candidate = await evaluateMeetingPrepRule(ruleContext(fileEvent, recentSignals));

    expect(candidate).not.toBeNull();
    expect(candidate?.suggestionType).toBe(SUGGESTION_TYPES.MEETING_PREP);
    expect(candidate?.correlationRuleId).toBe(CORRELATION_RULE_IDS.MEETING_PREP_V1);
    expect(candidate?.explainability.summary).toMatch(/meeting/i);
    expect(candidate?.explainability.contextUsed.map((c) => c.moduleId)).toEqual(
      expect.arrayContaining(['calendar', 'drive'])
    );
    expect(candidate?.explainability.sourceEventIds.length).toBeGreaterThan(0);
  });

  it('thread_activity_spike_v1: 10+ messages in thread → thread_summary candidate', async () => {
    const now = new Date('2026-05-22T16:00:00.000Z');
    const threadId = 'thread-99';
    const conversationId = 'conv-1';

    const chatSignals: AISuggestionSignal[] = Array.from({ length: 10 }, (_, i) =>
      signal({
        id: `sig-${i}`,
        domainEventType: DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
        entityId: `msg-${i}`,
        domainEventId: `dom-msg-${i}`,
        occurredAt: new Date(now.getTime() - i * 5 * 60 * 1000),
        metadata: { conversationId, threadId, moduleId: 'chat' },
      })
    );

    const chatEvent: DomainEvent = {
      id: 'evt-chat-10',
      type: DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
      actorUserId: 'user-1',
      dashboardId: 'dash-1',
      entityType: 'Message',
      entityId: 'msg-10',
      action: 'send',
      metadata: { conversationId, threadId, moduleId: 'chat' },
      createdAt: now.toISOString(),
    };

    const candidate = await evaluateThreadSummaryRule(
      ruleContext(chatEvent, chatSignals)
    );

    expect(candidate).not.toBeNull();
    expect(candidate?.suggestionType).toBe(SUGGESTION_TYPES.THREAD_SUMMARY);
    expect(candidate?.correlationRuleId).toBe(CORRELATION_RULE_IDS.THREAD_ACTIVITY_SPIKE_V1);
    expect(candidate?.explainability.correlationReason).toContain('thread_activity_spike_v1');
  });

  it('SuggestionCorrelationService: file upload after calendar signals yields meeting_prep', async () => {
    const now = new Date('2026-05-22T12:00:00.000Z');
    const db = {
      aISuggestionSignal: {
        create: vi.fn().mockResolvedValue({ id: 'sig-new' }),
        findMany: vi.fn().mockResolvedValue([
          signal({
            domainEventType: DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED,
            entityId: 'ev-1',
            domainEventId: 'dom-cal',
            occurredAt: new Date(now.getTime() - 30 * 60 * 1000),
            metadata: {
              calendarId: 'cal-1',
              startAt: new Date('2026-05-23T09:00:00.000Z').toISOString(),
              endAt: new Date('2026-05-23T10:00:00.000Z').toISOString(),
            },
          }),
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
      file: {
        findUnique: vi.fn().mockResolvedValue({ name: 'notes.pdf' }),
      },
      dashboard: {
        findUnique: vi.fn().mockResolvedValue({ businessId: null }),
      },
    } as unknown as PrismaClient;

    const service = new SuggestionCorrelationService(db);
    const result = await service.correlateFromDomainEvent({
      id: 'evt-file-2',
      type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
      actorUserId: 'user-1',
      dashboardId: 'dash-1',
      entityType: 'File',
      entityId: 'file-2',
      action: 'create',
      metadata: {
        fileType: 'application/pdf',
        fileName: 'notes.pdf',
        dashboardId: 'dash-1',
      },
      createdAt: now.toISOString(),
    });

    const meetingCandidate = result.candidates.find(
      (c) => c.suggestionType === SUGGESTION_TYPES.MEETING_PREP
    );
    expect(meetingCandidate).toBeDefined();
    expect(meetingCandidate?.explainability.summary).toBeTruthy();
  });
});
