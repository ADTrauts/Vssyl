import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emitCalendarEventCreatedEvent,
  emitChatMessageSentEvent,
  emitModuleDisabledEvent,
  emitModuleEnabledEvent,
} from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';

describe('Chat and calendar domain events (Phase 4A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('chat.message.sent excludes message body from metadata', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e1' } as never);

    emitChatMessageSentEvent({
      actorUserId: 'u1',
      messageId: 'msg-1',
      conversationId: 'conv-1',
      threadId: 'thread-1',
      attachmentCount: 2,
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat.message.sent',
        entityId: 'msg-1',
        metadata: expect.objectContaining({
          moduleId: 'chat',
          conversationId: 'conv-1',
          threadId: 'thread-1',
          attachmentCount: 2,
          hasAttachments: true,
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> }).metadata;
    expect(meta).not.toHaveProperty('content');
    expect(meta).not.toHaveProperty('body');
  });

  it('calendar.event.created includes schedule metadata without title/body', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e2' } as never);

    emitCalendarEventCreatedEvent({
      actorUserId: 'u1',
      eventId: 'evt-1',
      calendarId: 'cal-1',
      allDay: false,
      startAt: '2026-05-22T15:00:00.000Z',
      endAt: '2026-05-22T16:00:00.000Z',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'calendar.event.created',
        metadata: expect.objectContaining({
          moduleId: 'calendar',
          calendarId: 'cal-1',
          allDay: false,
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> }).metadata;
    expect(meta).not.toHaveProperty('title');
    expect(meta).not.toHaveProperty('description');
  });

  it('module.enabled and module.disabled include installation scope', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e3' } as never);

    emitModuleEnabledEvent({
      actorUserId: 'u1',
      moduleId: 'todo',
      installationId: 'inst-1',
      installScope: 'personal',
    });
    emitModuleDisabledEvent({
      actorUserId: 'u1',
      moduleId: 'todo',
      installationId: 'inst-1',
      installScope: 'business',
      businessId: 'biz-1',
    });

    expect(emitSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'module.enabled',
        metadata: expect.objectContaining({ moduleId: 'todo', installScope: 'personal' }),
      })
    );
    expect(emitSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'module.disabled',
        businessId: 'biz-1',
      })
    );
  });
});
