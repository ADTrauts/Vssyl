import { Request, Response, RequestHandler } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import {
  grantFileSharePermission,
  revokeFileSharePermission,
  updateFileSharePermission,
  DriveShareError,
} from '../services/driveFileShareService';
import {
  permanentlyDeleteDriveFile,
  restoreDriveItem,
  softTrashDriveItem,
  DriveDeleteError,
} from '../services/driveDeleteService';
import { storageService } from '../services/storageService';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from '../services/chatSocketService';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { assertUserOwnsDashboard } from '../services/taskDashboardBinding';
import { emitModuleActivityEvent } from '../services/moduleActivityService';
import { canReadFile, canWriteFile, canWriteFolder } from '../services/drivePermissionHelpers';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  emitFileMovedEvent,
  emitFileRenamedEvent,
} from '../events/domainEventEmitters';
import { listAccessibleDriveFilesForBrowse } from '../services/driveVisibilityService';
import { createDriveFile, DriveUploadError } from '../services/driveUploadService';

interface JWTPayload {
  sub?: string;
  id?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multerUpload(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next();
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasUserId(user: any): user is { id: string } {
  return user && typeof user.id === 'string';
}

// List files with dashboard context support (owned + shared — FH-2)
export async function listFiles(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const folderId = req.query.folderId;
    const starred = req.query.starred;
    const dashboardId = req.query.dashboardId;
    const fileIdQuery = req.query.fileId;

    if (fileIdQuery && typeof fileIdQuery === 'string') {
      if (!(await canReadFile(userId, fileIdQuery))) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const file = await prisma.file.findFirst({
        where: { id: fileIdQuery, trashedAt: null },
      });
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      return res.json({ files: [file] });
    }

    if (folderId && typeof folderId !== 'string') {
      return res.status(400).json({ error: 'folderId must be a string' });
    }
    if (starred && typeof starred !== 'string') {
      return res.status(400).json({ error: 'starred must be a string' });
    }
    if (dashboardId && typeof dashboardId !== 'string') {
      return res.status(400).json({ error: 'dashboardId must be a string' });
    }

    const folderIdStr = folderId as string | undefined;
    const starredStr = starred as string | undefined;
    const dashboardIdStr = dashboardId as string | undefined;
    const isStarred = starredStr === 'true';

    if (dashboardIdStr) {
      try {
        await assertUserOwnsDashboard(prisma, userId, dashboardIdStr);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'Task dashboard not found') {
          return res.status(404).json({ message: 'Dashboard not found' });
        }
        throw err;
      }
    }

    const files = await listAccessibleDriveFilesForBrowse({
      userId,
      folderId: folderIdStr ?? null,
      dashboardId: isStarred ? undefined : (dashboardIdStr ?? null),
      starred: isStarred,
    });

    const baseUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://vssyl-server-235369681725.us-central1.run.app';

    const filesWithFullUrls = files.map((file) => ({
      ...file,
      url: `${baseUrl}/api/drive/files/${file.id}/download`,
    }));

    res.json(filesWithFullUrls);
  } catch (err) {
    await logger.error('Failed to list files', {
      operation: 'file_list_files',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    res.status(500).json({ message: 'Failed to fetch files' });
  }
}

export async function uploadFile(req: RequestWithFile, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  
  try {
    await logger.info('File upload request received', {
      operation: 'file_upload_request',
      context: {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        storageProvider: storageService.getProvider(),
        isGCSConfigured: storageService.isGCSConfigured(),
        userId: (req as AuthenticatedRequest).user?.id || '',
        environment: process.env.NODE_ENV,
        storageProviderEnv: process.env.STORAGE_PROVIDER,
        fileStorageTypeEnv: process.env.FILE_STORAGE_TYPE
      }
    });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.file.originalname || req.file.originalname.trim() === '') {
      return res.status(400).json({ message: 'File name is required' });
    }
    
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    let { folderId, chat, dashboardId } = req.body;

    try {
      const fileRecord = await createDriveFile({
        userId,
        source: req.file,
        folderId: folderId as string | null | undefined,
        dashboardId: dashboardId as string | null | undefined,
        chat: Boolean(chat),
      });
      res.status(201).json({ file: fileRecord });
    } catch (err: unknown) {
      if (err instanceof DriveUploadError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      throw err;
    }
  } catch (err) {
    await logger.error('Failed to upload file', {
      operation: 'file_upload',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      },
      context: {
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        storageProvider: storageService.getProvider()
      }
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
    const userId = (req as AuthenticatedRequest).user?.id;

    // Check if the item is a folder the user owns
    const folder = await prisma.folder.findFirst({
      where: { id: itemId, userId: userId },
    });

    // If it's a folder, return normalized events from module activity log
    if (folder) {
      const folderEvents = await prisma.log.findMany({
        where: {
          userId,
          operation: 'module_activity_event',
          module: 'drive',
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
        select: { id: true, timestamp: true, metadata: true },
      });

      const filtered = folderEvents.filter((event) => {
        const metadata = event.metadata as Record<string, unknown> | null;
        const target = (metadata?.target as Record<string, unknown> | undefined) ?? {};
        return target.type === 'folder' && target.id === itemId;
      });

      return res.json({ activities: [], normalizedEvents: filtered });
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

    const fileEvents = await prisma.log.findMany({
      where: {
        userId,
        operation: 'module_activity_event',
        module: 'drive',
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      select: { id: true, timestamp: true, metadata: true },
    });

    const normalizedEvents = fileEvents.filter((event) => {
      const metadata = event.metadata as Record<string, unknown> | null;
      const target = (metadata?.target as Record<string, unknown> | undefined) ?? {};
      return target.type === 'file' && target.id === itemId;
    });

    // Legacy Activity rows (file-scoped) plus normalized drive events for this file
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

    res.json({ activities, normalizedEvents });
  } catch (err) {
    await logger.error('Failed to get item activity', {
      operation: 'file_get_item_activity',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    res.status(500).json({ message: 'Failed to get item activity' });
  }
}

export async function downloadFile(req: Request, res: Response) {
  // Log download request for debugging
  await logger.debug('Download file request received', {
    operation: 'file_download_request',
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    hasUser: !!req.user
  });

  // Check for token in query params (for file preview)
  let userId: string;
  if (req.query.token) {
    // Validate token query parameter
    if (typeof req.query.token !== 'string') {
      return res.status(400).json({ error: 'token must be a string' });
    }
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET || '');
      const payload = decoded as JWTPayload;
      userId = payload.sub || payload.id || '';
    } catch (error) {
      return res.sendStatus(401);
    }
  } else if (hasUserId(req.user)) {
    userId = req.user.id;
  } else {
    await logger.warn('Download file request without authentication', {
      operation: 'file_download_unauthorized',
      path: req.path,
      params: req.params
    });
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
    
    // Log file details for debugging
    await logger.info('File download request', {
      operation: 'file_download_start',
      fileId: id,
      fileName: file.name,
      fileUrl: file.url,
      filePath: file.path,
      storageProvider: storageService.getProvider()
    });
    
    // Determine file location from URL/path, not just current storage provider setting
    // Check if file URL indicates it's in GCS
    const isGCSFile = file.url && (
      file.url.includes('storage.googleapis.com') ||
      file.url.includes('googleapis.com') ||
      file.url.includes('storage.cloud.google.com') ||
      (file.path && !file.path.startsWith('/') && !file.path.includes('uploads'))
    );
    
    // Download audit: normalized module activity only (legacy prisma.activity removed FH-6)
    
    // For GCS files, always serve through backend (bucket may have public access prevention)
    if (isGCSFile || storageService.getProvider() === 'gcs') {
      // Extract GCS path from file.path or file.url
      let gcsPath = file.path;
      
      if (!gcsPath && file.url) {
        // Extract GCS path from URL
        // Handle URLs like: https://storage.googleapis.com/bucket-name/path/to/file
        // or: https://bucket-name.storage.googleapis.com/path/to/file
        const urlMatch = file.url.match(/storage\.googleapis\.com\/[^\/]+\/(.+)$/) ||
                        file.url.match(/\.storage\.googleapis\.com\/(.+)$/) ||
                        file.url.match(/storage\.cloud\.google\.com\/[^\/]+\/(.+)$/);
        if (urlMatch) {
          gcsPath = urlMatch[1];
        } else {
          // Try to extract from any URL format
          gcsPath = file.url.split('/').slice(-2).join('/'); // Get last two segments
        }
      }
      
      if (gcsPath) {
        await logger.info('Serving GCS file through backend', {
          operation: 'file_download_gcs_backend',
          fileId: id,
          gcsPath,
          originalUrl: file.url
        });
        
        // Get file buffer from GCS
        const fileBuffer = await storageService.getFileBuffer(gcsPath);
        
        // Determine content type
        const contentType = file.type || 'application/octet-stream';
        
        // Set headers and send file
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Length', fileBuffer.length.toString());
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        return res.send(fileBuffer);
      } else {
        await logger.error('Could not determine GCS path for file', {
          operation: 'file_download_gcs_path_error',
          fileId: id,
          fileUrl: file.url,
          filePath: file.path
        });
        return res.status(500).json({ message: 'Could not determine file location' });
      }
    }
    
    // For non-GCS external URLs (e.g., other cloud storage), try redirect if accessible
    if (file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
      const isExternalUrl = !file.url.includes('localhost') && 
                           !file.url.includes('127.0.0.1') &&
                           !isGCSFile;
      
      if (isExternalUrl) {
        await logger.info('Redirecting to external URL for download', {
          operation: 'file_download_external_url',
          fileId: id,
          fileUrl: file.url
        });
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        return res.redirect(file.url);
      }
    }
    
    // Local storage - serve file directly
    // Use file.path if available (actual file path), otherwise extract from file.url
    let filePath: string;
    
    if (file.path) {
      // file.path should be the actual file path (e.g., "files/userId-timestamp.pdf")
      const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads');
      filePath = path.join(uploadDir, file.path);
    } else if (file.url) {
      // Extract path from URL if file.path is not available
      // Handle both full URLs (http://localhost:5000/uploads/files/...) and relative paths (/uploads/files/...)
      const urlPath = file.url.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/uploads\//, 'uploads/');
      const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads');
      filePath = path.join(uploadDir, urlPath.replace(/^uploads\//, ''));
    } else {
      await logger.error('File has neither path nor url', {
        operation: 'file_download_missing_path',
        fileId: id,
        fileName: file.name
      });
      return res.status(500).json({ message: 'File path not found' });
    }
    
    await logger.info('Serving local file for download', {
      operation: 'file_download_local',
      fileId: id,
      filePath,
      fileName: file.name,
      fileUrl: file.url,
      filePathFromDb: file.path
    });
    
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        await logger.error('Local file not found', {
          operation: 'file_download_file_not_found',
          fileId: id,
          filePath,
          fileName: file.name,
          fileUrl: file.url,
          filePathFromDb: file.path,
          isGCSFile,
          storageProvider: storageService.getProvider(),
          uploadDir: process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads')
        });
        
        // If file doesn't exist locally but has a URL, try using the URL directly
        if (file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
          await logger.info('File not found locally, trying file URL directly', {
            operation: 'file_download_fallback_url',
            fileId: id,
            fileUrl: file.url
          });
          res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
          return res.redirect(file.url);
        }
        
        return res.status(404).json({ 
          message: 'File not found on disk',
          details: {
            filePath,
            fileUrl: file.url,
            filePathFromDb: file.path
          }
        });
      }
    
    return res.download(filePath, file.name);
  } catch (err) {
    await logger.error('Failed to download file', {
      operation: 'file_download',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    res.status(500).json({ message: 'Failed to download file' });
  }
}

export async function updateFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, folderId } = req.body;
    if (!(await canWriteFile(userId, id))) return res.status(403).json({ message: 'Forbidden' });

    const fileScopeRow = await prisma.file.findUnique({
      where: { id },
      select: { dashboardId: true },
    });
    const updatePolicyDual = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_UPDATE,
      resourceType: 'file',
      resourceId: id,
      scope: fileScopeRow?.dashboardId ? { dashboardId: fileScopeRow.dashboardId } : undefined,
    });
    if (updatePolicyDual.blocked) {
      return res.status(403).json({ message: 'Forbidden', reason: updatePolicyDual.reason });
    }

    const originalFile = await prisma.file.findUnique({ where: { id } });
    if (!originalFile || originalFile.trashedAt) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (folderId !== undefined && folderId !== originalFile.folderId && folderId) {
      const canWriteTargetFolder = await canWriteFolder(userId, folderId);
      if (!canWriteTargetFolder) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const updateData: { name?: string; folderId?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (folderId !== undefined) updateData.folderId = folderId;

    const file = await prisma.file.updateMany({
      where: { id, trashedAt: null },
      data: updateData,
    });
    if (file.count === 0) return res.status(404).json({ message: 'File not found' });
    const updated = await prisma.file.findUnique({ where: { id } });

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: folderId !== undefined && folderId !== originalFile.folderId ? 'move' : 'update',
      targetType: 'file',
      targetId: id,
      parentType: (updated?.folderId ?? originalFile.folderId) ? 'folder' : undefined,
      parentId: (updated?.folderId ?? originalFile.folderId) ?? undefined,
      dashboardId: updated?.dashboardId ?? originalFile.dashboardId,
      metadata: {
        originalName: originalFile.name,
        newName: name || originalFile.name,
      },
    });

    const didMove = folderId !== undefined && folderId !== originalFile.folderId;
    if (didMove) {
      emitFileMovedEvent({
        actorUserId: userId,
        fileId: id,
        fileName: updated?.name ?? originalFile.name,
        folderId: updated?.folderId ?? null,
        previousFolderId: originalFile.folderId,
        dashboardId: updated?.dashboardId ?? originalFile.dashboardId,
      });
    } else if (name !== undefined && name !== originalFile.name) {
      emitFileRenamedEvent({
        actorUserId: userId,
        fileId: id,
        fileName: name,
        previousName: originalFile.name,
        folderId: updated?.folderId ?? originalFile.folderId,
        dashboardId: updated?.dashboardId ?? originalFile.dashboardId,
      });
    }

    // Broadcast real-time drive event to owner
    try {
      const socketService = getChatSocketService();
      socketService.broadcastDriveEvent(userId, 'drive:item:updated', {
        itemId: id,
        itemType: 'file',
        dashboardId: updated?.dashboardId ?? originalFile.dashboardId,
        folderId: updated?.folderId ?? originalFile.folderId,
      });
    } catch (socketError) {
      await logger.error('Failed to broadcast drive:item:updated event', {
        operation: 'file_update_socket_broadcast',
        error: {
          message: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined
        }
      });
      // Non-critical
    }

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
    const userId = req.user.id;
    const { id } = req.params;
    await softTrashDriveItem({ userId, type: 'file', id });
    res.json({ trashed: true });
  } catch (err: unknown) {
    if (err instanceof DriveDeleteError) {
      if (err.code === 'not_found') {
        return res.status(404).json({ message: 'File not found' });
      }
      if (err.code === 'forbidden') {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
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
    const userId = (req as AuthenticatedRequest).user?.id;
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
    const ownerId = (req as AuthenticatedRequest).user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { userId, canRead, canWrite } = req.body;

    const { permission } = await grantFileSharePermission({
      ownerUserId: ownerId,
      fileId: id,
      targetUserId: userId,
      canRead: Boolean(canRead),
      canWrite: Boolean(canWrite),
    });

    res.status(201).json({ permission });
  } catch (err: unknown) {
    if (err instanceof DriveShareError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
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
    const ownerId = (req as AuthenticatedRequest).user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id, userId } = req.params;
    const { canRead, canWrite } = req.body;

    const result = await updateFileSharePermission({
      ownerUserId: ownerId,
      fileId: id,
      targetUserId: userId,
      canRead: Boolean(canRead),
      canWrite: Boolean(canWrite),
    });

    res.json({ updated: result.updated });
  } catch (err: unknown) {
    if (err instanceof DriveShareError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
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
    const ownerId = (req as AuthenticatedRequest).user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id, userId } = req.params;

    await revokeFileSharePermission({
      ownerUserId: ownerId,
      fileId: id,
      targetUserId: userId,
    });

    res.json({ revoked: true });
  } catch (err: unknown) {
    if (err instanceof DriveShareError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to revoke permission' });
  }
}

// List trashed files for the user
/** @deprecated Use Global Trash GET /api/trash/items?moduleId=drive instead. */
export async function listTrashedFiles(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    await logger.warn('Deprecated drive-only listTrashedFiles endpoint called', {
      operation: 'drive_trash_api_deprecated',
      endpoint: 'listTrashedFiles',
    });
    const userId = (req as AuthenticatedRequest).user?.id;
    const files = await prisma.file.findMany({
      where: { userId, trashedAt: { not: null } },
      orderBy: { trashedAt: 'desc' },
    });
    res.json({ files });
  } catch (err) {
    await logger.error('Failed to list trashed files', {
      operation: 'file_list_trashed',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    res.status(500).json({ message: 'Failed to list trashed files' });
  }
}

/** @deprecated Use Global Trash POST /api/trash/restore/:id with { moduleId: "drive", type: "file" }. */
export async function restoreFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    await logger.warn('Deprecated drive-only restoreFile endpoint called', {
      operation: 'drive_trash_api_deprecated',
      endpoint: 'restoreFile',
    });
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const restored = await restoreDriveItem({ userId, type: 'file', id });
    if (!restored) {
      return res.status(404).json({ message: 'File not found or not trashed' });
    }
    res.json({ restored: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to restore file' });
  }
}

/** @deprecated Use Global Trash DELETE /api/trash/delete/:id with { moduleId: "drive", type: "file" }. */
export async function hardDeleteFile(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    await logger.warn('Deprecated drive-only hardDeleteFile endpoint called', {
      operation: 'drive_trash_api_deprecated',
      endpoint: 'hardDeleteFile',
    });
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;

    const deleted = await permanentlyDeleteDriveFile({ userId, fileId: id });
    if (!deleted) {
      return res.status(404).json({ message: 'File not found or not trashed' });
    }

    res.json({ deleted: true });
  } catch (err) {
    await logger.error('Failed to hard delete file', {
      operation: 'file_hard_delete',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    res.status(500).json({ message: 'Failed to permanently delete file' });
  }
} 

// Toggle the starred status of a file
export async function toggleFileStarred(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;
  try {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.trashedAt) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!(await canWriteFile(userId, id))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const starPolicyDual = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_UPDATE,
      resourceType: 'file',
      resourceId: id,
      scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
    });
    if (starPolicyDual.blocked) {
      return res.status(403).json({ message: 'Forbidden', reason: starPolicyDual.reason });
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: { starred: !file.starred },
    });

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: updatedFile.starred ? 'pin' : 'unpin',
      targetType: 'file',
      targetId: updatedFile.id,
      parentType: updatedFile.folderId ? 'folder' : undefined,
      parentId: updatedFile.folderId ?? undefined,
      dashboardId: updatedFile.dashboardId,
      metadata: { starred: updatedFile.starred },
    });

    try {
      getChatSocketService().broadcastDriveEvent(file.userId, 'drive:item:pinned', {
        itemId: updatedFile.id,
        itemType: 'file',
        dashboardId: updatedFile.dashboardId,
        folderId: updatedFile.folderId,
        starred: updatedFile.starred,
      });
    } catch (socketError: unknown) {
      const err = socketError instanceof Error ? socketError : new Error(String(socketError));
      await logger.error('Failed to broadcast drive:item:pinned event', {
        operation: 'file_pin_socket_broadcast',
        error: { message: err.message, stack: err.stack },
      });
    }

    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle star on file' });
  }
}

// Get shared items for the current user
export async function getSharedItems(req: Request, res: Response) {
  try {
    if (!hasUserId(req.user)) {
      await logger.error('User authentication check failed in getSharedItems', {
        operation: 'file_get_shared_items',
        user: req.user
      });
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      await logger.error('User ID not found in getSharedItems', {
        operation: 'file_get_shared_items',
        user: (req as AuthenticatedRequest).user
      });
      return res.status(401).json({ message: 'Authentication required' });
    }

    await logger.debug('Fetching shared items', {
      operation: 'file_get_shared_items',
      userId
    });

    // Get files that have been shared with this user
    let sharedFiles: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      url: string;
      path: string | null;
      folderId: string | null;
      dashboardId: string | null;
      userId: string;
      starred: boolean;
      trashedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      order: number;
      user: { id: string; name: string | null; email: string };
      permissions: Array<{ canRead: boolean; canWrite: boolean }>;
    }> = [];
    try {
      sharedFiles = await prisma.file.findMany({
        where: {
          trashedAt: null,
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
    } catch (fileError: unknown) {
      const err = fileError as Error;
      await logger.error('Error fetching shared files', {
        operation: 'file_get_shared_items',
        step: 'fetch_files',
        error: {
          message: err.message,
          stack: err.stack
        },
        userId
      });
      // Continue with empty array - don't fail the entire request
      sharedFiles = [];
    }

    // Get folders that have been shared with this user
    let sharedFolders: Array<{
      id: string;
      name: string;
      parentId: string | null;
      dashboardId: string | null;
      userId: string;
      starred: boolean;
      trashedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      order: number;
      user: { id: string; name: string | null; email: string };
      permissions: Array<{ canRead: boolean; canWrite: boolean }>;
    }> = [];
    try {
      sharedFolders = await prisma.folder.findMany({
        where: {
          trashedAt: null,
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
    } catch (folderError: unknown) {
      const err = folderError as Error;
      await logger.error('Error fetching shared folders', {
        operation: 'file_get_shared_items',
        step: 'fetch_folders',
        error: {
          message: err.message,
          stack: err.stack
        },
        userId
      });
      // Continue with empty array - don't fail the entire request
      sharedFolders = [];
    }

    // Transform the data to include permission information
    const transformedFiles = sharedFiles.map(file => ({
      ...file,
      permission: file.permissions[0]?.canWrite ? 'edit' : 'view'
    }));

    const transformedFolders = sharedFolders.map(folder => ({
      ...folder,
      permission: folder.permissions[0]?.canWrite ? 'edit' : 'view'
    }));

    res.json({
      files: transformedFiles,
      folders: transformedFolders
    });
  } catch (err: unknown) {
    const error = err as Error;
    await logger.error('Failed to get shared items', {
      operation: 'file_get_shared_items',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
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
    const userId = (req as AuthenticatedRequest).user?.id;
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
    await logger.error('Failed to reorder files', {
      operation: 'file_reorder',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
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
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;
    const { targetFolderId } = req.body;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.trashedAt) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    if (!(await canWriteFile(userId, id))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const movePolicyDual = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_MOVE,
      resourceType: 'file',
      resourceId: id,
      scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
      metadata: { targetFolderId: targetFolderId ?? null },
    });
    if (movePolicyDual.blocked) {
      return res.status(403).json({ message: 'Forbidden', reason: movePolicyDual.reason });
    }

    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
        select: { trashedAt: true, dashboardId: true },
      });
      if (!targetFolder || targetFolder.trashedAt) {
        return res.status(400).json({ message: 'Target folder not found or access denied' });
      }
      if (!(await canWriteFolder(userId, targetFolderId))) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const originalFolderId = file.folderId;

    const updatedFile = await prisma.file.update({
      where: { id },
      data: { folderId: targetFolderId || null },
    });

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: 'move',
      targetType: 'file',
      targetId: id,
      parentType: updatedFile.folderId ? 'folder' : undefined,
      parentId: updatedFile.folderId ?? undefined,
      dashboardId: updatedFile.dashboardId,
      metadata: {
        fileName: file.name,
        originalFolderId,
        newFolderId: targetFolderId,
      },
    });

    emitFileMovedEvent({
      actorUserId: userId,
      fileId: id,
      fileName: file.name,
      folderId: updatedFile.folderId,
      previousFolderId: originalFolderId,
      dashboardId: updatedFile.dashboardId,
    });

    // Broadcast real-time drive event to owner
    try {
      const socketService = getChatSocketService();
      socketService.broadcastDriveEvent(userId, 'drive:item:moved', {
        itemId: id,
        itemType: 'file',
        dashboardId: updatedFile.dashboardId,
        folderId: updatedFile.folderId,
        originalFolderId,
      });
    } catch (socketError) {
      await logger.error('Failed to broadcast drive:item:moved event', {
        operation: 'file_move_socket_broadcast',
        error: {
          message: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined
        }
      });
    }

    res.json({ file: updatedFile, message: 'File moved successfully' });
  } catch (err) {
    await logger.error('Failed to move file', {
      operation: 'file_move',
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }
    });
    res.status(500).json({ message: 'Failed to move file' });
  }
} 