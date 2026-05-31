import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatConversation from '../chatConversationService';
import * as chatMessage from '../chatMessageService';
import { aiCreateConversation, aiRespondToMessage, aiSendMessage } from '../chatAIActionService';
import { ChatServiceError } from '../chat/chatErrors';

describe('chatAIActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
    } as never);
  });

  it('aiSendMessage delegates to chatMessageService.sendMessage', async () => {
    const sendSpy = vi.spyOn(chatMessage, 'sendMessage').mockResolvedValue({
      id: 'msg-1',
      content: 'hi',
      fileReferences: [],
    } as never);

    const outcome = await aiSendMessage({
      userId: 'user-1',
      conversationId: 'conv-1',
      content: 'hi',
    });

    expect(outcome.success).toBe(true);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        conversationId: 'conv-1',
        content: 'hi',
        senderName: 'Alice',
      })
    );
  });

  it('aiSendMessage maps ChatServiceError to failure outcome', async () => {
    vi.spyOn(chatMessage, 'sendMessage').mockRejectedValue(
      new ChatServiceError('Access denied', 'forbidden', 403)
    );

    const outcome = await aiSendMessage({
      userId: 'user-1',
      conversationId: 'conv-1',
      content: 'hi',
    });

    expect(outcome).toEqual({ success: false, error: 'Access denied' });
  });

  it('aiCreateConversation delegates to chatConversationService', async () => {
    vi.spyOn(chatConversation, 'createConversation').mockResolvedValue({
      conversation: { id: 'conv-new' },
      created: true,
    } as never);

    const outcome = await aiCreateConversation({
      userId: 'user-1',
      type: 'GROUP',
      participantIds: ['user-2'],
    });

    expect(outcome.success).toBe(true);
    if (outcome.success) {
      expect(outcome.data).toEqual(
        expect.objectContaining({ created: true })
      );
    }
  });

  it('aiRespondToMessage passes replyToId', async () => {
    const sendSpy = vi.spyOn(chatMessage, 'sendMessage').mockResolvedValue({
      id: 'msg-2',
      fileReferences: [],
    } as never);

    await aiRespondToMessage({
      userId: 'user-1',
      conversationId: 'conv-1',
      messageId: 'msg-parent',
      content: 'reply',
    });

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ replyToId: 'msg-parent' })
    );
  });
});
