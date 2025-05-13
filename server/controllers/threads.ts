import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { logger } from '../utils/logger';

export const createThread = async (req: Request, res: Response) => {
  try {
    const { messageId, title, style = 'DEFAULT' } = req.body;
    const userId = req.user.id;

    // Get the parent message
    const parentMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    });

    if (!parentMessage) {
      return res.status(404).json({ message: 'Parent message not found' });
    }

    // Create the thread
    const thread = await prisma.thread.create({
      data: {
        title,
        style,
        message: { connect: { id: messageId } },
        participants: {
          create: {
            userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        message: true,
        participants: true
      }
    });

    // Add the thread to the parent message
    await prisma.message.update({
      where: { id: messageId },
      data: { thread: { connect: { id: thread.id } } }
    });

    res.status(201).json(thread);
  } catch (error) {
    logger.error('Error creating thread:', error);
    res.status(500).json({ message: 'Error creating thread' });
  }
};

export const getThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        message: true,
        participants: {
          include: { user: true }
        },
        messages: {
          include: {
            sender: true,
            reactions: true,
            attachments: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Check if user is a participant
    const isParticipant = thread.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this thread' });
    }

    res.json(thread);
  } catch (error) {
    logger.error('Error fetching thread:', error);
    res.status(500).json({ message: 'Error fetching thread' });
  }
};

export const addMessageToThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { content, type = 'text', metadata } = req.body;
    const userId = req.user.id;

    // Check if user is a participant
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { participants: true }
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const isParticipant = thread.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to post in this thread' });
    }

    // Create the message
    const message = await prisma.threadMessage.create({
      data: {
        content,
        type,
        metadata,
        thread: { connect: { id: threadId } },
        sender: { connect: { id: userId } }
      },
      include: {
        sender: true,
        reactions: true,
        attachments: true
      }
    });

    // Update thread's last activity
    await prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    logger.error('Error adding message to thread:', error);
    res.status(500).json({ message: 'Error adding message to thread' });
  }
};

export const searchThreads = async (req: Request, res: Response) => {
  try {
    const { query, workspaceId } = req.query;
    const userId = req.user.id;

    const threads = await prisma.thread.findMany({
      where: {
        AND: [
          {
            participants: {
              some: { userId }
            }
          },
          {
            OR: [
              { title: { contains: query as string, mode: 'insensitive' } },
              {
                messages: {
                  some: {
                    content: { contains: query as string, mode: 'insensitive' }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        message: true,
        participants: {
          include: { user: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(threads);
  } catch (error) {
    logger.error('Error searching threads:', error);
    res.status(500).json({ message: 'Error searching threads' });
  }
};

export const addReaction = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const reaction = await prisma.threadReaction.create({
      data: {
        emoji,
        message: { connect: { id: messageId } },
        user: { connect: { id: userId } }
      },
      include: {
        user: true
      }
    });

    res.status(201).json(reaction);
  } catch (error) {
    logger.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Error adding reaction' });
  }
};

export const removeReaction = async (req: Request, res: Response) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user.id;

    await prisma.threadReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji
      }
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error removing reaction:', error);
    res.status(500).json({ message: 'Error removing reaction' });
  }
}; 