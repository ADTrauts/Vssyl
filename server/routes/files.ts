import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken as authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const prisma = new PrismaClient();
const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation here
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// POST /files - Upload a file
router.post('/files', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create file record in database
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploaderId: req.user.id,
      }
    });

    res.json({ data: file });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload file'
    });
  }
});

// GET /files/:fileId - Download a file
router.get('/files/:fileId', authenticate, async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.fileId },
      include: {
        uploader: true,
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user has access to the file
    // This will need to be customized based on your access control requirements
    if (file.uploaderId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Stream the file
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.sendFile(file.path);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to download file'
    });
  }
});

// DELETE /files/:fileId - Delete a file
router.delete('/files/:fileId', authenticate, async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user has permission to delete the file
    if (file.uploaderId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from storage
    await fs.unlink(file.path);

    // Delete file record from database
    await prisma.file.delete({
      where: { id: req.params.fileId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete file'
    });
  }
});

export default router; 