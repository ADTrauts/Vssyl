import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emitChatConversationTrashedEvent,
  emitChatMessageDeletedEvent,
  emitChatMessageSentEvent,
} from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';

describe('Chat domain events (Wave 1 Phase 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('chat.message.sent excludes message body from metadata', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e1' } as never);

    emitChatMessageSentEvent({
      actorUserId: 'u1',
      messageId: 'msg-1',
      conversationId: 'conv-1',
      attachmentCount: 0,
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat.message.sent',
        entityId: 'msg-1',
        metadata: expect.objectContaining({
          moduleId: 'chat',
          conversationId: 'conv-1',
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> }).metadata;
    expect(meta).not.toHaveProperty('content');
    expect(meta).not.toHaveProperty('body');
  });

  it('chat.conversation.trashed includes moduleId', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e2' } as never);

    emitChatConversationTrashedEvent({
      actorUserId: 'u1',
      conversationId: 'conv-1',
      dashboardId: 'dash-1',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat.conversation.trashed',
        metadata: expect.objectContaining({ moduleId: 'chat', dashboardId: 'dash-1' }),
      })
    );
  });

  it('chat.message.deleted marks softDelete', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e3' } as never);

    emitChatMessageDeletedEvent({
      actorUserId: 'u1',
      messageId: 'msg-1',
      conversationId: 'conv-1',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'chat.message.deleted',
        metadata: expect.objectContaining({ softDelete: true, conversationId: 'conv-1' }),
      })
    );
  });
});
