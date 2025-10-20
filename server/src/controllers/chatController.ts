import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from '../services/chatSocketService';
import { NotificationService } from '../services/notificationService';
import { logger } from '../lib/logger';

// Request type definitions
interface CreateConversationRequest {
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  participantIds: string[];
  dashboardId?: string;
}

interface CreateMessageRequest {
  conversationId: string;
  content: string;
  type?: 'TEXT' | 'FILE' | 'SYSTEM' | 'REACTION';
  fileIds?: string[];
  threadId?: string;
  replyToId?: string;
}

interface CreateThreadRequest {
  conversationId: string;
  name?: string;
  type?: 'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION';
  parentId?: string;
  participantIds?: string[];
}

interface AddReactionRequest {
  messageId: string;
  emoji: string;
}

interface MarkAsReadRequest {
  messageId: string;
}

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  return req.user || null;
};

// Helper function to get organization info
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getOrganizationInfo = (user: any) => {
  if (user.businesses && user.businesses.length > 0) {
    const membership = user.businesses[0];
    return {
      id: membership.business.id,
      name: membership.business.name,
      type: 'business' as const,
      role: membership.role,
    };
  }
  if (user.institutionMembers && user.institutionMembers.length > 0) {
    const membership = user.institutionMembers[0];
    return {
      id: membership.institution.id,
      name: membership.institution.name,
      type: 'institution' as const,
      role: membership.role,
    };
  }
  return null;
};

// Helper function to handle errors
const handleError = async (res: Response, error: unknown, message: string = 'Internal server error') => {
  const err = error as Error;
  await logger.error('Chat controller error', {
    operation: 'chat_controller_error',
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }
  });
  res.status(500).json({ success: false, error: message });
};

// Enhanced user search for chat with connection status
export const searchUsersForChat = async (req: Request, res: Response) => {
  try {
    const { query, limit = 20, offset = 0, dashboardId } = req.query;
    const currentUser = req.user;

    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });
    }

    // Get current user's business memberships for colleague detection
    const currentUserBusinesses = await prisma.businessMember.findMany({
      where: { userId: currentUser.id, isActive: true },
      select: { businessId: true },
    });

    const currentUserBusinessIds = currentUserBusinesses.map(m => m.businessId);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        NOT: { id: currentUser.id }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        businesses: {
          where: { isActive: true },
          select: {
            business: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
          },
        },
        institutionMembers: {
          where: { isActive: true },
          select: {
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
          },
        },
      },
      take: Number(limit),
      skip: Number(offset),
    });

    // Get relationships for connection status
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
                  { senderId: currentUser.id },
        { receiverId: currentUser.id },
        ],
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        type: true,
      },
    });

    // Process users to include connection status and organization info
    const processedUsers = users.map(user => {
      const sentRelationship = relationships.find(r => r.senderId === user.id && r.receiverId === currentUser.id);
      const receivedRelationship = relationships.find(r => r.receiverId === user.id && r.senderId === currentUser.id);
      
      let connectionStatus = 'none';
      let relationshipId = null;
      
      if (sentRelationship) {
        connectionStatus = sentRelationship.status.toLowerCase();
        relationshipId = sentRelationship.id;
      } else if (receivedRelationship) {
        connectionStatus = receivedRelationship.status.toLowerCase();
        relationshipId = receivedRelationship.id;
      }

      // Check if user is a colleague (same business)
      const isColleague = user.businesses.some(membership => 
        currentUserBusinessIds.includes(membership.business.id)
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        connectionStatus,
        relationshipId,
        organization: getOrganizationInfo(user),
        isColleague,
        canConnect: connectionStatus === 'none',
      };
    });

    // Sort users: connections first, then colleagues, then others
    const sortedUsers = processedUsers.sort((a, b) => {
      // Connections first
      if (a.connectionStatus === 'accepted' && b.connectionStatus !== 'accepted') return -1;
      if (b.connectionStatus === 'accepted' && a.connectionStatus !== 'accepted') return 1;
      
      // Then colleagues
      if (a.isColleague && !b.isColleague) return -1;
      if (b.isColleague && !a.isColleague) return 1;
      
      // Then by name
      return (a.name || a.email).localeCompare(b.name || b.email);
    });

    res.json({ success: true, data: sortedUsers });
  } catch (error) {
    await logger.error('Failed to search users for chat', {
      operation: 'chat_search_users',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Conversations

export const getConversations = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { dashboardId } = req.query;

    // Base query for conversations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      participants: {
        some: {
          userId: user.id,
          isActive: true
        }
      }
    };

    // Add dashboard filtering if dashboardId is provided
    if (dashboardId && typeof dashboardId === 'string') {
      whereClause.dashboardId = dashboardId;
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        threads: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    res.json({ success: true, data: conversations });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch conversations');
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: user.id,
            isActive: true
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
        threads: {
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
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch conversation');
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, type, participantIds, dashboardId }: CreateConversationRequest = req.body;

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([user.id, ...participantIds])];

    // For direct conversations, check if one already exists
    if (type === 'DIRECT' && participantIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: { in: allParticipantIds },
              isActive: true
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
          }
        }
      });

      if (existingConversation) {
        return res.json({ success: true, data: existingConversation });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        name,
        type,
        dashboardId,
        participants: {
          create: allParticipantIds.map((participantId, index) => ({
            userId: participantId,
            role: index === 0 ? 'OWNER' : 'MEMBER'
          }))
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
        }
      }
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    await handleError(res, error, 'Failed to create conversation');
  }
};

// Messages

export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 50, threadId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Verify user has access to conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      conversationId,
      deletedAt: null
    };

    if (threadId) {
      where.threadId = threadId;
    } else {
      where.threadId = null; // Only main conversation messages
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        fileReferences: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                type: true,
                size: true,
                url: true
              }
            }
          }
        },
        reactions: {
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
        readReceipts: {
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
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        replies: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.message.count({ where });

    // Add full URLs to file references in all messages
    const messagesWithFullUrls = messages.map(message => ({
      ...message,
      fileReferences: message.fileReferences.map(fileRef => ({
        ...fileRef,
        file: {
          ...fileRef.file,
          url: `${process.env.BACKEND_URL || 'https://vssyl-server-235369681725.us-central1.run.app'}${fileRef.file.url}`
        }
      }))
    }));

    res.json({
      success: true,
      data: messagesWithFullUrls.reverse(), // Return in chronological order
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + messages.length < total
      }
    });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch messages');
  }
};

export const createMessage = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { content, threadId, replyToId, fileIds } = req.body;
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  try {
    // Verify user has access to conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ success: false, error: 'Access denied to conversation' });
    }

    // If replying to a message, validate the replyToId and handle thread creation
    let validatedThreadId = threadId;
    if (replyToId) {
      const repliedMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          conversationId,
          deletedAt: null
        },
        select: {
          id: true,
          threadId: true,
          content: true
        }
      });

      if (!repliedMessage) {
        return res.status(404).json({ success: false, error: 'Message being replied to not found' });
      }

      // If no threadId provided, use the threadId of the replied message
      if (!validatedThreadId) {
        validatedThreadId = repliedMessage.threadId;
      }

      // If the replied message doesn't have a thread, create one
      if (!validatedThreadId) {
        const threadName = `Thread: ${repliedMessage.content.substring(0, 50)}${repliedMessage.content.length > 50 ? '...' : ''}`;
        
        const newThread = await prisma.thread.create({
          data: {
            conversationId,
            name: threadName,
            type: 'MESSAGE',
            participants: {
              create: {
                userId: user.id,
                role: 'OWNER'
              }
            }
          }
        });
        
        validatedThreadId = newThread.id;
        
        // Update the replied message to be part of this thread
        await prisma.message.update({
          where: { id: replyToId },
          data: { threadId: newThread.id }
        });
      }
    }

    // If threadId is provided, validate it exists
    if (validatedThreadId) {
      const thread = await prisma.thread.findFirst({
        where: {
          id: validatedThreadId,
          conversationId
        }
      });

      if (!thread) {
        return res.status(404).json({ success: false, error: 'Thread not found' });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        threadId: validatedThreadId,
        replyToId,
        fileReferences: fileIds ? {
          create: fileIds.map((fileId: string) => ({ fileId }))
        } : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        fileReferences: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                type: true,
                size: true,
                url: true
              }
            },
          },
        },
        reactions: true,
        readReceipts: true,
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        replies: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
    });

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Update thread's lastMessageAt if message is in a thread
    if (validatedThreadId) {
      await prisma.thread.update({
        where: { id: validatedThreadId },
        data: { lastMessageAt: new Date() }
      });
    }

    // Add full URLs to file references
    const messageWithFullUrls = {
      ...message,
      fileReferences: message.fileReferences.map(fileRef => ({
        ...fileRef,
        file: {
          ...fileRef.file,
          url: `${process.env.BACKEND_URL || 'https://vssyl-server-235369681725.us-central1.run.app'}${fileRef.file.url}`
        }
      }))
    };

    // Broadcast the new message to the conversation room
    const chatSocketService = getChatSocketService();
    chatSocketService.broadcastMessage(conversationId, messageWithFullUrls);

    // Create notifications for conversation participants
    try {
      // Get conversation participants (excluding sender)
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: user.id },
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (participants.length > 0) {
        // Check for mentions in the message
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex);
        
        if (mentions) {
          // Handle mentions - create notifications for mentioned users
          const mentionedUsernames = mentions.map((m: string) => m.substring(1));
          
          // Find mentioned users
          const mentionedUsers = await prisma.user.findMany({
            where: {
              name: { in: mentionedUsernames }
            },
            select: { id: true, name: true }
          });

          for (const mentionedUser of mentionedUsers) {
            await NotificationService.handleNotification({
              type: 'chat_mention',
              title: `${user.name} mentioned you in a conversation`,
              body: content,
              data: {
                conversationId,
                messageId: message.id,
                senderId: user.id,
                senderName: user.name
              },
              recipients: [mentionedUser.id],
              senderId: user.id
            });
          }
        } else {
          // Regular message notification for conversation participants
          const recipientIds = participants.map(p => p.user.id);
          
          await NotificationService.handleNotification({
            type: 'chat_message',
            title: `New message from ${user.name}`,
            body: content.length > 100 ? content.substring(0, 100) + '...' : content,
            data: {
              conversationId,
              messageId: message.id,
              senderId: user.id,
              senderName: user.name
            },
            recipients: recipientIds,
            senderId: user.id
          });
        }
      }
    } catch (notificationError) {
      await logger.error('Failed to create chat notifications', {
        operation: 'chat_create_notifications',
        error: {
          message: notificationError instanceof Error ? notificationError.message : 'Unknown error',
          stack: notificationError instanceof Error ? notificationError.stack : undefined
        }
      });
      // Don't fail the message creation if notifications fail
    }

    res.status(201).json({ success: true, data: messageWithFullUrls });
  } catch (error) {
    await logger.error('Failed to create message', {
      operation: 'chat_create_message',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
};

// Reactions

export const addReaction = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { messageId } = req.params;
    const { emoji }: AddReactionRequest = req.body;

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        deletedAt: null
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: user.id,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.conversation.participants.length === 0) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    let action: 'added' | 'removed';
    let reactionData: Record<string, any> | null = null;

    if (existingReaction) {
      // Remove existing reaction (toggle)
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });
      
      action = 'removed';
      reactionData = {
        id: existingReaction.id,
        messageId: existingReaction.messageId,
        userId: existingReaction.userId,
        emoji: existingReaction.emoji,
        createdAt: existingReaction.createdAt,
        user: existingReaction.user
      };
    } else {
      // Add new reaction
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      action = 'added';
      reactionData = reaction;
    }

    // Emit WebSocket event for real-time updates
    try {
      const { getChatSocketService } = require('../services/chatSocketService');
      const chatSocketService = getChatSocketService();
      
      chatSocketService.io.to(`conversation_${message.conversationId}`).emit('message_reaction', {
        messageId,
        reaction: reactionData,
        action
      });
    } catch (socketError) {
      await logger.error('Failed to emit WebSocket event', {
        operation: 'chat_emit_websocket',
        error: {
          message: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined
        }
      });
      // Don't fail the request if WebSocket emission fails
    }

    // Create notification for reaction (only when adding, not removing)
    if (action === 'added' && message.senderId !== user.id) {
      try {
        await NotificationService.handleNotification({
          type: 'chat_reaction',
          title: `${user.name} reacted to your message`,
          body: `Reacted with ${emoji}`,
          data: {
            messageId,
            conversationId: message.conversationId,
            emoji,
            senderId: user.id,
            senderName: user.name
          },
          recipients: [message.senderId],
          senderId: user.id
        });
      } catch (notificationError) {
        await logger.error('Failed to create reaction notification', {
          operation: 'chat_create_reaction_notification',
          error: {
            message: notificationError instanceof Error ? notificationError.message : 'Unknown error',
            stack: notificationError instanceof Error ? notificationError.stack : undefined
          }
        });
        // Don't fail the reaction if notification fails
      }
    }

    res.json({ 
      success: true, 
      data: reactionData, 
      action 
    });
  } catch (error) {
    await handleError(res, error, 'Failed to add reaction');
  }
};

// Read Receipts

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { messageId } = req.params;

    // Verify message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        deletedAt: null
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: user.id,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.conversation.participants.length === 0) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if read receipt already exists
    const existingReceipt = await prisma.readReceipt.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: user.id
        }
      }
    });

    if (existingReceipt) {
      res.json({ success: true, data: existingReceipt });
    } else {
      const receipt = await prisma.readReceipt.create({
        data: {
          messageId,
          userId: user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({ success: true, data: receipt });
    }
  } catch (error) {
    await handleError(res, error, 'Failed to mark message as read');
  }
};

// Threads

export const getThreads = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.params;

    // Verify user has access to conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const threads = await prisma.thread.findMany({
      where: {
        conversationId,
        participants: {
          some: {
            userId: user.id,
            isActive: true
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    res.json({ success: true, data: threads });
  } catch (error) {
    await handleError(res, error, 'Failed to fetch threads');
  }
};

export const createThread = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId, name, type = 'MESSAGE', parentId, participantIds = [] }: CreateThreadRequest = req.body;

    // Verify user has access to conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
        isActive: true
      }
    });

    if (!participant) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Verify parent thread access if parentId is provided
    if (parentId) {
      const parentThread = await prisma.thread.findFirst({
        where: {
          id: parentId,
          conversationId,
          participants: {
            some: {
              userId: user.id,
              isActive: true
            }
          }
        }
      });

      if (!parentThread) {
        return res.status(404).json({ success: false, error: 'Parent thread not found' });
      }
    }

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([user.id, ...participantIds])];

    const thread = await prisma.thread.create({
      data: {
        conversationId,
        name,
        type,
        parentId,
        participants: {
          create: allParticipantIds.map((participantId, index) => ({
            userId: participantId,
            role: index === 0 ? 'OWNER' : 'MEMBER'
          }))
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
        }
      }
    });

    res.status(201).json({ success: true, data: thread });
  } catch (error) {
    await handleError(res, error, 'Failed to create thread');
  }
}; 

// Analytics and Activity Tracking
export const getChatAnalytics = async (req: Request, res: Response) => {
  try {
    const { dashboardId, startDate, endDate, userId } = req.query;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Build date filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
    }

    // Get conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
            isActive: true
          }
        },
        ...(dashboardId && { dashboardId: dashboardId as string }),
        ...dateFilter
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, email: true }
            },
            reactions: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            readReceipts: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    // Calculate analytics
    const analytics = {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
      totalReactions: conversations.reduce((sum, conv) => 
        sum + conv.messages.reduce((msgSum, msg) => msgSum + msg.reactions.length, 0), 0
      ),
      averageMessagesPerConversation: conversations.length > 0 
        ? Math.round(conversations.reduce((sum, conv) => sum + conv.messages.length, 0) / conversations.length * 100) / 100
        : 0,
      mostActiveConversations: conversations
        .map(conv => ({
          id: conv.id,
          name: conv.name || 'Direct Message',
          messageCount: conv.messages.length,
          lastActivity: conv.messages.length > 0 ? conv.messages[0].createdAt : conv.createdAt
        }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5),
      messageActivityByDay: await getMessageActivityByDay(user.id, startDate as string, endDate as string),
      topReactors: await getTopReactors(user.id, startDate as string, endDate as string),
      responseTimeStats: await getResponseTimeStats(user.id, startDate as string, endDate as string)
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    await logger.error('Failed to get chat analytics', {
      operation: 'chat_get_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Failed to get chat analytics' });
  }
};

// Helper function to get message activity by day
async function getMessageActivityByDay(userId: string, startDate?: string, endDate?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.lte = new Date(endDate);
  }

  const messages = await prisma.message.findMany({
    where: {
      conversation: {
        participants: {
          some: {
            userId: userId,
            isActive: true
          }
        }
      },
      ...dateFilter
    },
    select: {
      createdAt: true
    }
  });

  // Group by day
  const activityByDay: Record<string, number> = {};
  messages.forEach(message => {
    const day = message.createdAt.toISOString().split('T')[0];
    activityByDay[day] = (activityByDay[day] || 0) + 1;
  });

  return Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Helper function to get top reactors
async function getTopReactors(userId: string, startDate?: string, endDate?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.lte = new Date(endDate);
  }

  const reactions = await prisma.messageReaction.findMany({
    where: {
      message: {
        conversation: {
          participants: {
            some: {
              userId: userId,
              isActive: true
            }
          }
        }
      },
      ...dateFilter
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  // Group by user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userReactions: Record<string, { user: any; count: number }> = {};
  reactions.forEach(reaction => {
    const userId = reaction.user.id;
    if (!userReactions[userId]) {
      userReactions[userId] = { user: reaction.user, count: 0 };
    }
    userReactions[userId].count++;
  });

  return Object.values(userReactions)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Helper function to get response time statistics
async function getResponseTimeStats(userId: string, startDate?: string, endDate?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.lte = new Date(endDate);
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: userId,
          isActive: true
        }
      },
      ...dateFilter
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true }
          }
        }
      }
    }
  });

  const responseTimes: number[] = [];

  conversations.forEach(conversation => {
    const messages = conversation.messages;
    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];
      
      // If previous message was from someone else and current is from user
      if (prevMessage.sender.id !== userId && currentMessage.sender.id === userId) {
        const responseTime = currentMessage.createdAt.getTime() - prevMessage.createdAt.getTime();
        responseTimes.push(responseTime);
      }
    }
  });

  if (responseTimes.length === 0) {
    return {
      averageResponseTime: 0,
      medianResponseTime: 0,
      fastestResponse: 0,
      slowestResponse: 0
    };
  }

  responseTimes.sort((a, b) => a - b);
  const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const median = responseTimes[Math.floor(responseTimes.length / 2)];

  return {
    averageResponseTime: Math.round(average / 1000 / 60), // in minutes
    medianResponseTime: Math.round(median / 1000 / 60), // in minutes
    fastestResponse: Math.round(responseTimes[0] / 1000 / 60), // in minutes
    slowestResponse: Math.round(responseTimes[responseTimes.length - 1] / 1000 / 60) // in minutes
  };
} 