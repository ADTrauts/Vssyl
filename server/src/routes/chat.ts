import express from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  getMessages,
  createMessage,
  addReaction,
  markAsRead,
  getThreads,
  createThread,
  searchUsersForChat,
  getChatAnalytics
} from '../controllers/chatController';
import {
  getRecentConversationsContext,
  getUnreadMessagesContext,
  getConversationHistory
} from '../controllers/chatAIContextController';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();

// Conversation routes
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations', createConversation);

// Message routes
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', createMessage);

// Reaction routes
router.post('/messages/:messageId/reactions', addReaction);

// Read receipts
router.post('/messages/read', markAsRead);

// Thread routes
router.get('/conversations/:conversationId/threads', getThreads);
router.post('/conversations/:conversationId/threads', createThread);

// Enhanced user search for chat with connection status
router.get('/users/search', searchUsersForChat);

// Analytics routes
router.get('/analytics', getChatAnalytics);

// AI Context Provider Endpoints
router.get('/ai/context/recent', authenticateJWT, getRecentConversationsContext);
router.get('/ai/context/unread', authenticateJWT, getUnreadMessagesContext);
router.get('/ai/query/history', authenticateJWT, getConversationHistory);

export default router; 