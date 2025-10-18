/**
 * Chat AI Context Provider Controller
 * 
 * Provides context data about a user's Chat/Messaging activity to the AI system.
 * These endpoints are called by the CrossModuleContextEngine when processing AI queries.
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/chat/ai/context/recent
 * 
 * Returns recent conversations for AI context
 * Used by AI to understand what conversations the user has been active in
 */
export async function getRecentConversationsContext(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user's recent conversations
    const recentConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });
    
    // Format for AI consumption
    const context = {
      recentConversations: recentConversations.map((conv: Record<string, any>) => ({
        id: conv.id,
        name: conv.name || 'Unnamed Conversation',
        type: conv.type,
        participantCount: conv.participants.length,
        participants: conv.participants.map((p: Record<string, any>) => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email
        })),
        lastMessage: conv.messages[0] ? {
          content: conv.messages[0].content.substring(0, 100), // First 100 chars
          timestamp: conv.messages[0].createdAt.toISOString(),
          fromUser: conv.messages[0].senderId === userId
        } : null,
        lastActivity: conv.updatedAt.toISOString()
      })),
      summary: {
        totalActiveConversations: recentConversations.length,
        hasDirectMessages: recentConversations.some((c: Record<string, any>) => c.type === 'DIRECT'),
        hasGroupChats: recentConversations.some((c: Record<string, any>) => c.type === 'GROUP'),
        mostRecentActivity: recentConversations[0]?.updatedAt.toISOString()
      }
    };
    
    res.json({
      success: true,
      context,
      metadata: {
        provider: 'chat',
        endpoint: 'recentConversations',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in getRecentConversationsContext:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent conversations context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/chat/ai/context/unread
 * 
 * Returns unread message statistics for AI context
 * Used by AI to understand pending communications
 */
export async function getUnreadMessagesContext(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get recent conversations with messages (since unreadCount doesn't exist in schema)
    const conversationsWithMessages = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          where: {
            userId
          }
        },
        messages: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          where: {
            senderId: {
              not: userId
            }
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });
    
    // Count unread as messages from last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    let totalUnread = 0;
    conversationsWithMessages.forEach((conv: Record<string, any>) => {
      const recentMessages = conv.messages.filter((msg: Record<string, any>) => msg.createdAt > oneDayAgo);
      totalUnread += recentMessages.length;
    });
    
    // Format for AI consumption
    const context = {
      unreadMessages: {
        total: totalUnread,
        conversationCount: conversationsWithMessages.length,
        preview: conversationsWithMessages.slice(0, 5).map((conv: Record<string, any>) => {
          const recentMessages = conv.messages.filter((msg: Record<string, any>) => msg.createdAt > oneDayAgo);
          return {
            conversationId: conv.id,
            conversationName: conv.name || 'Unnamed Conversation',
            unreadCount: recentMessages.length,
            latestMessage: conv.messages[0] ? {
              from: conv.messages[0].sender.name,
              preview: conv.messages[0].content.substring(0, 50),
              timestamp: conv.messages[0].createdAt.toISOString()
            } : null
          };
        })
      },
      summary: {
        hasUnreadMessages: totalUnread > 0,
        requiresAttention: totalUnread > 10,
        status: totalUnread === 0 ? 'all-caught-up' : totalUnread > 10 ? 'many-unread' : 'some-unread'
      }
    };
    
    res.json({
      success: true,
      context,
      metadata: {
        provider: 'chat',
        endpoint: 'unreadMessages',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in getUnreadMessagesContext:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unread messages context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/chat/ai/query/history
 * 
 * Queryable endpoint for conversation history
 * Supports dynamic queries from the AI system
 */
export async function getConversationHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { conversationId, limit = '20' } = req.query;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'conversationId is required' 
      });
    }
    
    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversationId as string,
        userId
      }
    });
    
    if (!participant) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this conversation' 
      });
    }
    
    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId as string
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      messages: messages.reverse().map((msg: Record<string, any>) => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          isCurrentUser: msg.sender.id === userId
        },
        timestamp: msg.createdAt.toISOString()
      })),
      metadata: {
        provider: 'chat',
        endpoint: 'conversationHistory',
        conversationId,
        messageCount: messages.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in getConversationHistory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get conversation history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

