import { prisma } from '../lib/prisma';
import { ChatServiceError } from './chat/chatErrors';
import type {
  MarkAsReadInput,
  SendMessageInput,
  ToggleReactionInput,
  ToggleReactionResult,
} from './chat/chatTypes';
import { messageDetailInclude } from './chat/chatIncludes';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateChatPolicyDual } from '../auth/chatPolicyDual';
import {
  validateMessageAttachmentFileIds,
  withFullFileUrls,
} from './chatAttachmentService';
import { assertActiveConversationParticipant } from './chatPermissionService';
import {
  assertThreadInConversation,
  ensureThreadForReply,
} from './chatThreadService';
import { recordMessageSent, recordReaction, recordRead } from './chatActivityService';
import { notifyNewMessage, notifyReaction } from './chatNotificationService';
import {
  broadcastNewMessage,
  broadcastReaction,
  broadcastReadReceipt,
} from './chatRealtimeService';
import {
  recordChatMessageReactionAddedDomainEvent,
  recordChatMessageReadDomainEvent,
  recordChatMessageSentDomainEvent,
} from './chatDomainEventService';

export { withFullFileUrls } from './chatAttachmentService';

export async function sendMessage(input: SendMessageInput) {
  const {
    userId,
    senderName,
    conversationId,
    content,
    threadId,
    replyToId,
    fileIds,
  } = input;

  const trimmed = content.trim();
  if (!trimmed) {
    throw new ChatServiceError('Message content is required', 'invalid', 400);
  }

  await assertActiveConversationParticipant(userId, conversationId);

  const policyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_MESSAGE_CREATE,
    resourceType: 'conversation',
    resourceId: conversationId,
  });
  if (policyDual.blocked) {
    throw new ChatServiceError('Access denied to conversation', 'forbidden', 403);
  }

  const validatedFileIds = await validateMessageAttachmentFileIds(userId, fileIds);

  let validatedThreadId: string | null | undefined = threadId ?? null;

  if (replyToId) {
    validatedThreadId = await ensureThreadForReply({
      userId,
      conversationId,
      replyToId,
      existingThreadId: validatedThreadId,
    });
  }

  if (validatedThreadId) {
    await assertThreadInConversation(validatedThreadId, conversationId);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: trimmed,
      threadId: validatedThreadId,
      replyToId: replyToId ?? undefined,
      fileReferences: validatedFileIds.length
        ? {
            create: validatedFileIds.map((fileId) => ({ fileId })),
          }
        : undefined,
    },
    include: messageDetailInclude,
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  if (validatedThreadId) {
    await prisma.thread.update({
      where: { id: validatedThreadId },
      data: { lastMessageAt: new Date() },
    });
  }

  const messageWithFullUrls = withFullFileUrls(message);

  broadcastNewMessage(conversationId, messageWithFullUrls as Record<string, unknown>);

  await recordMessageSent({
    actorUserId: userId,
    messageId: message.id,
    conversationId,
    metadata: {
      threadId: validatedThreadId,
      replyToId: replyToId ?? null,
    },
  });

  recordChatMessageSentDomainEvent({
    actorUserId: userId,
    messageId: message.id,
    conversationId,
    threadId: validatedThreadId ?? null,
    attachmentCount: validatedFileIds.length,
  });

  await notifyNewMessage({
    actorUserId: userId,
    senderName,
    conversationId,
    messageId: message.id,
    content: trimmed,
  });

  return messageWithFullUrls;
}

export async function toggleReaction(input: ToggleReactionInput): Promise<ToggleReactionResult> {
  const { userId, actorName, messageId, emoji } = input;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      deletedAt: null,
    },
    include: {
      conversation: {
        include: {
          participants: {
            where: {
              userId,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw new ChatServiceError('Message not found', 'not_found', 404);
  }

  if (message.conversation.participants.length === 0) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  const reactPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_MESSAGE_REACT,
    resourceType: 'message',
    resourceId: messageId,
  });
  if (reactPolicyDual.blocked) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  const existingReaction = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  let action: 'added' | 'removed';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reaction payload for API/socket
  let reactionData: Record<string, any> | null = null;

  if (existingReaction) {
    await prisma.messageReaction.delete({
      where: { id: existingReaction.id },
    });
    action = 'removed';
    reactionData = {
      id: existingReaction.id,
      messageId: existingReaction.messageId,
      userId: existingReaction.userId,
      emoji: existingReaction.emoji,
      createdAt: existingReaction.createdAt,
      user: existingReaction.user,
    };
  } else {
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    action = 'added';
    reactionData = reaction;
  }

  broadcastReaction(message.conversationId, {
    messageId,
    reaction: reactionData,
    action,
  });

  if (action === 'added') {
    recordChatMessageReactionAddedDomainEvent({
      actorUserId: userId,
      messageId,
      conversationId: message.conversationId,
      emoji,
    });
    await notifyReaction({
      actorUserId: userId,
      actorName,
      messageId,
      conversationId: message.conversationId,
      messageSenderId: message.senderId,
      emoji,
    });
  }

  await recordReaction({
    actorUserId: userId,
    messageId,
    conversationId: message.conversationId,
    emoji,
    action,
  });

  return {
    action,
    data: reactionData,
    conversationId: message.conversationId,
  };
}

export async function markAsRead(input: MarkAsReadInput) {
  const { userId, messageId } = input;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      deletedAt: null,
    },
    include: {
      conversation: {
        include: {
          participants: {
            where: {
              userId,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw new ChatServiceError('Message not found', 'not_found', 404);
  }

  if (message.conversation.participants.length === 0) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  const readPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_MESSAGE_READ,
    resourceType: 'message',
    resourceId: messageId,
  });
  if (readPolicyDual.blocked) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  const existingReceipt = await prisma.readReceipt.findUnique({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (existingReceipt) {
    return { receipt: existingReceipt, created: false as const };
  }

  const receipt = await prisma.readReceipt.create({
    data: {
      messageId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await recordRead({
    actorUserId: userId,
    messageId,
    conversationId: message.conversationId,
  });

  recordChatMessageReadDomainEvent({
    actorUserId: userId,
    messageId,
    conversationId: message.conversationId,
  });

  broadcastReadReceipt(message.conversationId, {
    messageId,
    readReceipt: receipt as Record<string, unknown>,
  });

  return { receipt, created: true as const };
}
