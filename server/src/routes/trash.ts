import express from 'express';
import { listTrashedItems, trashItem, restoreItem, deleteItem, emptyTrash } from '../controllers/trashController';

const router: express.Router = express.Router();

// Get all trashed items across all modules
router.get('/items', listTrashedItems);

// Trash an item
router.post('/items', trashItem);

// Restore a trashed item
router.post('/restore/:id', restoreItem);

// Permanently delete a trashed item
router.delete('/delete/:id', deleteItem);

// Empty all trash
router.delete('/empty', emptyTrash);

export default router; 