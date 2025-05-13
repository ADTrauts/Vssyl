import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../utils/logActivity.js';

const router = express.Router();

// Get all conversations for the current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: req.user.id
          }
        }
      },
      include: {
        participants: true,
        messages: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    });

    res.json(conversations.map(conv => ({
      id: conv.id,
      name: conv.name,
      lastMessage: conv.messages[0],
      unreadCount: 0, // This should be calculated based on read status
      participants: conv.participants
    })));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit) + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    const hasMore = messages.length > limit;
    const nextCursor = hasMore ? messages[limit - 1].id : null;
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;

    res.json({
      messages: messagesToReturn,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantIds, name } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        name,
        participants: {
          connect: [
            { id: req.user.id },
            ...participantIds.map(id => ({ id }))
          ]
        }
      },
      include: {
        participants: true
      }
    });

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'create_conversation',
      details: {
        conversationId: conversation.id,
        type: conversation.type
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Mark messages as read
router.post('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: req.user.id },
        readBy: { none: { id: req.user.id } }
      },
      data: {
        readBy: {
          connect: { id: req.user.id }
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router; 