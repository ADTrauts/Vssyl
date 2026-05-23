/**
 * Built-in domain-event fixtures for suggestion correlation dry-run (Phase 5F).
 */

import type { AISuggestionSignal } from '@prisma/client';
import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';
import type { DomainEvent } from '../../events/types';

export const SUGGESTION_FIXTURE_IDS = [
  'meeting_prep',
  'thread_spike',
  'document_upload',
] as const;

export type SuggestionFixtureId = (typeof SUGGESTION_FIXTURE_IDS)[number];

export function isSuggestionFixtureId(value: string): value is SuggestionFixtureId {
  return (SUGGESTION_FIXTURE_IDS as readonly string[]).includes(value);
}

export interface SuggestionFixtureBundle {
  fixtureId: SuggestionFixtureId;
  description: string;
  triggerEvent: DomainEvent;
  priorSignals: AISuggestionSignal[];
}

function baseSignal(
  partial: Partial<AISuggestionSignal> & { metadata?: Record<string, unknown> }
): AISuggestionSignal {
  return {
    id: partial.id ?? 'sig-fixture',
    userId: partial.userId ?? 'user-fixture',
    dashboardId: partial.dashboardId ?? 'dash-fixture',
    businessId: partial.businessId ?? null,
    domainEventId: partial.domainEventId ?? 'dom-fixture',
    domainEventType: partial.domainEventType ?? DOMAIN_EVENT_TYPES.FILE_UPLOADED,
    entityType: partial.entityType ?? 'File',
    entityId: partial.entityId ?? 'file-fixture',
    sourceModule: partial.sourceModule ?? 'drive',
    occurredAt: partial.occurredAt ?? new Date(),
    metadata: partial.metadata ?? {},
    processedAt: partial.processedAt ?? null,
    ruleIds: partial.ruleIds ?? [],
  };
}

export function buildSuggestionFixture(
  fixtureId: SuggestionFixtureId,
  userId: string,
  dashboardId: string
): SuggestionFixtureBundle {
  const now = new Date('2026-05-22T14:00:00.000Z');

  if (fixtureId === 'meeting_prep') {
    const startAt = new Date('2026-05-23T10:00:00.000Z');
    return {
      fixtureId,
      description: 'Calendar event created, then file upload on same dashboard → meeting_prep',
      triggerEvent: {
        id: 'fixture-file-upload',
        type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
        actorUserId: userId,
        dashboardId,
        entityType: 'File',
        entityId: 'file-abc',
        action: 'create',
        metadata: {
          fileType: 'application/pdf',
          fileName: 'Q2-plan.pdf',
          dashboardId,
        },
        createdAt: now.toISOString(),
      },
      priorSignals: [
        baseSignal({
          id: 'sig-cal',
          userId,
          dashboardId,
          domainEventType: DOMAIN_EVENT_TYPES.CALENDAR_EVENT_CREATED,
          entityId: 'cal-event-1',
          domainEventId: 'dom-cal-1',
          sourceModule: 'calendar',
          occurredAt: new Date(now.getTime() - 60 * 60 * 1000),
          metadata: {
            calendarId: 'cal-1',
            startAt: startAt.toISOString(),
            endAt: new Date('2026-05-23T11:00:00.000Z').toISOString(),
          },
        }),
      ],
    };
  }

  if (fixtureId === 'thread_spike') {
    const threadId = 'thread-99';
    const conversationId = 'conv-1';
    const chatSignals = Array.from({ length: 9 }, (_, i) =>
      baseSignal({
        id: `sig-chat-${i}`,
        userId,
        dashboardId,
        domainEventType: DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
        entityId: `msg-${i}`,
        domainEventId: `dom-msg-${i}`,
        sourceModule: 'chat',
        occurredAt: new Date(now.getTime() - i * 5 * 60 * 1000),
        metadata: { conversationId, threadId, moduleId: 'chat' },
      })
    );
    return {
      fixtureId,
      description: '10 chat messages in same thread within 2h → thread_summary',
      triggerEvent: {
        id: 'fixture-chat-10',
        type: DOMAIN_EVENT_TYPES.CHAT_MESSAGE_SENT,
        actorUserId: userId,
        dashboardId,
        entityType: 'Message',
        entityId: 'msg-10',
        action: 'send',
        metadata: { conversationId, threadId, moduleId: 'chat' },
        createdAt: now.toISOString(),
      },
      priorSignals: chatSignals,
    };
  }

  return {
    fixtureId: 'document_upload',
    description: 'PDF file upload → document_upload suggestion',
    triggerEvent: {
      id: 'fixture-doc-upload',
      type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
      actorUserId: userId,
      dashboardId,
      entityType: 'File',
      entityId: 'file-doc-1',
      action: 'create',
      metadata: {
        fileType: 'application/pdf',
        fileName: 'invoice.pdf',
        dashboardId,
      },
      createdAt: now.toISOString(),
    },
    priorSignals: [],
  };
}
