import { Request, Response, NextFunction } from 'express';
import { PrismaClient, File, FileAccess } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Schema for file access check
const fileAccessSchema = z.object({
  fileId: z.string(),
  userId: z.string(),
});

export const checkFileAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = fileAccessSchema.parse({
      fileId: req.params.fileId || req.body.fileId,
      userId: req.user?.id,
    });

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the user is the file owner
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        access: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Allow access if user is the owner
    if (file.ownerId === req.user.id) {
      return next();
    }

    // Check if user has explicit access
    const hasAccess = file.access.some(
      (access: FileAccess) =>
        access.userId === req.user.id &&
        (access.permission === 'READ' || access.permission === 'WRITE')
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Error checking file access:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to check file access',
    });
  }
}; 