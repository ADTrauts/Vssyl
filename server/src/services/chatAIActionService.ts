import { prisma } from '../lib/prisma';
import { ChatServiceError } from './chat/chatErrors';
import type { ConversationType } from './chat/chatTypes';
import { createConversation } from './chatConversationService';
import { sendMessage } from './chatMessageService';

export type ChatAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

async function resolveActorDisplayName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (user?.name?.trim()) return user.name.trim();
  if (user?.email) return user.email.split('@')[0] ?? 'Someone';
  return 'Someone';
}

function toOutcome(error: unknown, fallback: string): ChatAIActionOutcome {
  if (error instanceof ChatServiceError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message || fallback };
  }
  return { success: false, error: fallback };
}

export async function aiSendMessage(params: {
  userId: string;
  conversationId: string;
  content: string;
  fileIds?: string[];
  replyToId?: string | null;
  threadId?: string | null;
}): Promise<ChatAIActionOutcome> {
  try {
    const senderName = await resolveActorDisplayName(params.userId);
    const message = await sendMessage({
      userId: params.userId,
      senderName,
      conversationId: params.conversationId,
      content: params.content,
      fileIds: params.fileIds,
      replyToId: params.replyToId ?? null,
      threadId: params.threadId ?? null,
    });
    return { success: true, data: message };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to send message');
  }
}

export async function aiCreateConversation(params: {
  userId: string;
  type: ConversationType;
  participantIds: string[];
  name?: string;
  dashboardId?: string;
}): Promise<ChatAIActionOutcome> {
  try {
    const result = await createConversation({
      userId: params.userId,
      type: params.type,
      participantIds: params.participantIds,
      name: params.name,
      dashboardId: params.dashboardId,
    });
    return {
      success: true,
      data: {
        conversation: result.conversation,
        created: result.created,
      },
    };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to create conversation');
  }
}

export async function aiRespondToMessage(params: {
  userId: string;
  conversationId: string;
  messageId: string;
  content: string;
  fileIds?: string[];
}): Promise<ChatAIActionOutcome> {
  return aiSendMessage({
    userId: params.userId,
    conversationId: params.conversationId,
    content: params.content,
    fileIds: params.fileIds,
    replyToId: params.messageId,
  });
}
