import express from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validateRequest';
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
  getChatAnalytics,
} from '../controllers/chatController';
import {
  getRecentConversationsContext,
  getUnreadMessagesContext,
  getConversationHistory,
} from '../controllers/chatAIContextController';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();

const conversationIdParam = validate([param('conversationId').isUUID()]);
const conversationByIdParam = validate([param('id').isUUID()]);
const messageIdParam = validate([param('messageId').isUUID()]);
const addReactionBody = validate([body('emoji').isString().notEmpty()]);

const createConversationBody = validate([
  body('type').isIn(['DIRECT', 'GROUP', 'CHANNEL']),
  body('participantIds').isArray({ min: 1 }),
  body('participantIds.*').isUUID(),
  body('name').optional().isString(),
  body('dashboardId').optional({ values: 'null' }).isUUID(),
]);

const createMessageBody = validate([
  body('content').isString().notEmpty(),
  body('threadId').optional({ values: 'null' }).isUUID(),
  body('replyToId').optional({ values: 'null' }).isUUID(),
  body('fileIds').optional().isArray(),
]);

const searchUsersQuery = validate([
  query('query').isString().notEmpty().trim().isLength({ min: 2, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('dashboardId').optional().isUUID(),
]);

router.get('/conversations', getConversations);
router.get('/conversations/:id', conversationByIdParam, getConversation);
router.post('/conversations', createConversationBody, createConversation);

router.get('/conversations/:conversationId/messages', conversationIdParam, getMessages);
router.post(
  '/conversations/:conversationId/messages',
  conversationIdParam,
  createMessageBody,
  createMessage
);

router.post('/messages/:messageId/reactions', messageIdParam, addReactionBody, addReaction);

/** Matches client: POST /api/chat/messages/:messageId/read */
router.post('/messages/:messageId/read', messageIdParam, markAsRead);

router.get('/conversations/:conversationId/threads', conversationIdParam, getThreads);
router.post('/conversations/:conversationId/threads', conversationIdParam, createThread);

router.get('/users/search', searchUsersQuery, searchUsersForChat);

router.get('/analytics', getChatAnalytics);

router.get('/ai/context/recent', authenticateJWT, getRecentConversationsContext);
router.get('/ai/context/unread', authenticateJWT, getUnreadMessagesContext);
router.get('/ai/query/history', authenticateJWT, getConversationHistory);

export default router;
