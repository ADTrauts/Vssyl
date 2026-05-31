import { prisma } from '../lib/prisma';
import { ChatServiceError } from './chat/chatErrors';
import type { CreateThreadInput } from './chat/chatTypes';
import { threadListInclude } from './chat/chatIncludes';
import { assertActiveConversationParticipant } from './chatPermissionService';
import { recordThreadCreated } from './chatActivityService';

export async function listThreads(userId: string, conversationId: string) {
  await assertActiveConversationParticipant(userId, conversationId);

  return prisma.thread.findMany({
    where: {
      conversationId,
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
    include: threadListInclude,
    orderBy: { lastMessageAt: 'desc' },
  });
}

export async function createThread(input: CreateThreadInput) {
  const {
    userId,
    conversationId,
    name,
    type = 'MESSAGE',
    parentId,
    participantIds = [],
  } = input;

  await assertActiveConversationParticipant(userId, conversationId);

  if (parentId) {
    const parentThread = await prisma.thread.findFirst({
      where: {
        id: parentId,
        conversationId,
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
    });

    if (!parentThread) {
      throw new ChatServiceError('Parent thread not found', 'not_found', 404);
    }
  }

  const allParticipantIds = [...new Set([userId, ...participantIds])];

  const thread = await prisma.thread.create({
    data: {
      conversationId,
      name,
      type,
      parentId,
      participants: {
        create: allParticipantIds.map((participantId, index) => ({
          userId: participantId,
          role: index === 0 ? 'OWNER' : 'MEMBER',
        })),
      },
    },
    include: {
      participants: threadListInclude.participants,
    },
  });

  await recordThreadCreated({
    actorUserId: userId,
    threadId: thread.id,
    conversationId,
  });

  return thread;
}

/** Creates a thread for a reply target when none exists; updates replied message threadId. */
export async function ensureThreadForReply(input: {
  userId: string;
  conversationId: string;
  replyToId: string;
  existingThreadId?: string | null;
}): Promise<string | null> {
  const { userId, conversationId, replyToId, existingThreadId } = input;

  const repliedMessage = await prisma.message.findFirst({
    where: {
      id: replyToId,
      conversationId,
      deletedAt: null,
    },
    select: {
      id: true,
      threadId: true,
      content: true,
    },
  });

  if (!repliedMessage) {
    throw new ChatServiceError('Message being replied to not found', 'not_found', 404);
  }

  let validatedThreadId = existingThreadId ?? repliedMessage.threadId;

  if (!validatedThreadId) {
    const threadName = `Thread: ${repliedMessage.content.substring(0, 50)}${
      repliedMessage.content.length > 50 ? '...' : ''
    }`;

    const newThread = await prisma.thread.create({
      data: {
        conversationId,
        name: threadName,
        type: 'MESSAGE',
        participants: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    await recordThreadCreated({
      actorUserId: userId,
      threadId: newThread.id,
      conversationId,
    });

    validatedThreadId = newThread.id;

    await prisma.message.update({
      where: { id: replyToId },
      data: { threadId: newThread.id },
    });
  }

  return validatedThreadId;
}

export async function assertThreadInConversation(
  threadId: string,
  conversationId: string
): Promise<void> {
  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
      conversationId,
    },
    select: { id: true },
  });

  if (!thread) {
    throw new ChatServiceError('Thread not found', 'not_found', 404);
  }
}
