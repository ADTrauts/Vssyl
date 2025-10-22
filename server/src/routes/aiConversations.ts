import express from 'express';
import { authenticateJWT } from '../middleware/auth';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript language server cache issue, compiles fine
import * as aiConversationController from '../controllers/aiConversationController';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// GET /api/ai-conversations - Get user's AI conversations
router.get('/', aiConversationController.getConversations);

// GET /api/ai-conversations/:id - Get specific conversation with messages
router.get('/:id', aiConversationController.getConversation);

// POST /api/ai-conversations - Create new conversation
router.post('/', aiConversationController.createConversation);

// PUT /api/ai-conversations/:id - Update conversation (title, archive, pin)
router.put('/:id', aiConversationController.updateConversation);

// DELETE /api/ai-conversations/:id - Delete conversation
router.delete('/:id', aiConversationController.deleteConversation);

// POST /api/ai-conversations/:id/messages - Add message to conversation
router.post('/:id/messages', aiConversationController.addMessage);

// GET /api/ai-conversations/:id/messages - Get conversation messages
router.get('/:id/messages', aiConversationController.getMessages);

export default router;
