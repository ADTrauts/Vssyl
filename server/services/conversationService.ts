import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

export class ConversationService {
  // Check workspace access
  private async checkWorkspaceAccess(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        category: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const member = workspace.category.members[0];
    if (!member) {
      throw new UnauthorizedError('Unauthorized access to workspace');
    }

    return { workspace, member };
  }

  // Check conversation access
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

    if (!isParticipant || !isCategoryMember) {
      throw new UnauthorizedError('Unauthorized access to conversation');
    }

    return conversation;
  }

  // Get all conversations in workspace
  async getConversations(workspaceId: string, userId: string) {
    await this.checkWorkspaceAccess(workspaceId, userId);

    const conversations = await prisma.conversation.findMany({
      where: { workspaceId },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        lastMessage: {
          select: {
            content: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                NOT: {
                  readBy: {
                    some: {
                      id: userId,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map(conversation => ({
      ...conversation,
      unreadCount: conversation._count.messages,
    }));
  }

  // Create a new conversation
  async createConversation(workspaceId: string, userId: string, data: {
    name: string;
    type?: 'direct' | 'group';
    participantIds?: string[];
  }) {
    const { name, type = 'group', participantIds = [] } = data;

    if (!name) {
      throw new BadRequestError('Name is required');
    }

    const { member } = await this.checkWorkspaceAccess(workspaceId, userId);

    // For group conversations, ensure the creator has appropriate permissions
    if (type === 'group' && !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions to create group conversations');
    }

    return prisma.conversation.create({
      data: {
        name,
        type,
        workspaceId,
        participants: {
          connect: [
            { id: userId },
            ...participantIds.map(id => ({ id })),
          ],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // Get messages in conversation
  async getMessages(workspaceId: string, conversationId: string, userId: string, options: {
    cursor?: string;
    limit?: number;
  }) {
    await this.checkConversationAccess(conversationId, workspaceId, userId);

    const { cursor, limit = 50 } = options;

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        readBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return {
      messages,
      nextCursor,
    };
  }

  // Create a message in conversation
  async createMessage(workspaceId: string, conversationId: string, userId: string, data: {
    content: string;
    type?: string;
    metadata?: Record<string, any>;
  }) {
    const { content, type = 'text', metadata = {} } = data;

    if (!content) {
      throw new BadRequestError('Content is required');
    }

    await this.checkConversationAccess(conversationId, workspaceId, userId);

    // Create message and update conversation in a transaction
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content,
          type,
          metadata,
          conversationId,
          senderId: userId,
          readBy: {
            connect: [{ id: userId }],
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          readBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: message.id,
          updatedAt: new Date(),
        },
      });

      return message;
    });
  }

  // Search messages in conversation
  async searchMessages(workspaceId: string, conversationId: string, userId: string, options: {
    query: string;
    cursor?: string;
    limit?: number;
    type?: string;
  }) {
    if (!options.query) {
      throw new BadRequestError('Search query is required');
    }

    await this.checkConversationAccess(conversationId, workspaceId, userId);

    const { query, cursor, limit = 20, type } = options;

    // Build search conditions
    const whereConditions = {
      conversationId,
      content: {
        contains: query,
        mode: 'insensitive' as const,
      },
      ...(type && { type }),
    };

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: whereConditions,
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        readBy: {
          select: {
            id: true,
            name: true,
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
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: whereConditions,
    });

    // Get the next cursor
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    // Group reactions by emoji for each message
    const formattedMessages = messages.map(message => ({
      ...message,
      reactions: message.reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.user);
        return acc;
      }, {} as Record<string, Array<{ id: string; name: string; avatarUrl: string | null }>>),
    }));

    // Get context messages (messages before and after each result)
    const contextSize = 2; // Number of messages before and after
    const messagesWithContext = await Promise.all(
      formattedMessages.map(async (message) => {
        const context = await prisma.message.findMany({
          where: {
            conversationId,
            createdAt: {
              gte: new Date(message.createdAt.getTime() - 1000 * 60 * 60), // 1 hour before
              lte: new Date(message.createdAt.getTime() + 1000 * 60 * 60), // 1 hour after
            },
            NOT: {
              id: message.id,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: contextSize * 2,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        return {
          ...message,
          context: {
            before: context.filter(m => m.createdAt < message.createdAt).slice(-contextSize),
            after: context.filter(m => m.createdAt > message.createdAt).slice(0, contextSize),
          },
        };
      })
    );

    return {
      messages: messagesWithContext,
      totalCount,
      nextCursor,
    };
  }
} 