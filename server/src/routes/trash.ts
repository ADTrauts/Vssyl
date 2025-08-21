import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { listTrashedItems, trashItem, restoreItem, deleteItem, emptyTrash } from '../controllers/trashController';

const router = express.Router();

// Get all trashed items across all modules
router.get('/items', authenticateJWT, listTrashedItems);

// Trash an item
router.post('/items', authenticateJWT, trashItem);

// Restore a trashed item
router.post('/restore/:id', authenticateJWT, restoreItem);

// Permanently delete a trashed item
router.delete('/delete/:id', authenticateJWT, deleteItem);

// Empty all trash
router.delete('/empty', authenticateJWT, emptyTrash);

export default router; 