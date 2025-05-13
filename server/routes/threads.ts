import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createThread,
  getThread,
  addMessageToThread,
  searchThreads,
  addReaction,
  removeReaction
} from '../controllers/threads';

const router = express.Router();

// Search threads
router.get('/search', authenticateToken, searchThreads);

// Get a specific thread
router.get('/:threadId', authenticateToken, getThread);

// Create a new thread
router.post('/', authenticateToken, createThread);

// Add a message to a thread
router.post('/:threadId/messages', authenticateToken, addMessageToThread);

// Add reaction to a thread message
router.post('/messages/:messageId/reactions', authenticateToken, addReaction);

// Remove reaction from a thread message
router.delete('/messages/:messageId/reactions/:emoji', authenticateToken, removeReaction);

export default router; 