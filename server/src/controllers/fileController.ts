import { Request, Response, RequestHandler } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { getOrCreateChatFilesFolder } from '../services/driveService';
import { NotificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { prisma } from '../lib/prisma';

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Configure multer based on storage provider
const upload = multer({
  storage: storageService.getProvider() === 'gcs' ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads');
      
      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept all files for now, add type checks as needed
    cb(null, true);
  },
});

export const multerUpload = upload.single('file') as RequestHandler;

// Add error handling wrapper for multer
export const multerUploadWithErrorHandling = (req: Request, res: Response, next: Function) => {
  multerUpload(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next();
  });
};

function hasUserId(user: any): user is { id: string } | { sub: string } {
  return user && (typeof user.id === 'string' || typeof user.sub === 'string');
}

// List files with dashboard context support
export async function listFiles(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const folderId = req.query.folderId as string;
    const starred = req.query.starred as string;
    const dashboardId = req.query.dashboardId as string; // NEW: Dashboard context filtering
    
    const where: any = { userId };
    
    if (folderId) {
      where.folderId = folderId;
    } else {
      where.folderId = null;
    }
    
    // Add starred filtering
    if (starred === 'true') {
      where.starred = true;
    } else if (starred === 'false') {
      where.starred = false;
    }
    
    // Use raw SQL to include order field in sorting
    let query = `SELECT * FROM "files" WHERE "userId" = $1`;
    const params = [userId];
    let paramIndex = 2;
    
    // Dashboard context filtering
    if (dashboardId) {
      query += ` AND "dashboardId" = $${paramIndex}`;
      params.push(dashboardId);
      paramIndex++;
      console.log('Dashboard context requested:', dashboardId);
    } else {
      query += ` AND "dashboardId" IS NULL`;
    }
    
    if (folderId) {
      query += ` AND "folderId" = $${paramIndex}`;
      params.push(folderId);
      paramIndex++;
    } else {
      query += ` AND "folderId" IS NULL`;
    }
    
    if (starred === 'true') {
      query += ` AND "starred" = true`;
    } else if (starred === 'false') {
      query += ` AND "starred" = false`;
    }
    
    // Exclude trashed files
    query += ` AND "trashedAt" IS NULL`;
    
    query += ` ORDER BY "order" ASC, "createdAt" DESC`;
    
    const files = await prisma.$queryRawUnsafe(query, ...params);
    
    // Add full URLs to all files
    const filesWithFullUrls = (files as any[]).map(file => ({
      ...file,
      url: `${process.env.BACKEND_URL || 'https://vssyl-server-235369681725.us-central1.run.app'}${file.url}`
    }));
    
    res.json({ files: filesWithFullUrls });
  } catch (err) {
    console.error('Error in listFiles:', err);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
}

export async function uploadFile(req: RequestWithFile, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  
  try {
    console.log('📁 File upload request received:', {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype,
      storageProvider: storageService.getProvider(),
      userId: (req.user as any).id || (req.user as any).sub
    });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.file.originalname || req.file.originalname.trim() === '') {
      return res.status(400).json({ message: 'File name is required' });
    }
    
    const userId = (req.user as any).id || (req.user as any).sub;
    let { folderId, chat, dashboardId } = req.body;
    
    // If this is a chat upload, always use the Chat Files folder
    if (chat) {
      const chatFolder = await getOrCreateChatFilesFolder(userId);
      folderId = chatFolder.id;
    }
    
    const { originalname, mimetype, size } = req.file;
    
    // Generate unique file path
    const fileExtension = path.extname(originalname);
    const uniqueFilename = `files/${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    // Upload file using storage service
    console.log('📤 Uploading file to storage:', {
      filename: uniqueFilename,
      provider: storageService.getProvider(),
      isGCS: storageService.isGCSConfigured()
    });
    
    const uploadResult = await storageService.uploadFile(req.file, uniqueFilename, {
      makePublic: true,
      metadata: {
        userId,
        originalName: originalname,
        folderId: folderId || '',
        dashboardId: dashboardId || '',
      },
    });
    
    console.log('✅ File uploaded successfully:', {
      url: uploadResult.url,
      path: uploadResult.path
    });
    
    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        name: originalname,
        type: mimetype,
        size,
        url: uploadResult.url,
        path: uploadResult.path,
        folderId: folderId || null,
        dashboardId: dashboardId || null,
      },
    });

    // Create activity record for file upload
    await prisma.activity.create({
      data: {
        type: 'create',
        userId,
        fileId: fileRecord.id,
        details: {
          action: 'file_uploaded',
          fileName: originalname,
          fileSize: size,
          fileType: mimetype,
        },
      },
    });

    res.status(201).json({ file: fileRecord });
  } catch (err) {
    console.error('❌ Error in uploadFile:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      storageProvider: storageService.getProvider()
    });
    res.status(500).json({ 
      message: 'Failed to upload file',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}


export async function getItemActivity(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.sendStatus(401);
  }
  try {
    const { itemId } = req.params;
    const userId = (req.user as any).id || (req.user as any).sub;

    // Check if the item is a folder the user owns
    const folder = await prisma.folder.findFirst({
      where: { id: itemId, userId: userId },
    });

    // If it's a folder, it has no activities per the schema
    if (folder) {
      return res.json({ activities: [] });
    }

    // Check if the item is a file the user owns or has permission to see
    const file = await prisma.file.findFirst({
      where: {
        id: itemId,
        OR: [
          { userId: userId }, // User is the owner
          { permissions: { some: { userId: userId } } }, // User has explicit permission
        ],
      },
    });

    if (!file) {
      return res.status(404).json({ message: 'Item not found or access denied' });
    }

    // If it's a file, fetch its activities
    const activities = await prisma.activity.findMany({
      where: { fileId: itemId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    res.json({ activities });
  } catch (err) {
    console.error('Error in getItemActivity:', err);
    res.status(500).json({ message: 'Failed to get item activity' });
  }
}

export async function downloadFile(req: Request, res: Response) {
  // TODO: When migrating to Google Cloud Storage or S3, serve or redirect to the cloud URL here.
  
  // Check for token in query params (for file preview)
  let userId: string;
  if (req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token as string, process.env.JWT_SECRET || '');
      userId = (decoded as any).sub || (decoded as any).id;
    } catch (error) {
      return res.sendStatus(401);
    }
  } else if (hasUserId(req.user)) {
    userId = (req.user as any).id || (req.user as any).sub;
  } else {
    return res.sendStatus(401);
  }
  
  if (!userId) {
    return res.sendStatus(401);
  }
  
  try {
    const { id } = req.params;
    if (!(await canReadFile(userId, id))) return res.status(403).json({ message: 'Forbidden' });
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: 'File not found' });
    const filePath = path.join(__dirname, '../../uploads', file.url.replace('/uploads/', ''));
    
    // Create activity record for file download
    await prisma.activity.create({
      data: {
        type: 'download',
        userId,
        fileId: id,
        details: {
          action: 'file_downloaded',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      },
    });
    
    res.download(filePath, file.name);
  } catch (err) {
    res.status(500).json({ message: 'Failed to download file' });
  }
}

export async function updateFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const { name, folderId } = req.body;
    if (!(await canWriteFile(userId, id))) return res.status(403).json({ message: 'Forbidden' });
    
    // Get the original file to compare changes
    const originalFile = await prisma.file.findUnique({ where: { id } });
    if (!originalFile) return res.status(404).json({ message: 'File not found' });
    
    const file = await prisma.file.updateMany({
      where: { id, userId },
      data: { name, folderId },
    });
    if (file.count === 0) return res.status(404).json({ message: 'File not found' });
    const updated = await prisma.file.findUnique({ where: { id } });

    // Create activity record for file update
    await prisma.activity.create({
      data: {
        type: 'edit',
        userId,
        fileId: id,
        details: {
          action: 'file_updated',
          originalName: originalFile.name,
          newName: name || originalFile.name,
          originalFolderId: originalFile.folderId,
          newFolderId: folderId,
        },
      },
    });

    res.json({ file: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update file' });
  }
}

export async function deleteFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    if (!(await canWriteFile(userId, id))) return res.status(403).json({ message: 'Forbidden' });
    
    // Get the file details before deletion for activity tracking
    const fileToDelete = await prisma.file.findUnique({ where: { id } });
    if (!fileToDelete) return res.status(404).json({ message: 'File not found' });
    
    const file = await prisma.file.updateMany({
      where: { id, userId, trashedAt: null },
      data: { trashedAt: new Date() },
    });
    if (file.count === 0) return res.status(404).json({ message: 'File not found' });

    // Create activity record for file deletion (moved to trash)
    await prisma.activity.create({
      data: {
        type: 'delete',
        userId,
        fileId: id,
        details: {
          action: 'file_moved_to_trash',
          fileName: fileToDelete.name,
          fileType: fileToDelete.type,
          fileSize: fileToDelete.size,
        },
      },
    });

    res.json({ trashed: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to move file to trash' });
  }
}

// List all permissions for a file
export async function listFilePermissions(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params; // file id
    // Only owner can list permissions
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId) return res.status(403).json({ message: 'Forbidden' });
    const permissions = await prisma.filePermission.findMany({ where: { fileId: id }, include: { user: true } });
    res.json({ permissions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list permissions' });
  }
}

// Grant or update a user's permission for a file
export async function grantFilePermission(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const ownerId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params; // file id
    const { userId, canRead, canWrite } = req.body;
    
    // Only owner can grant permissions
    const file = await prisma.file.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!file || file.userId !== ownerId) return res.status(403).json({ message: 'Forbidden' });
    
    const permission = await prisma.filePermission.upsert({
      where: { fileId_userId: { fileId: id, userId } },
      update: { canRead, canWrite },
      create: { fileId: id, userId, canRead, canWrite },
    });

    // Create notification for the user who was granted permission
    try {
      const permissionType = canRead && canWrite ? 'read and write' : canRead ? 'read' : 'write';
      
      await NotificationService.handleNotification({
        type: 'drive_permission',
        title: `${file.user?.name || 'Someone'} shared a file with you`,
        body: `You now have ${permissionType} access to "${file.name}"`,
        data: {
          fileId: id,
          fileName: file.name,
          permissionType,
          ownerId: file.userId,
          ownerName: file.user?.name
        },
        recipients: [userId],
        senderId: ownerId
      });
    } catch (notificationError) {
      console.error('Error creating file permission notification:', notificationError);
      // Don't fail the permission grant if notification fails
    }

    res.status(201).json({ permission });
  } catch (err) {
    res.status(500).json({ message: 'Failed to grant permission' });
  }
}

// Update a user's permission for a file
export async function updateFilePermission(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const ownerId = (req.user as any).id || (req.user as any).sub;
    const { id, userId } = req.params; // file id, user id
    const { canRead, canWrite } = req.body;
    // Only owner can update permissions
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== ownerId) return res.status(403).json({ message: 'Forbidden' });
    const permission = await prisma.filePermission.updateMany({
      where: { fileId: id, userId },
      data: { canRead, canWrite },
    });
    if (permission.count === 0) return res.status(404).json({ message: 'Permission not found' });
    res.json({ updated: permission.count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update permission' });
  }
}

// Revoke a user's permission for a file
export async function revokeFilePermission(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const ownerId = (req.user as any).id || (req.user as any).sub;
    const { id, userId } = req.params; // file id, user id
    
    // Only owner can revoke permissions
    const file = await prisma.file.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!file || file.userId !== ownerId) return res.status(403).json({ message: 'Forbidden' });
    
    await prisma.filePermission.deleteMany({ where: { fileId: id, userId } });
    
    // Create notification for the user whose permission was revoked
    try {
      await NotificationService.handleNotification({
        type: 'drive_permission',
        title: `File access revoked`,
        body: `Your access to "${file.name}" has been removed`,
        data: {
          fileId: id,
          fileName: file.name,
          action: 'revoked',
          ownerId: file.userId,
          ownerName: file.user?.name
        },
        recipients: [userId],
        senderId: ownerId
      });
    } catch (notificationError) {
      console.error('Error creating file permission revocation notification:', notificationError);
      // Don't fail the permission revocation if notification fails
    }
    
    res.json({ revoked: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke permission' });
  }
}

// Helper: check if user can read a file
async function canReadFile(userId: string, fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;
  if (file.userId === userId) return true;
  const perm = await prisma.filePermission.findFirst({ where: { fileId, userId, canRead: true } });
  return !!perm;
}

// Helper: check if user can write a file
async function canWriteFile(userId: string, fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;
  if (file.userId === userId) return true;
  const perm = await prisma.filePermission.findFirst({ where: { fileId, userId, canWrite: true } });
  return !!perm;
}

// List trashed files for the user
export async function listTrashedFiles(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const files = await prisma.file.findMany({
      where: { userId, trashedAt: { not: null } },
      orderBy: { trashedAt: 'desc' },
    });
    res.json({ files });
  } catch (err) {
    console.error('listTrashedFiles error:', err);
    res.status(500).json({ message: 'Failed to list trashed files' });
  }
}

// Restore a trashed file
export async function restoreFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const file = await prisma.file.updateMany({
      where: { id, userId, trashedAt: { not: null } },
      data: { trashedAt: null },
    });
    if (file.count === 0) return res.status(404).json({ message: 'File not found or not trashed' });
    res.json({ restored: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to restore file' });
  }
}

// Permanently delete a trashed file
export async function hardDeleteFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    
    // Get file details before deletion
    const fileToDelete = await prisma.file.findFirst({
      where: { id, userId, trashedAt: { not: null } },
    });
    
    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found or not trashed' });
    }
    
    // Delete file from storage if path exists
    if (fileToDelete.path) {
      const deleteResult = await storageService.deleteFile(fileToDelete.path);
      if (!deleteResult.success) {
        console.warn(`Failed to delete file from storage: ${deleteResult.error}`);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete from database
    const file = await prisma.file.deleteMany({
      where: { id, userId, trashedAt: { not: null } },
    });
    
    if (file.count === 0) {
      return res.status(404).json({ message: 'File not found or not trashed' });
    }
    
    res.json({ deleted: true });
  } catch (err) {
    console.error('Error in hardDeleteFile:', err);
    res.status(500).json({ message: 'Failed to permanently delete file' });
  }
} 

// Toggle the starred status of a file
export async function toggleFileStarred(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const updatedFile = await prisma.file.update({
      where: { id },
      data: { starred: !file.starred },
    });
    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle star on file' });
  }
}

// Get shared items for the current user
export async function getSharedItems(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;

    // Get files that have been shared with this user
    const sharedFiles = await prisma.file.findMany({
      where: {
        permissions: {
          some: {
            userId: userId,
            canRead: true
          }
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        permissions: {
          where: { userId: userId },
          select: { canRead: true, canWrite: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get folders that have been shared with this user
    // Note: Currently folders don't have permissions, so this will be empty
    // until we implement folder sharing
    const sharedFolders = await prisma.folder.findMany({
      where: {
        // TODO: Add folder permissions when implemented
        id: 'none' // This ensures no results for now
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform the data to include permission information
    const transformedFiles = sharedFiles.map(file => ({
      ...file,
      permission: file.permissions[0]?.canWrite ? 'edit' : 'view'
    }));

    const transformedFolders = sharedFolders.map(folder => ({
      ...folder,
      permission: 'view' // Default for folders until permissions are implemented
    }));

    res.json({
      files: transformedFiles,
      folders: transformedFolders
    });
  } catch (err) {
    console.error('Error in getSharedItems:', err);
    res.status(500).json({ message: 'Failed to fetch shared items' });
  }
}

// Reorder files within a folder
export async function reorderFiles(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { folderId } = req.params;
    const { fileIds } = req.body; // Array of file IDs in new order

    if (!Array.isArray(fileIds)) {
      return res.status(400).json({ message: 'fileIds must be an array' });
    }

    // Verify all files belong to the user and are in the specified folder
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: userId,
        folderId: folderId || null
      }
    });

    if (files.length !== fileIds.length) {
      return res.status(400).json({ message: 'Some files not found or access denied' });
    }

    // Update the order of each file using raw SQL to avoid Prisma client issues
    for (let i = 0; i < fileIds.length; i++) {
      await prisma.$executeRawUnsafe(`UPDATE "File" SET "order" = $1 WHERE id = $2`, i, fileIds[i]);
    }

    res.json({ success: true, message: 'Files reordered successfully' });
  } catch (err) {
    console.error('Error in reorderFiles:', err);
    res.status(500).json({ message: 'Failed to reorder files' });
  }
}

// Move a file to a different folder
export async function moveFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const { targetFolderId } = req.body;

    // Verify the file belongs to the user
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    // Verify the target folder exists and belongs to the user (if specified)
    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({ where: { id: targetFolderId } });
      if (!targetFolder || targetFolder.userId !== userId) {
        return res.status(400).json({ message: 'Target folder not found or access denied' });
      }
    }

    // Get the original file details for activity tracking
    const originalFolderId = file.folderId;

    // Move the file
    const updatedFile = await prisma.file.update({
      where: { id },
      data: { folderId: targetFolderId || null },
    });

    // Create activity record for file move
    await prisma.activity.create({
      data: {
        type: 'edit',
        userId,
        fileId: id,
        details: {
          action: 'file_moved',
          fileName: file.name,
          originalFolderId: originalFolderId,
          newFolderId: targetFolderId,
        },
      },
    });

    res.json({ file: updatedFile, message: 'File moved successfully' });
  } catch (err) {
    console.error('Error in moveFile:', err);
    res.status(500).json({ message: 'Failed to move file' });
  }
} 