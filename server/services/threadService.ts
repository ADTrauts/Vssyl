import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

export class ThreadService {
  // Check user access to conversation
  private async checkConversationAccess(conversationId: string, workspaceId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        workspaceId,
      },
      include: {
        participants: {
          select: { id: true },
        },
        workspace: {
          include: {
            category: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    const isCategoryMember = conversation.workspace.category.members.length > 0;
    const isAdmin = conversation.workspace.category.members.some(
      m => m.userId === userId && ['OWNER', 'ADMIN'].includes(m.role)
    );

    if (!isParticipant || !isCategoryMember) {
      throw new UnauthorizedError('Unauthorized access to conversation');
    }

    return { conversation, isAdmin };
  }

  // Get thread details
  async getThread(workspaceId: string, conversationId: string, messageId: string, userId: string) {
    await this.checkConversationAccess(conversationId, workspaceId, userId);

    const thread = await prisma.thread.findUnique({
      where: {
        parentMessageId: messageId,
      },
      include: {
        parentMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            attachments: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    // Group reactions by emoji for each message
    const messagesWithGroupedReactions = thread.messages.map(message => ({
      ...message,
      reactions: message.reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.user);
        return acc;
      }, {} as Record<string, Array<{ id: string; name: string; avatarUrl: string | null }>>),
    }));

    return {
      ...thread,
      messages: messagesWithGroupedReactions,
      isFollowing: thread.participants.some(
        p => p.userId === userId && p.isFollowing
      ),
    };
  }

  // Create a new thread
  async createThread(workspaceId: string, conversationId: string, messageId: string, userId: string) {
    await this.checkConversationAccess(conversationId, workspaceId, userId);

    const existingThread = await prisma.thread.findUnique({
      where: {
        parentMessageId: messageId,
      },
    });

    if (existingThread) {
      throw new BadRequestError('Thread already exists');
    }

    return prisma.thread.create({
      data: {
        parentMessageId: messageId,
        participants: {
          create: {
            userId,
            isFollowing: true,
          },
        },
      },
      include: {
        parentMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  // Delete a thread
  async deleteThread(workspaceId: string, conversationId: string, messageId: string, userId: string) {
    const { isAdmin } = await this.checkConversationAccess(conversationId, workspaceId, userId);

    const thread = await prisma.thread.findUnique({
      where: {
        parentMessageId: messageId,
      },
      include: {
        parentMessage: true,
      },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    if (!isAdmin && thread.parentMessage.senderId !== userId) {
      throw new UnauthorizedError('Insufficient permissions to delete thread');
    }

    await prisma.thread.delete({
      where: {
        id: thread.id,
      },
    });

    return { success: true };
  }

  // Get thread messages
  async getThreadMessages(workspaceId: string, conversationId: string, messageId: string, userId: string, cursor?: string, limit: number = 50) {
    await this.checkConversationAccess(conversationId, workspaceId, userId);

    const messages = await prisma.threadMessage.findMany({
      where: {
        thread: {
          parentMessageId: messageId,
        },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    const hasMore = messages.length > limit;
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;
    const items = hasMore ? messages.slice(0, -1) : messages;

    const messagesWithGroupedReactions = items.map(message => ({
      ...message,
      reactions: message.reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.user);
        return acc;
      }, {} as Record<string, Array<{ id: string; name: string; avatarUrl: string | null }>>),
    }));

    return {
      items: messagesWithGroupedReactions,
      nextCursor,
    };
  }

  // Create thread message
  async createThreadMessage(workspaceId: string, conversationId: string, messageId: string, userId: string, content: string, attachments?: any[]) {
    await this.checkConversationAccess(conversationId, workspaceId, userId);

    if (!content && (!attachments || attachments.length === 0)) {
      throw new BadRequestError('Message must have content or attachments');
    }

    const thread = await prisma.thread.findUnique({
      where: {
        parentMessageId: messageId,
      },
      include: {
        participants: true,
      },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    // Add user as participant if not already
    if (!thread.participants.some(p => p.userId === userId)) {
      await prisma.threadParticipant.create({
        data: {
          threadId: thread.id,
          userId,
          isFollowing: true,
        },
      });
    }

    return prisma.threadMessage.create({
      data: {
        content,
        threadId: thread.id,
        userId,
        ...(attachments && {
          attachments: {
            createMany: {
              data: attachments.map(attachment => ({
                name: attachment.name,
                url: attachment.url,
                type: attachment.type,
                size: attachment.size,
              })),
            },
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },
    });
  }

  // Update thread message
  async updateThreadMessage(workspaceId: string, conversationId: string, messageId: string, threadMessageId: string, userId: string, content: string) {
    const { isAdmin } = await this.checkConversationAccess(conversationId, workspaceId, userId);

    if (!content) {
      throw new BadRequestError('Message content is required');
    }

    const message = await prisma.threadMessage.findUnique({
      where: {
        id: threadMessageId,
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (!isAdmin && message.userId !== userId) {
      throw new UnauthorizedError('Insufficient permissions to update message');
    }

    return prisma.threadMessage.update({
      where: {
        id: threadMessageId,
      },
      data: {
        content,
        edited: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        attachments: true,
      },
    });
  }
} 