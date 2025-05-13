import { Router } from 'express';
import { ConversationController } from '../controllers/conversationController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { conversationValidation } from '../validations/conversationValidation';

const router = Router();
const conversationController = new ConversationController();

// Workspace conversation routes
router.get(
  '/workspaces/:workspaceId/conversations',
  authenticate,
  conversationController.getConversations
);

router.post(
  '/workspaces/:workspaceId/conversations',
  authenticate,
  validateRequest(conversationValidation.createConversation),
  conversationController.createConversation
);

// Conversation message routes
router.get(
  '/workspaces/:workspaceId/conversations/:conversationId/messages',
  authenticate,
  conversationController.getMessages
);

router.post(
  '/workspaces/:workspaceId/conversations/:conversationId/messages',
  authenticate,
  validateRequest(conversationValidation.createMessage),
  conversationController.createMessage
);

// Message search route
router.get(
  '/workspaces/:workspaceId/conversations/:conversationId/messages/search',
  authenticate,
  conversationController.searchMessages
);

export default router; 