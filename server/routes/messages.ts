import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { isAuthenticated } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const GetMessagesSchema = z.object({
  workspaceId: z.string(),
  conversationId: z.string(),
  cursor: z.string().optional(),
  limit: z.string().transform(Number).default('20'),
});

const CreateMessageSchema = z.object({
  workspaceId: z.string(),
  conversationId: z.string(),
  content: z.string(),
  type: z.enum(['text', 'file']).default('text'),
  fileId: z.string().optional(),
});

// Get messages for a conversation
router.get(
  '/workspaces/:workspaceId/conversations/:conversationId/messages',
  isAuthenticated,
  validateRequest({
    params: GetMessagesSchema.pick({ workspaceId: true, conversationId: true }),
    query: GetMessagesSchema.pick({ cursor: true, limit: true }),
  }),
  asyncHandler(async (req, res) => {
    const { workspaceId, conversationId } = req.params;
    const { cursor, limit } = req.query;
    const userId = req.user.id;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId,
        workspaceId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Not a participant in this conversation',
      });
    }

    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      take: Number(limit) + 1,
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            status: true,
          },
        },
        reactions: true,
      },
      ...(cursor && {
        cursor: {
          id: cursor,
        },
      }),
    });

    let nextCursor: string | null = null;
    if (messages.length > Number(limit)) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id || null;
    }

    return res.json({
      data: {
        messages: messages.map(message => ({
          ...message,
          reactions: message.reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = [];
            }
            acc[reaction.emoji].push(reaction.userId);
            return acc;
          }, {} as Record<string, string[]>),
        })),
        nextCursor,
      },
    });
  })
);

// Create a new message
router.post(
  '/workspaces/:workspaceId/conversations/:conversationId/messages',
  isAuthenticated,
  validateRequest({
    params: CreateMessageSchema.pick({ workspaceId: true, conversationId: true }),
    body: CreateMessageSchema.pick({ content: true, type: true, fileId: true }),
  }),
  asyncHandler(async (req, res) => {
    const { workspaceId, conversationId } = req.params;
    const { content, type, fileId } = req.body;
    const userId = req.user.id;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId,
        workspaceId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Not a participant in this conversation',
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        type,
        fileId,
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    return res.json({
      data: { ...message, reactions: {} },
    });
  })
);

export default router; 