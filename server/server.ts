import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger, requestLogger } from './utils/logger';
import { WebSocketService } from './services/websocketService';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import folderRoutes from './routes/folders';
import fileRoutes from './routes/files';
import accessRoutes from './routes/access';
import activityRoutes from './routes/activities';
import publicRoutes from './routes/public';
import oauthRoutes from './routes/oauth';
import oauthConsentRoutes from './routes/oauth-consent';
import chatRoutes from './routes/chat';
import threadRoutes from './routes/threads';
import notificationRoutes from './routes/notifications';
import threadAnalyticsRoutes from './routes/threadAnalytics';
import threadPresenceRoutes from './routes/threadPresence';
import threadManagementRoutes from './routes/threadManagement';
import threadSearchRoutes from './routes/threadSearch';
import threadOrganizationRoutes from './routes/threadOrganization';
import threadCollaborationRoutes from './routes/threadCollaboration';
import threadAnalyticsDashboardRoutes from './routes/threadAnalyticsDashboard';
import threadActivityRoutes from './routes/threadActivity';
import threadActivityNotificationRoutes from './routes/threadActivityNotification';
import threadRecommendationRoutes from './routes/threadRecommendation';
import threadActivityExportRoutes from './routes/threadActivityExport';
import threadActivityVisualizationRoutes from './routes/threadActivityVisualization';
import threadActivitySchedulerRoutes from './routes/threadActivityScheduler';
import threadActivityAnalyticsRoutes from './routes/threadActivityAnalytics';
import threadActivityInsightsRoutes from './routes/threadActivityInsights';
import fileReferenceRoutes from './routes/fileReferences';
import filePermissionRoutes from './routes/filePermissions';
import { startAutoCleanup } from './cron/autoCleanup';

// Load and validate environment variables
dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'CLIENT_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Handle database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000
});

// Initialize WebSocket service
WebSocketService.getInstance(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/me', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/activities', activityRoutes);
app.use('/public', publicRoutes);
app.use('/oauth', oauthRoutes);
app.use('/oauth', oauthConsentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/thread-analytics', threadAnalyticsRoutes);
app.use('/api/thread-presence', threadPresenceRoutes);
app.use('/api/thread-management', threadManagementRoutes);
app.use('/api/thread-search', threadSearchRoutes);
app.use('/api/thread-organization', threadOrganizationRoutes);
app.use('/api/thread-collaboration', threadCollaborationRoutes);
app.use('/api/thread-analytics-dashboard', threadAnalyticsDashboardRoutes);
app.use('/api/thread-activity', threadActivityRoutes);
app.use('/api/thread-activity-notifications', threadActivityNotificationRoutes);
app.use('/api/thread-recommendations', threadRecommendationRoutes);
app.use('/api/thread-activity-exports', threadActivityExportRoutes);
app.use('/api/thread-activity-visualizations', threadActivityVisualizationRoutes);
app.use('/api/thread-activity-scheduler', threadActivitySchedulerRoutes);
app.use('/api/thread-activity-analytics', threadActivityAnalyticsRoutes);
app.use('/api/thread-activity-insights', threadActivityInsightsRoutes);
app.use('/api/file-references', fileReferenceRoutes);
app.use('/api/files', filePermissionRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Block on Block API up and running 🚀');
});

// Debug route to check cookies
app.get('/debug/cookies', (req, res) => {
  res.json({ cookies: req.cookies });
});

interface SocketData {
  folderId?: string;
  conversationId?: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface ClientToServerEvents {
  'join': (folderId: string) => void;
  'join:root': () => void;
  'presence:join': (data: { folderId: string; user: SocketData['user'] }) => void;
  'leave': (folderId: string) => void;
  'chat:join': (conversationId: string) => void;
  'chat:leave': (conversationId: string) => void;
  'chat:message': (data: { conversationId: string; content: string }) => void;
  'chat:typing': (data: { conversationId: string; isTyping: boolean }) => void;
  'error': (error: Error) => void;
  'reconnect_attempt': (attemptNumber: number) => void;
}

interface ServerToClientEvents {
  'error': (error: { message: string }) => void;
  'presence:update': (users: SocketData['user'][]) => void;
  'chat:presence:update': (users: SocketData['user'][]) => void;
  'chat:message': (data: { conversationId: string; content: string; sender: SocketData['user'] }) => void;
  'chat:typing': (data: { conversationId: string; user: SocketData['user']; isTyping: boolean }) => void;
  'chat:error': (error: { message: string }) => void;
}

interface FolderPresence {
  socketId: string;
  user: SocketData['user'];
}

interface ChatPresence {
  socketId: string;
  user: SocketData['user'];
}

// Socket.IO folder join/leave + logs
const folderPresence: Record<string, FolderPresence[]> = {};
const chatPresence: Record<string, ChatPresence[]> = {};

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, SocketData>) => {
  logger.info('🟢 Socket connected:', socket.id);

  // Handle connection errors
  socket.on('error', (error: Error) => {
    logger.error('Socket error:', error);
  });

  // Handle reconnection attempts
  socket.on('reconnect_attempt', (attemptNumber: number) => {
    logger.info(`Socket ${socket.id} attempting to reconnect (attempt ${attemptNumber})`);
  });

  socket.on('join', (folderId: string) => {
    try {
      const room = `folder:${folderId}`;
      
      if (!socket.rooms.has(room)) {
        socket.join(room);
        socket.data.folderId = folderId;

        if (!folderPresence[folderId]) folderPresence[folderId] = [];
        logger.debug(`🗂️ Socket ${socket.id} joined ${room}`);
      }
    } catch (error) {
      logger.error('Error in join event:', error);
      socket.emit('error', { message: 'Failed to join folder' });
    }
  });

  socket.on('join:root', () => {
    try {
      socket.join('folder:root');
      logger.debug(`🗂️ Socket ${socket.id} joined folder:root`);
    } catch (error) {
      logger.error('Error in join:root event:', error);
      socket.emit('error', { message: 'Failed to join root folder' });
    }
  });

  socket.on('presence:join', ({ folderId, user }: { folderId: string; user: SocketData['user'] }) => {
    try {
      const room = `folder:${folderId}`;
      if (!folderPresence[folderId]) folderPresence[folderId] = [];

      const existingPresence = folderPresence[folderId].find(p => p.socketId === socket.id);
      if (!existingPresence) {
        folderPresence[folderId].push({ socketId: socket.id, user });
        socket.data.user = user;
        io.to(room).emit('presence:update', getUsersInFolder(folderId));
      }
    } catch (error) {
      logger.error('Error in presence:join event:', error);
      socket.emit('error', { message: 'Failed to update presence' });
    }
  });

  socket.on('leave', (folderId: string) => {
    try {
      const room = `folder:${folderId}`;
      if (socket.rooms.has(room)) {
        socket.leave(room);
        folderPresence[folderId] = (folderPresence[folderId] || []).filter(
          (entry) => entry.socketId !== socket.id
        );
        io.to(room).emit('presence:update', getUsersInFolder(folderId));
      }
    } catch (error) {
      logger.error('Error in leave event:', error);
      socket.emit('error', { message: 'Failed to leave folder' });
    }
  });

  // Chat-specific events with error handling
  socket.on('chat:join', (conversationId: string) => {
    try {
      const room = `chat:${conversationId}`;
      
      if (!socket.rooms.has(room)) {
        socket.join(room);
        socket.data.conversationId = conversationId;

        if (!chatPresence[conversationId]) chatPresence[conversationId] = [];
        logger.debug(`💬 Socket ${socket.id} joined ${room}`);
      }
    } catch (error) {
      logger.error('Error in chat:join event:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  socket.on('chat:leave', (conversationId: string) => {
    try {
      const room = `chat:${conversationId}`;
      if (socket.rooms.has(room)) {
        socket.leave(room);
        chatPresence[conversationId] = (chatPresence[conversationId] || []).filter(
          (entry) => entry.socketId !== socket.id
        );
        io.to(room).emit('chat:presence:update', getUsersInChat(conversationId));
      }
    } catch (error) {
      logger.error('Error in chat:leave event:', error);
      socket.emit('error', { message: 'Failed to leave chat' });
    }
  });

  socket.on('chat:message', async ({ conversationId, content }: { conversationId: string; content: string }) => {
    try {
      if (!socket.data.user) {
        throw new Error('User not authenticated');
      }

      const message = await prisma.message.create({
        data: {
          content,
          conversationId,
          senderId: socket.data.user.id,
          type: 'text'
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      io.to(`chat:${conversationId}`).emit('chat:message', {
        conversationId,
        content: message.content,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatarUrl: message.sender.avatarUrl
        }
      });
    } catch (error) {
      logger.error('Error in chat:message event:', error);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  socket.on('chat:typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
    try {
      if (!socket.data.user) {
        throw new Error('User not authenticated');
      }

      io.to(`chat:${conversationId}`).emit('chat:typing', {
        conversationId,
        user: socket.data.user,
        isTyping
      });
    } catch (error) {
      logger.error('Error in chat:typing event:', error);
      socket.emit('chat:error', { message: 'Failed to update typing status' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('🔴 Socket disconnected:', socket.id);
    
    // Clean up folder presence
    Object.keys(folderPresence).forEach(folderId => {
      folderPresence[folderId] = folderPresence[folderId].filter(
        entry => entry.socketId !== socket.id
      );
      io.to(`folder:${folderId}`).emit('presence:update', getUsersInFolder(folderId));
    });

    // Clean up chat presence
    Object.keys(chatPresence).forEach(conversationId => {
      chatPresence[conversationId] = chatPresence[conversationId].filter(
        entry => entry.socketId !== socket.id
      );
      io.to(`chat:${conversationId}`).emit('chat:presence:update', getUsersInChat(conversationId));
    });
  });
});

function getUsersInFolder(folderId: string): FolderPresence['user'][] {
  return (folderPresence[folderId] || []).map(p => p.user);
}

function getUsersInChat(conversationId: string): ChatPresence['user'][] {
  return (chatPresence[conversationId] || []).map(p => p.user);
}

// Start the server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start the HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Client URL: ${process.env.CLIENT_URL}`);
    });

    // Handle server errors
    httpServer.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Fatal error during server startup:', error);
  process.exit(1);
});

export { app, httpServer }; 