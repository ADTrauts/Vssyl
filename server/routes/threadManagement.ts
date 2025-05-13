import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  pinThread,
  unpinThread,
  starThread,
  unstarThread,
  getStarredThreads,
  getPinnedThreads,
  updateThreadMetadata
} from '../controllers/threadManagement';

const router = express.Router();

// Thread pinning routes
router.post('/:threadId/pin', authenticateToken, pinThread);
router.post('/:threadId/unpin', authenticateToken, unpinThread);

// Thread starring routes
router.post('/:threadId/star', authenticateToken, starThread);
router.post('/:threadId/unstar', authenticateToken, unstarThread);

// Get starred and pinned threads
router.get('/starred', authenticateToken, getStarredThreads);
router.get('/pinned', authenticateToken, getPinnedThreads);

// Update thread metadata
router.patch('/:threadId/metadata', authenticateToken, updateThreadMetadata);

export default router; 