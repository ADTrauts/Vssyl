console.log('[DEBUG] fileRouter loaded');
import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { listFiles, uploadFile, downloadFile, updateFile, deleteFile, multerUploadWithErrorHandling, listFilePermissions, grantFilePermission, updateFilePermission, revokeFilePermission, listTrashedFiles, restoreFile, hardDeleteFile, toggleFileStarred, reorderFiles, moveFile } from '../controllers/fileController';

const router: express.Router = express.Router();

// List all files for the authenticated user (optionally by folder)
router.get('/', authenticateJWT, listFiles);

// List trashed files
router.get('/trashed', authenticateJWT, listTrashedFiles);

// Upload a new file
router.post('/', authenticateJWT, multerUploadWithErrorHandling, uploadFile);

// Download or preview a file
router.get('/:id', authenticateJWT, downloadFile);

// Update (rename/move) a file
router.put('/:id', authenticateJWT, updateFile);

// Toggle the starred status of a file
router.put('/:id/star', authenticateJWT, toggleFileStarred);

// Delete a file (move to trash)
router.delete('/:id', authenticateJWT, deleteFile);

// List all permissions for a file
router.get('/:id/permissions', authenticateJWT, listFilePermissions);

// Grant or update a user's permission for a file
router.post('/:id/permissions', authenticateJWT, grantFilePermission);

// Update a user's permission for a file
router.put('/:id/permissions/:userId', authenticateJWT, updateFilePermission);

// Revoke a user's permission for a file
router.delete('/:id/permissions/:userId', authenticateJWT, revokeFilePermission);

// Restore a trashed file
router.post('/:id/restore', authenticateJWT, restoreFile);

// Permanently delete a trashed file
router.delete('/:id/hard-delete', authenticateJWT, hardDeleteFile);

// Reorder files within a folder
router.post('/reorder/:folderId', authenticateJWT, reorderFiles);

// Move a file to a different folder
router.post('/:id/move', authenticateJWT, moveFile);

export default router; 