import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/tokenUtils';

interface AuthenticatedSocket {
  userId: string;
  userEmail: string;
  userName?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'FILE' | 'SYSTEM' | 'REACTION';
  createdAt: string;
}

interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface PresenceEvent {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: any;
  createdAt: string;
  read: boolean;
}

export class ChatSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, AuthenticatedSocket> = new Map(); // socketId -> user
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          const allowed = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
          ];
          if (!origin || allowed.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS not allowed for origin: ${origin}`));
          }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          console.error('Socket auth failed: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
          console.error('Socket auth failed: Invalid token');
          return next(new Error('Authentication error: Invalid token'));
        }

        // Get user details from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true }
        });

        if (!user) {
          console.error('Socket auth failed: User not found', decoded.userId);
          return next(new Error('Authentication error: User not found'));
        }

        socket.data.user = {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || undefined
        };

        next();
      } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Authentication error: ' + error));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as AuthenticatedSocket;
      
      console.log(`User connected: ${user.userEmail} (${user.userId})`);
      
      // Store socket mappings
      this.userSockets.set(user.userId, socket.id);
      this.socketUsers.set(socket.id, user);

      // Add a reference to the io server on the socket for external use
      socket.data.io = this.io;

      // Join user to their conversations
      this.joinUserToConversations(socket, user.userId);

      // Handle conversation join
      socket.on('join_conversation', (conversationId: string) => {
        this.joinConversation(socket, conversationId);
      });

      // Handle conversation leave
      socket.on('leave_conversation', (conversationId: string) => {
        this.leaveConversation(socket, conversationId);
      });

      // Handle typing events
      socket.on('typing_start', (data: TypingEvent) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: TypingEvent) => {
        this.handleTypingStop(socket, data);
      });

      // Handle new message
      socket.on('new_message', async (message: ChatMessage) => {
        await this.handleNewMessage(socket, message);
      });

      // Handle message reactions
      socket.on('message_reaction', async (data: { messageId: string; emoji: string }) => {
        await this.handleMessageReaction(socket, data);
      });

      // Handle read receipts
      socket.on('mark_read', async (messageId: string) => {
        await this.handleMarkAsRead(socket, messageId);
      });

      // Handle presence updates
      socket.on('presence_update', (data: PresenceEvent) => {
        this.handlePresenceUpdate(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async joinUserToConversations(socket: any, userId: string) {
    try {
      // Get all conversations where user is a participant
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: userId,
              isActive: true
            }
          }
        },
        select: { id: true }
      });

      // Join socket to all conversations
      conversations.forEach((conversation: { id: string }) => {
        socket.join(`conversation_${conversation.id}`);
      });

      // Join user to their personal room for direct messages
      socket.join(`user_${userId}`);

      console.log(`User ${userId} joined ${conversations.length} conversations`);
    } catch (error) {
      console.error('Error joining user to conversations:', error);
    }
  }

  private joinConversation(socket: any, conversationId: string) {
    socket.join(`conversation_${conversationId}`);
    console.log(`User joined conversation: ${conversationId}`);
  }

  private leaveConversation(socket: any, conversationId: string) {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User left conversation: ${conversationId}`);
  }

  private handleTypingStart(socket: any, data: TypingEvent) {
    const user = socket.data.user as AuthenticatedSocket;
    
    if (!this.typingUsers.has(data.conversationId)) {
      this.typingUsers.set(data.conversationId, new Set());
    }
    
    this.typingUsers.get(data.conversationId)!.add(user.userId);
    
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.userId,
      userName: user.userName,
      isTyping: true
    });
  }

  private handleTypingStop(socket: any, data: TypingEvent) {
    const user = socket.data.user as AuthenticatedSocket;
    
    const typingSet = this.typingUsers.get(data.conversationId);
    if (typingSet) {
      typingSet.delete(user.userId);
      if (typingSet.size === 0) {
        this.typingUsers.delete(data.conversationId);
      }
    }
    
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.userId,
      userName: user.userName,
      isTyping: false
    });
  }

  private async handleNewMessage(socket: any, message: ChatMessage) {
    const user = socket.data.user as AuthenticatedSocket;
    
    try {
      // Verify user is part of the conversation
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: message.conversationId,
          userId: user.userId,
          isActive: true
        }
      });

      if (!participant) {
        socket.emit('error', { message: 'Not a member of this conversation' });
        return;
      }

      // Broadcast message to conversation
      this.io.to(`conversation_${message.conversationId}`).emit('message_received', {
        ...message,
        sender: {
          id: user.userId,
          name: user.userName,
          email: user.userEmail
        }
      });

      // Update conversation's last message timestamp
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: { lastMessageAt: new Date() }
      });

      console.log(`Message broadcasted in conversation ${message.conversationId}`);
    } catch (error) {
      console.error('Error handling new message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageReaction(socket: any, data: { messageId: string; emoji: string }) {
    const user = socket.data.user as AuthenticatedSocket;
    
    try {
      // Save reaction to database
      const reaction = await prisma.messageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId: data.messageId,
            userId: user.userId,
            emoji: data.emoji
          }
        },
        update: {
          emoji: data.emoji
        },
        create: {
          messageId: data.messageId,
          userId: user.userId,
          emoji: data.emoji
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Get message to find conversation
      const message = await prisma.message.findUnique({
        where: { id: data.messageId },
        select: { conversationId: true }
      });

      if (message) {
        // Broadcast reaction to conversation
        this.io.to(`conversation_${message.conversationId}`).emit('message_reaction', {
          messageId: data.messageId,
          reaction: {
            id: reaction.id,
            messageId: reaction.messageId,
            userId: reaction.userId,
            emoji: reaction.emoji,
            createdAt: reaction.createdAt,
            user: reaction.user
          }
        });
      }
    } catch (error) {
      console.error('Error handling message reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  }

  private async handleMarkAsRead(socket: any, messageId: string) {
    const user = socket.data.user as AuthenticatedSocket;
    
    try {
      // Save read receipt to database
      const readReceipt = await prisma.readReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: messageId,
            userId: user.userId
          }
        },
        update: {
          readAt: new Date()
        },
        create: {
          messageId: messageId,
          userId: user.userId,
          readAt: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Get message to find conversation
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true }
      });

      if (message) {
        // Broadcast read receipt to conversation
        this.io.to(`conversation_${message.conversationId}`).emit('message_read', {
          messageId: messageId,
          readReceipt: {
            id: readReceipt.id,
            messageId: readReceipt.messageId,
            userId: readReceipt.userId,
            readAt: readReceipt.readAt,
            user: readReceipt.user
          }
        });
      }
    } catch (error) {
      console.error('Error handling mark as read:', error);
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  }

  private handlePresenceUpdate(socket: any, data: PresenceEvent) {
    const user = socket.data.user as AuthenticatedSocket;
    
    // Broadcast presence update to all connected users
    this.io.emit('user_presence', {
      userId: user.userId,
      userName: user.userName,
      status: data.status,
      lastSeen: data.lastSeen
    });
  }

  private handleDisconnect(socket: any) {
    const user = this.socketUsers.get(socket.id);
    if (user) {
      this.userSockets.delete(user.userId);
      this.socketUsers.delete(socket.id);
      console.log(`User disconnected: ${user.userEmail} (${user.userId})`);

      // Clean up typing status
      this.typingUsers.forEach((users, conversationId) => {
        if (users.has(user.userId)) {
          users.delete(user.userId);
          this.io.to(`conversation_${conversationId}`).emit('user_typing', {
            conversationId: conversationId,
            userId: user.userId,
            userName: user.userName,
            isTyping: false
          });
        }
      });
    }
  }

  // Public methods for external use
  public broadcastMessage(conversationId: string, message: any) {
    this.io.to(`conversation_${conversationId}`).emit('message_received', message);
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public broadcastNotification(userId: string, notification: NotificationEvent) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
    }
  }

  public broadcastNotificationToMultipleUsers(userIds: string[], notification: NotificationEvent) {
    userIds.forEach(userId => {
      this.broadcastNotification(userId, notification);
    });
  }

  public broadcastNotificationUpdate(userId: string, notificationId: string, updates: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification_updated', {
        id: notificationId,
        ...updates
      });
    }
  }

  public broadcastNotificationDelete(userId: string, notificationId: string) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification_deleted', { id: notificationId });
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

let chatSocketServiceInstance: ChatSocketService;

export const initializeChatSocketService = (server: HTTPServer): ChatSocketService => {
  if (!chatSocketServiceInstance) {
    chatSocketServiceInstance = new ChatSocketService(server);
  }
  return chatSocketServiceInstance;
};

export const getChatSocketService = (): ChatSocketService => {
  if (!chatSocketServiceInstance) {
    throw new Error("ChatSocketService has not been initialized. Call initializeChatSocketService first.");
  }
  return chatSocketServiceInstance;
}; 