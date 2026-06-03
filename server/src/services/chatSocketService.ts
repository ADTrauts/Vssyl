import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/tokenUtils';
import { logger } from '../lib/logger';
import { ChatServiceError } from './chat/chatErrors';

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

interface AuthenticatedSocketData {
  user: AuthenticatedSocket;
}

interface SocketWithData extends Socket {
  data: AuthenticatedSocketData;
}

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export class ChatSocketService {
  private io: SocketIOServer;
  /** socketId -> authenticated user (supports multiple sockets per user) */
  private socketUsers: Map<string, AuthenticatedSocket> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
              cors: {
          origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowed = [
          process.env.FRONTEND_URL || 'https://vssyl.com',
          'https://vssyl.com',
          'https://vssyl-web-235369681725.us-central1.run.app', // Cloud Run web service
          'wss://vssyl.com', // WebSocket origin
          'wss://vssyl-web-235369681725.us-central1.run.app', // WebSocket origin
          'http://localhost:3000', // Dev: browser Origin from Next.js
          'http://localhost:3002', // Dev: alternate Next.js port
          'ws://localhost:3000', // Development WebSocket
          'ws://localhost:3002' // Development WebSocket
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
          await logger.warn('Socket auth failed: No token provided', {
            operation: 'socket_auth_no_token'
          });
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
          await logger.warn('Socket auth failed: Invalid token', {
            operation: 'socket_auth_invalid_token'
          });
          return next(new Error('Authentication error: Invalid token'));
        }

        // Get user details from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true }
        });

        if (!user) {
          await logger.warn('Socket auth failed: User not found', {
            operation: 'socket_auth_user_not_found',
            userId: decoded.userId
          });
          return next(new Error('Authentication error: User not found'));
        }

        socket.data.user = {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || undefined
        };

        next();
      } catch (error) {
        await logger.error('Socket auth error', {
          operation: 'socket_auth_error',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        next(new Error('Authentication error: ' + error));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as AuthenticatedSocket;
      
      logger.info('User connected to socket', {
        operation: 'socket_user_connected',
        userId: user.userId,
        userEmail: user.userEmail
      });
      
      this.socketUsers.set(socket.id, user);

      // Per-user room: all tabs for this user receive user-targeted events (notifications, drive, etc.)
      void socket.join(`user_${user.userId}`);

      // Add a reference to the io server on the socket for external use
      socket.data.io = this.io;

      // Join user to their conversations
      void this.joinUserToConversations(socket, user.userId);

      // Handle conversation join
      socket.on('join_conversation', (conversationId: string) => {
        void this.joinConversationIfMember(socket, conversationId);
      });

      // Handle conversation leave
      socket.on('leave_conversation', (conversationId: string) => {
        this.leaveConversation(socket, conversationId);
      });

      // Handle typing events
      socket.on('typing_start', (data: TypingEvent) => {
        void this.handleTypingStartGuarded(socket, data);
      });

      socket.on('typing_stop', (data: TypingEvent) => {
        void this.handleTypingStopGuarded(socket, data);
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
        void this.handlePresenceUpdate(socket, data);
      });

      // Handle scheduling room joins (tenant-checked; do not trust client-supplied ids alone)
      socket.on('join_business', (businessId: string) => {
        void this.joinBusinessRoomIfMember(socket, businessId);
      });

      socket.on('join_schedule', (scheduleId: string) => {
        void this.joinScheduleRoomIfMember(socket, scheduleId);
      });

      socket.on('leave_schedule', (scheduleId: string) => {
        socket.leave(`schedule_${scheduleId}`);
        logger.debug('User left schedule room', {
          operation: 'socket_leave_schedule',
          scheduleId,
          userId: user.userId
        });
      });

      socket.on('leave_business', (businessId: string) => {
        socket.leave(`business_${businessId}`);
        logger.debug('User left business room', {
          operation: 'socket_leave_business',
          businessId,
          userId: user.userId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /** Active conversations the user participates in (for room join + scoped presence). */
  private async getActiveConversationIdsForUser(userId: string): Promise<string[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      select: { id: true },
    });
    return conversations.map((c) => c.id);
  }

  private async joinUserToConversations(socket: SocketWithData, userId: string) {
    try {
      const ids = await this.getActiveConversationIdsForUser(userId);
      await Promise.all(ids.map((id) => socket.join(`conversation_${id}`)));

      await logger.info('User joined conversations', {
        operation: 'socket_user_joined_conversations',
        userId,
        count: ids.length,
      });
    } catch (error) {
      await logger.error('Failed to join user to conversations', {
        operation: 'socket_join_conversations_error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  }

  private async assertActiveConversationMember(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });
    return !!participant;
  }

  /** Returns conversationId if the user is an active participant of the message's conversation; otherwise null. */
  private async assertMessageConversationMember(
    messageId: string,
    userId: string
  ): Promise<string | null> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });
    if (!message) {
      return null;
    }
    const allowed = await this.assertActiveConversationMember(message.conversationId, userId);
    return allowed ? message.conversationId : null;
  }

  private async joinConversationIfMember(socket: SocketWithData, conversationId: string) {
    if (!conversationId || typeof conversationId !== 'string') {
      return;
    }
    const user = socket.data.user as AuthenticatedSocket;
    try {
      const allowed = await this.assertActiveConversationMember(conversationId, user.userId);
      if (!allowed) {
        socket.emit('error', { message: 'Cannot join conversation' });
        return;
      }
      socket.join(`conversation_${conversationId}`);
      logger.debug('User joined conversation', {
        operation: 'socket_join_conversation',
        conversationId,
        userId: user.userId,
      });
    } catch (error: unknown) {
      await logger.error('join_conversation failed', {
        operation: 'socket_join_conversation_error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      socket.emit('error', { message: 'Cannot join conversation' });
    }
  }

  private leaveConversation(socket: SocketWithData, conversationId: string) {
    socket.leave(`conversation_${conversationId}`);
    logger.debug('User left conversation', {
      operation: 'socket_leave_conversation',
      conversationId
    });
  }

  private async handleTypingStartGuarded(socket: SocketWithData, data: TypingEvent) {
    const user = socket.data.user as AuthenticatedSocket;
    if (!data?.conversationId || typeof data.conversationId !== 'string') {
      return;
    }
    const ok = await this.assertActiveConversationMember(data.conversationId, user.userId);
    if (!ok) {
      socket.emit('error', { message: 'Not a member of this conversation' });
      return;
    }

    if (!this.typingUsers.has(data.conversationId)) {
      this.typingUsers.set(data.conversationId, new Set());
    }

    this.typingUsers.get(data.conversationId)!.add(user.userId);

    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.userId,
      userName: user.userName,
      isTyping: true,
    });
  }

  private async handleTypingStopGuarded(socket: SocketWithData, data: TypingEvent) {
    const user = socket.data.user as AuthenticatedSocket;
    if (!data?.conversationId || typeof data.conversationId !== 'string') {
      return;
    }
    const ok = await this.assertActiveConversationMember(data.conversationId, user.userId);
    if (!ok) {
      return;
    }

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
      isTyping: false,
    });
  }

  /** @returns whether the socket joined the room */
  private async joinBusinessRoomIfMember(socket: SocketWithData, businessId: string): Promise<boolean> {
    const user = socket.data.user as AuthenticatedSocket;
    if (!businessId || typeof businessId !== 'string') {
      return false;
    }
    try {
      const member = await prisma.businessMember.findFirst({
        where: {
          businessId,
          userId: user.userId,
          isActive: true,
        },
      });
      if (!member) {
        socket.emit('error', { message: 'Cannot join business room' });
        return false;
      }
      socket.join(`business_${businessId}`);
      logger.debug('User joined business room', {
        operation: 'socket_join_business',
        businessId,
        userId: user.userId,
      });
      return true;
    } catch (error: unknown) {
      await logger.error('join_business failed', {
        operation: 'socket_join_business_error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      socket.emit('error', { message: 'Cannot join business room' });
      return false;
    }
  }

  /** @returns whether the socket joined the room */
  private async joinScheduleRoomIfMember(socket: SocketWithData, scheduleId: string): Promise<boolean> {
    const user = socket.data.user as AuthenticatedSocket;
    if (!scheduleId || typeof scheduleId !== 'string') {
      return false;
    }
    try {
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { businessId: true },
      });
      if (!schedule) {
        socket.emit('error', { message: 'Schedule not found' });
        return false;
      }
      const member = await prisma.businessMember.findFirst({
        where: {
          businessId: schedule.businessId,
          userId: user.userId,
          isActive: true,
        },
      });
      if (!member) {
        socket.emit('error', { message: 'Cannot join schedule room' });
        return false;
      }
      socket.join(`schedule_${scheduleId}`);
      logger.debug('User joined schedule room', {
        operation: 'socket_join_schedule',
        scheduleId,
        userId: user.userId,
      });
      return true;
    } catch (error: unknown) {
      await logger.error('join_schedule failed', {
        operation: 'socket_join_schedule_error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      socket.emit('error', { message: 'Cannot join schedule room' });
      return false;
    }
  }

  private async handleNewMessage(socket: SocketWithData, message: ChatMessage) {
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

      await logger.info('Message broadcasted in conversation', {
        operation: 'socket_message_broadcasted',
        conversationId: message.conversationId
      });
    } catch (error) {
      await logger.error('Failed to handle new message', {
        operation: 'socket_handle_new_message',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageReaction(socket: SocketWithData, data: { messageId: string; emoji: string }) {
    const user = socket.data.user as AuthenticatedSocket;

    try {
      if (!data?.messageId || typeof data.messageId !== 'string' || !data?.emoji || typeof data.emoji !== 'string') {
        socket.emit('error', { message: 'Invalid reaction payload' });
        return;
      }

      const { toggleReaction } = await import('./chatMessageService.js');

      await toggleReaction({
        userId: user.userId,
        actorName: user.userName?.trim() || user.userEmail?.split('@')[0] || 'Someone',
        messageId: data.messageId,
        emoji: data.emoji,
      });
    } catch (error) {
      if (error instanceof ChatServiceError) {
        socket.emit('error', { message: error.message });
        return;
      }
      await logger.error('Failed to handle message reaction', {
        operation: 'socket_handle_reaction',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  }

  private async handleMarkAsRead(socket: SocketWithData, messageId: string) {
    const user = socket.data.user as AuthenticatedSocket;

    try {
      if (!messageId || typeof messageId !== 'string') {
        socket.emit('error', { message: 'Invalid message id' });
        return;
      }

      const { markAsRead } = await import('./chatMessageService.js');

      await markAsRead({
        userId: user.userId,
        messageId,
      });
    } catch (error) {
      if (error instanceof ChatServiceError) {
        socket.emit('error', { message: error.message });
        return;
      }
      await logger.error('Failed to handle mark as read', {
        operation: 'socket_handle_mark_read',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  }

  /**
   * Presence is scoped to conversation rooms the user belongs to (not global io.emit).
   * Uses socket.to(room) so the emitting socket does not receive its own event.
   */
  private async handlePresenceUpdate(socket: SocketWithData, data: PresenceEvent) {
    const user = socket.data.user as AuthenticatedSocket;

    const payload = {
      userId: user.userId,
      userName: user.userName,
      status: data.status,
      lastSeen: data.lastSeen,
    };

    try {
      const conversationIds = await this.getActiveConversationIdsForUser(user.userId);
      for (const cid of conversationIds) {
        socket.to(`conversation_${cid}`).emit('user_presence', payload);
      }
    } catch (error: unknown) {
      const err = error as Error;
      await logger.error('Failed to broadcast presence update', {
        operation: 'socket_presence_broadcast',
        error: {
          message: err.message,
          stack: err.stack,
        },
      });
    }
  }

  private handleDisconnect(socket: SocketWithData) {
    const user = this.socketUsers.get(socket.id);
    if (user) {
      this.socketUsers.delete(socket.id);
      logger.info('User disconnected from socket', {
        operation: 'socket_user_disconnected',
        userId: user.userId,
        userEmail: user.userEmail
      });

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
  public broadcastMessage(conversationId: string, message: Record<string, unknown>) {
    this.io.to(`conversation_${conversationId}`).emit('message_received', message);
  }

  public broadcastMessageReaction(
    conversationId: string,
    payload: { messageId: string; reaction: Record<string, unknown> | null; action: 'added' | 'removed' }
  ) {
    this.io.to(`conversation_${conversationId}`).emit('message_reaction', payload);
  }

  public broadcastReadReceipt(
    conversationId: string,
    payload: { messageId: string; readReceipt: Record<string, unknown> }
  ) {
    this.io.to(`conversation_${conversationId}`).emit('message_read', payload);
  }

  public broadcastToUser(userId: string, event: string, data: Record<string, unknown>) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  public broadcastNotification(userId: string, notification: NotificationEvent) {
    this.io.to(`user_${userId}`).emit('new_notification', notification);
  }

  public broadcastNotificationToMultipleUsers(userIds: string[], notification: NotificationEvent) {
    userIds.forEach(userId => {
      this.broadcastNotification(userId, notification);
    });
  }

  public broadcastNotificationUpdate(userId: string, notificationId: string, updates: Record<string, unknown>) {
    this.io.to(`user_${userId}`).emit('notification_updated', {
      id: notificationId,
      ...updates,
    });
  }

  public broadcastNotificationDelete(userId: string, notificationId: string) {
    this.io.to(`user_${userId}`).emit('notification_deleted', { id: notificationId });
  }

  public getConnectedUsers(): string[] {
    const ids = new Set<string>();
    for (const u of this.socketUsers.values()) {
      ids.add(u.userId);
    }
    return Array.from(ids);
  }

  // ============================================================================
  // DRIVE MODULE BROADCASTS
  // ============================================================================

  /**
   * Broadcast a drive event to a specific user.
   * Used for real-time updates in the Drive module (file/folder changes).
   */
  public broadcastDriveEvent(
    userId: string,
    event: 'drive:item:created' | 'drive:item:updated' | 'drive:item:deleted' | 'drive:item:moved' | 'drive:item:pinned',
    data: Record<string, unknown>
  ) {
    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    this.broadcastToUser(userId, event, payload);
    logger.debug('Drive event broadcasted to user', {
      operation: 'socket_drive_broadcast',
      userId,
      event,
    });
  }

  // ============================================================================
  // SCHEDULING MODULE BROADCASTS
  // ============================================================================

  /**
   * Broadcast scheduling event to all users in a business
   */
  public broadcastToBusiness(businessId: string, event: string, data: Record<string, unknown>) {
    this.io.to(`business_${businessId}`).emit(event, data);
    logger.debug('Scheduling event broadcasted to business', {
      operation: 'socket_scheduling_broadcast',
      businessId,
      event
    });
  }

  /**
   * Broadcast scheduling event to all users viewing a specific schedule
   */
  public broadcastToSchedule(scheduleId: string, event: string, data: Record<string, unknown>) {
    this.io.to(`schedule_${scheduleId}`).emit(event, data);
    logger.debug('Scheduling event broadcasted to schedule', {
      operation: 'socket_scheduling_broadcast',
      scheduleId,
      event
    });
  }

  /**
   * Broadcast shift created event
   */
  public broadcastShiftCreated(businessId: string, scheduleId: string, shift: Record<string, unknown>) {
    const eventData = {
      businessId,
      scheduleId,
      shift,
      timestamp: new Date().toISOString()
    };
    this.broadcastToSchedule(scheduleId, 'schedule:shift:created', eventData);
    this.broadcastToBusiness(businessId, 'schedule:shift:created', eventData);
  }

  /**
   * Broadcast shift updated event
   */
  public broadcastShiftUpdated(businessId: string, scheduleId: string, shift: Record<string, unknown>) {
    const eventData = {
      businessId,
      scheduleId,
      shift,
      timestamp: new Date().toISOString()
    };
    this.broadcastToSchedule(scheduleId, 'schedule:shift:updated', eventData);
    this.broadcastToBusiness(businessId, 'schedule:shift:updated', eventData);
  }

  /**
   * Broadcast shift deleted event
   */
  public broadcastShiftDeleted(businessId: string, scheduleId: string, shiftId: string) {
    const eventData = {
      businessId,
      scheduleId,
      shiftId,
      timestamp: new Date().toISOString()
    };
    this.broadcastToSchedule(scheduleId, 'schedule:shift:deleted', eventData);
    this.broadcastToBusiness(businessId, 'schedule:shift:deleted', eventData);
  }

  /**
   * Broadcast schedule published event
   */
  public broadcastSchedulePublished(businessId: string, scheduleId: string, schedule: Record<string, unknown>) {
    const eventData = {
      businessId,
      scheduleId,
      schedule,
      timestamp: new Date().toISOString()
    };
    this.broadcastToBusiness(businessId, 'schedule:published', eventData);
  }

  /**
   * Join user to business and schedule rooms for scheduling updates (membership-checked).
   */
  public async joinSchedulingRooms(socket: SocketWithData, businessId: string, scheduleId?: string): Promise<void> {
    const joinedBusiness = await this.joinBusinessRoomIfMember(socket, businessId);
    if (!joinedBusiness) {
      return;
    }
    if (scheduleId) {
      await this.joinScheduleRoomIfMember(socket, scheduleId);
    }
  }

  // ============================================================================
  // VSSYL PLACE BROADCASTS
  // ============================================================================

  public broadcastPlaceEvent(
    userId: string,
    event:
      | 'place:node:added'
      | 'place:node:removed'
      | 'place:connection:accepted'
      | 'place:connection:request'
      | 'place:meeting:created'
      | 'place:meeting:updated'
      | 'place:meeting:cancelled'
      | 'place:listing:updated',
    data: Record<string, unknown>
  ) {
    const payload = { ...data, timestamp: new Date().toISOString() };
    this.broadcastToUser(userId, event, payload);
  }

  /**
   * When SOCKET_IO_REDIS_URL or REDIS_URL is set, attach the official Redis adapter so
   * room broadcasts work across multiple server instances (e.g. scaled Cloud Run).
   * If unset or connection fails, the server continues with the default in-memory adapter.
   */
  public async attachRedisAdapterIfConfigured(): Promise<void> {
    const redisUrl = (process.env.SOCKET_IO_REDIS_URL || process.env.REDIS_URL || '').trim();
    if (!redisUrl) {
      await logger.debug('Socket.IO cluster adapter skipped (no SOCKET_IO_REDIS_URL / REDIS_URL)', {
        operation: 'socket_io_adapter_skipped',
      });
      return;
    }

    try {
      const { createClient } = await import('redis');
      const { createAdapter } = await import('@socket.io/redis-adapter');

      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      const logRedisErr = (channel: 'pub' | 'sub', err: Error) => {
        void logger.error('Redis client error (Socket.IO adapter)', {
          operation: 'socket_io_redis_client_error',
          channel,
          error: { message: err.message, stack: err.stack },
        });
      };
      pubClient.on('error', (err: Error) => logRedisErr('pub', err));
      subClient.on('error', (err: Error) => logRedisErr('sub', err));

      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.io.adapter(createAdapter(pubClient, subClient));

      await logger.info('Socket.IO Redis adapter attached for multi-instance broadcasts', {
        operation: 'socket_io_redis_adapter_ready',
      });
    } catch (error: unknown) {
      const err = error as Error;
      await logger.error('Socket.IO Redis adapter failed; continuing with in-memory adapter', {
        operation: 'socket_io_redis_adapter_failed',
        error: { message: err.message, stack: err.stack },
      });
    }
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