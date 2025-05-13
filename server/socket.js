import { Server } from 'socket.io';
import { authenticateToken } from './middleware/auth.js';

export function createSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Socket middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const user = authenticateToken(token);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.id);

    // Join conversation room
    socket.on('chat:join', (conversationId) => {
      socket.join(`chat:${conversationId}`);
    });

    // Leave conversation room
    socket.on('chat:leave', (conversationId) => {
      socket.leave(`chat:${conversationId}`);
    });

    // Handle new messages
    socket.on('chat:message', ({ conversationId, message }) => {
      io.to(`chat:${conversationId}`).emit('chat:message', {
        ...message,
        conversationId,
      });
    });

    // Handle typing indicators
    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`chat:${conversationId}`).emit('chat:typing', {
        userId: socket.user.id,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
    });
  });

  return io;
} 