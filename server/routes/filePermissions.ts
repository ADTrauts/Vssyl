import express from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth';
import { checkFileAccess } from '../middleware/fileAccess';
import { filePermissionService } from '../services/filePermissionService';
import { Permission } from '@prisma/client';

const router = express.Router();

// Schema for granting access
const grantAccessSchema = z.object({
  userId: z.string(),
  permission: z.enum(['READ', 'WRITE'] as const),
});

// Grant access to a file
router.post('/:fileId/access', authenticateUser, checkFileAccess, async (req, res) => {
  try {
    const { userId, permission } = grantAccessSchema.parse(req.body);
    const fileId = req.params.fileId;

    const access = await filePermissionService.grantAccess(
      fileId,
      userId,
      permission as Permission
    );

    res.status(201).json(access);
  } catch (error) {
    console.error('Error granting file access:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to grant file access',
    });
  }
});

// Revoke access from a file
router.delete('/:fileId/access/:userId', authenticateUser, checkFileAccess, async (req, res) => {
  try {
    const { fileId, userId } = req.params;

    await filePermissionService.revokeAccess(fileId, userId);

    res.status(204).send();
  } catch (error) {
    console.error('Error revoking file access:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to revoke file access',
    });
  }
});

// Get all access entries for a file
router.get('/:fileId/access', authenticateUser, checkFileAccess, async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const access = await filePermissionService.getFileAccess(fileId);

    res.json(access);
  } catch (error) {
    console.error('Error getting file access:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get file access',
    });
  }
});

// Transfer file ownership
router.post('/:fileId/transfer', authenticateUser, checkFileAccess, async (req, res) => {
  try {
    const { newOwnerId } = z.object({ newOwnerId: z.string() }).parse(req.body);
    const fileId = req.params.fileId;

    await filePermissionService.transferOwnership(fileId, newOwnerId);

    res.status(200).json({ message: 'Ownership transferred successfully' });
  } catch (error) {
    console.error('Error transferring file ownership:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to transfer file ownership',
    });
  }
});

export default router; 