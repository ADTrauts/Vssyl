import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag,
  createCollection,
  updateCollection,
  deleteCollection,
  addThreadToCollection,
  removeThreadFromCollection,
  addMemberToCollection,
  removeMemberFromCollection,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addThreadRelation,
  removeThreadRelation,
  organizeByActivity,
  organizeByCategory,
  organizeByPriority
} from '../controllers/threadOrganization';

const router = express.Router();

// Category routes
router.post('/categories', authenticateToken, createCategory);
router.put('/categories/:id', authenticateToken, updateCategory);
router.delete('/categories/:id', authenticateToken, deleteCategory);

// Tag routes
router.post('/tags', authenticateToken, createTag);
router.put('/tags/:id', authenticateToken, updateTag);
router.delete('/tags/:id', authenticateToken, deleteTag);

// Collection routes
router.post('/collections', authenticateToken, createCollection);
router.put('/collections/:id', authenticateToken, updateCollection);
router.delete('/collections/:id', authenticateToken, deleteCollection);
router.post('/collections/:collectionId/threads/:threadId', authenticateToken, addThreadToCollection);
router.delete('/collections/:collectionId/threads/:threadId', authenticateToken, removeThreadFromCollection);
router.post('/collections/:collectionId/members/:userId', authenticateToken, addMemberToCollection);
router.delete('/collections/:collectionId/members/:userId', authenticateToken, removeMemberFromCollection);

// Template routes
router.post('/templates', authenticateToken, createTemplate);
router.put('/templates/:id', authenticateToken, updateTemplate);
router.delete('/templates/:id', authenticateToken, deleteTemplate);

// Thread relation routes
router.post('/threads/:threadId/relations/:relatedThreadId', authenticateToken, addThreadRelation);
router.delete('/threads/:threadId/relations/:relatedThreadId', authenticateToken, removeThreadRelation);

// Organize threads by activity
router.get('/activity', authenticateToken, organizeByActivity);

// Organize threads by category
router.get('/category', authenticateToken, organizeByCategory);

// Organize threads by priority
router.get('/priority', authenticateToken, organizeByPriority);

export default router; 