import { prisma } from '../lib/prisma';
import { NotificationService } from './notificationService';
import { logger } from '../lib/logger';

async function emitChatNotification(
  type: 'chat_message' | 'chat_mention' | 'chat_reaction',
  params: {
    actorUserId: string;
    recipients: string[];
    title: string;
    body: string;
    data: Record<string, unknown>;
  }
): Promise<void> {
  const recipients = [...new Set(params.recipients.filter((id) => id && id !== params.actorUserId))];
  if (recipients.length === 0) return;

  try {
    await NotificationService.handleNotification({
      type,
      title: params.title,
      body: params.body,
      data: params.data,
      recipients,
      senderId: params.actorUserId,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to deliver chat notification', {
      operation: 'chat_notification_deliver',
      type,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyNewMessage(params: {
  actorUserId: string;
  senderName: string;
  conversationId: string;
  messageId: string;
  content: string;
}): Promise<void> {
  const { actorUserId, senderName, conversationId, messageId, content } = params;

  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: actorUserId },
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (participants.length === 0) return;

    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (mentions) {
      const mentionedUsernames = mentions.map((m) => m.substring(1));
      const mentionedUsers = await prisma.user.findMany({
        where: { name: { in: mentionedUsernames } },
        select: { id: true, name: true },
      });

      for (const mentionedUser of mentionedUsers) {
        await emitChatNotification('chat_mention', {
          actorUserId,
          recipients: [mentionedUser.id],
          title: `${senderName} mentioned you in a conversation`,
          body: content,
          data: {
            conversationId,
            messageId,
            senderId: actorUserId,
            senderName,
          },
        });
      }
      return;
    }

    await emitChatNotification('chat_message', {
      actorUserId,
      recipients: participants.map((p) => p.user.id),
      title: `New message from ${senderName}`,
      body: content.length > 100 ? `${content.substring(0, 100)}...` : content,
      data: {
        conversationId,
        messageId,
        senderId: actorUserId,
        senderName,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to resolve chat message notification recipients', {
      operation: 'chat_notify_new_message',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyReaction(params: {
  actorUserId: string;
  actorName: string;
  messageId: string;
  conversationId: string;
  messageSenderId: string;
  emoji: string;
}): Promise<void> {
  if (params.messageSenderId === params.actorUserId) return;

  await emitChatNotification('chat_reaction', {
    actorUserId: params.actorUserId,
    recipients: [params.messageSenderId],
    title: `${params.actorName} reacted to your message`,
    body: `Reacted with ${params.emoji}`,
    data: {
      messageId: params.messageId,
      conversationId: params.conversationId,
      emoji: params.emoji,
      senderId: params.actorUserId,
      senderName: params.actorName,
    },
  });
}
