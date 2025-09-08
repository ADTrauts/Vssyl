import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { listFolders, createFolder, updateFolder, deleteFolder, listTrashedFolders, restoreFolder, hardDeleteFolder, getRecentActivity, toggleFolderStarred, reorderFolders, moveFolder } from '../controllers/folderController';

const router: express.Router = express.Router();

// List all folders for the authenticated user (optionally by parent)
router.get('/', authenticateJWT, listFolders);

// List trashed folders
router.get('/trashed', authenticateJWT, listTrashedFolders);

// Create a new folder
router.post('/', authenticateJWT, createFolder);

// Update (rename/move) a folder
router.put('/:id', authenticateJWT, updateFolder);

// Delete a folder
router.delete('/:id', authenticateJWT, deleteFolder);

// Restore a trashed folder
router.post('/:id/restore', authenticateJWT, restoreFolder);

// Permanently delete a trashed folder
router.delete('/:id/hard', authenticateJWT, hardDeleteFolder);

// Toggle the starred status of a folder
router.put('/:id/star', authenticateJWT, toggleFolderStarred);

// Get recent activity for the user
router.get('/activity/recent', authenticateJWT, getRecentActivity);

// Reorder folders within a parent folder
router.post('/reorder/:parentId', authenticateJWT, reorderFolders);

// Move a folder to a different parent folder
router.post('/:id/move', authenticateJWT, moveFolder);

export default router; 