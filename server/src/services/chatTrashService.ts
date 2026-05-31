import { prisma } from '../lib/prisma';
import { assertActiveConversationParticipant } from './chatPermissionService';
import {
  recordConversationPermanentlyDeleted,
  recordConversationRestored,
  recordConversationTrashed,
  recordMessagePermanentlyDeleted,
  recordMessageRestored,
  recordMessageTrashed,
} from './chatActivityService';
import { logger } from '../lib/logger';

export class ChatTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'ChatTrashError';
  }
}

export type ChatTrashItemType = 'conversation' | 'message';

export interface ChatTrashMutationInput {
  userId: string;
  type: ChatTrashItemType;
  id: string;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: 'conversation';
  moduleId: 'chat';
  moduleName: 'Chat';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

async function assertCanAccessMessage(userId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, deletedAt: null },
    select: {
      id: true,
      senderId: true,
      conversationId: true,
      conversation: {
        select: {
          participants: {
            where: { userId, isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!message) {
    throw new ChatTrashError('Message not found', 'not_found');
  }

  if (message.senderId !== userId && message.conversation.participants.length === 0) {
    throw new ChatTrashError('Access denied', 'forbidden');
  }

  return message;
}

async function assertCanAccessTrashedMessage(userId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, deletedAt: { not: null } },
    select: {
      id: true,
      senderId: true,
      conversationId: true,
      conversation: {
        select: {
          participants: {
            where: { userId, isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!message) {
    throw new ChatTrashError('Message not found in trash', 'not_found');
  }

  if (message.senderId !== userId && message.conversation.participants.length === 0) {
    throw new ChatTrashError('Access denied', 'forbidden');
  }

  return message;
}

export async function softTrashConversation(input: ChatTrashMutationInput): Promise<void> {
  const { userId, id } = input;
  await assertActiveConversationParticipant(userId, id);

  const updated = await prisma.conversation.updateMany({
    where: {
      id,
      trashedAt: null,
      participants: {
        some: { userId, isActive: true },
      },
    },
    data: { trashedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new ChatTrashError('Conversation not found or already trashed', 'not_found');
  }

  await recordConversationTrashed({ actorUserId: userId, conversationId: id });
}

export async function restoreConversation(input: ChatTrashMutationInput): Promise<boolean> {
  const { userId, id } = input;

  const updated = await prisma.conversation.updateMany({
    where: {
      id,
      trashedAt: { not: null },
      participants: {
        some: { userId, isActive: true },
      },
    },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordConversationRestored({ actorUserId: userId, conversationId: id });
  return true;
}

export async function permanentlyDeleteConversation(input: ChatTrashMutationInput): Promise<boolean> {
  const { userId, id } = input;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      trashedAt: { not: null },
      participants: {
        some: { userId, isActive: true },
      },
    },
    select: { id: true, dashboardId: true },
  });

  if (!conversation) {
    return false;
  }

  const deleted = await prisma.conversation.deleteMany({
    where: {
      id,
      trashedAt: { not: null },
      participants: {
        some: { userId, isActive: true },
      },
    },
  });

  if (deleted.count === 0) {
    return false;
  }

  await recordConversationPermanentlyDeleted({
    actorUserId: userId,
    conversationId: id,
    dashboardId: conversation.dashboardId,
  });

  return true;
}

export async function softTrashMessage(input: ChatTrashMutationInput): Promise<void> {
  const { userId, id } = input;
  const message = await assertCanAccessMessage(userId, id);

  const updated = await prisma.message.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new ChatTrashError('Message not found or already trashed', 'not_found');
  }

  await recordMessageTrashed({
    actorUserId: userId,
    messageId: id,
    conversationId: message.conversationId,
  });
}

export async function restoreMessage(input: ChatTrashMutationInput): Promise<boolean> {
  const { userId, id } = input;
  const message = await assertCanAccessTrashedMessage(userId, id);

  const updated = await prisma.message.updateMany({
    where: { id, deletedAt: { not: null } },
    data: { deletedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordMessageRestored({
    actorUserId: userId,
    messageId: id,
    conversationId: message.conversationId,
  });
  return true;
}

export async function permanentlyDeleteMessage(input: ChatTrashMutationInput): Promise<boolean> {
  const { userId, id } = input;
  await assertCanAccessTrashedMessage(userId, id);

  const deleted = await prisma.message.deleteMany({
    where: { id, deletedAt: { not: null } },
  });

  if (deleted.count === 0) {
    return false;
  }

  await recordMessagePermanentlyDeleted({ actorUserId: userId, messageId: id });
  return true;
}

export async function softTrashChatItem(input: ChatTrashMutationInput): Promise<void> {
  if (input.type === 'conversation') {
    await softTrashConversation(input);
    return;
  }
  if (input.type === 'message') {
    await softTrashMessage(input);
    return;
  }
  throw new ChatTrashError(`Unsupported chat trash type: ${input.type}`, 'invalid');
}

export async function restoreChatItem(input: ChatTrashMutationInput): Promise<boolean> {
  if (input.type === 'conversation') {
    return restoreConversation(input);
  }
  if (input.type === 'message') {
    return restoreMessage(input);
  }
  return false;
}

export async function permanentlyDeleteChatItem(input: ChatTrashMutationInput): Promise<boolean> {
  if (input.type === 'conversation') {
    return permanentlyDeleteConversation(input);
  }
  if (input.type === 'message') {
    return permanentlyDeleteMessage(input);
  }
  return false;
}

/** Global Trash UI: conversations only (messages stay in-chat lifecycle). */
export async function listTrashedConversationsForGlobalTrash(
  userId: string
): Promise<GlobalTrashListItem[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      trashedAt: { not: null },
      participants: {
        some: { userId, isActive: true },
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
      trashedAt: true,
    },
    orderBy: { trashedAt: 'desc' },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    name: conversation.name || 'Untitled Conversation',
    type: 'conversation' as const,
    moduleId: 'chat' as const,
    moduleName: 'Chat' as const,
    trashedAt: conversation.trashedAt,
    metadata: { conversationType: conversation.type },
  }));
}

export async function emptyChatTrash(input: { userId: string }): Promise<number> {
  const { userId } = input;
  let deletedCount = 0;

  const trashedConversations = await prisma.conversation.findMany({
    where: {
      trashedAt: { not: null },
      participants: {
        some: { userId, isActive: true },
      },
    },
    select: { id: true },
  });

  for (const conversation of trashedConversations) {
    const ok = await permanentlyDeleteConversation({
      userId,
      type: 'conversation',
      id: conversation.id,
    });
    if (ok) deletedCount += 1;
  }

  const trashedMessages = await prisma.message.findMany({
    where: {
      deletedAt: { not: null },
      OR: [
        { senderId: userId },
        {
          conversation: {
            participants: {
              some: { userId, isActive: true },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  for (const message of trashedMessages) {
    const ok = await permanentlyDeleteMessage({
      userId,
      type: 'message',
      id: message.id,
    });
    if (ok) deletedCount += 1;
  }

  await logger.info('Chat trash emptied', {
    operation: 'chat_empty_trash',
    userId,
    deletedCount,
  });

  return deletedCount;
}
