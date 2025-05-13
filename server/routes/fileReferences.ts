import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { checkFileAccess } from '../middleware/fileAccess';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Schema for creating a file reference
const createFileReferenceSchema = z.object({
  fileId: z.string(),
  messageId: z.string().optional(),
  threadId: z.string().optional(),
  conversationId: z.string().optional(),
  type: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Create a new file reference
router.post('/', authenticateUser, checkFileAccess, async (req, res) => {
  try {
    const data = createFileReferenceSchema.parse(req.body);

    // Ensure at least one reference type is provided
    if (!data.messageId && !data.threadId && !data.conversationId) {
      return res.status(400).json({
        error: 'At least one reference type (message, thread, or conversation) is required',
      });
    }

    // Verify the file exists
    const file = await prisma.file.findUnique({
      where: { id: data.fileId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Create the file reference
    const fileReference = await prisma.fileReference.create({
      data: {
        fileId: data.fileId,
        messageId: data.messageId,
        threadId: data.threadId,
        conversationId: data.conversationId,
        type: data.type,
        metadata: data.metadata || {},
      },
      include: {
        file: true,
        message: true,
        thread: true,
        conversation: true,
      },
    });

    res.status(201).json(fileReference);
  } catch (error) {
    console.error('Error creating file reference:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create file reference',
    });
  }
});

// Get a specific file reference
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const fileReference = await prisma.fileReference.findUnique({
      where: { id: req.params.id },
      include: {
        file: true,
        message: true,
        thread: true,
        conversation: true,
      },
    });

    if (!fileReference) {
      return res.status(404).json({ error: 'File reference not found' });
    }

    // Check if user has access to the file
    await checkFileAccess(req, res, () => {
      res.json(fileReference);
    });
  } catch (error) {
    console.error('Error getting file reference:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get file reference',
    });
  }
});

// Get all references for a file
router.get('/file/:fileId', authenticateUser, checkFileAccess, async (req, res) => {
  try {
    const fileReferences = await prisma.fileReference.findMany({
      where: { fileId: req.params.fileId },
      include: {
        file: true,
        message: true,
        thread: true,
        conversation: true,
      },
    });

    res.json(fileReferences);
  } catch (error) {
    console.error('Error getting file references:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get file references',
    });
  }
});

// Delete a file reference
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const fileReference = await prisma.fileReference.findUnique({
      where: { id: req.params.id },
      include: { file: true },
    });

    if (!fileReference) {
      return res.status(404).json({ error: 'File reference not found' });
    }

    // Check if user has access to the file
    await checkFileAccess(req, res, async () => {
      await prisma.fileReference.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    });
  } catch (error) {
    console.error('Error deleting file reference:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete file reference',
    });
  }
});

export default router; 