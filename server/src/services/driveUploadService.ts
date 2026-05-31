import path from 'path';
import type { File } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { canWriteFolder } from './drivePermissionHelpers';
import { storageService } from './storageService';
import { emitModuleActivityEvent } from './moduleActivityService';
import { emitFileUploadedEvent } from '../events/domainEventEmitters';
import { getChatSocketService } from './chatSocketService';
import { getOrCreateChatFilesFolder } from './driveService';
import { assertUserOwnsDashboard } from './taskDashboardBinding';
import { logger } from '../lib/logger';

export class DriveUploadError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'DriveUploadError';
  }
}

export type DriveUploadBufferSource = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type DriveUploadSource = Express.Multer.File | DriveUploadBufferSource;

export interface CreateDriveFileInput {
  userId: string;
  source: DriveUploadSource;
  folderId?: string | null;
  dashboardId?: string | null;
  /** When true, resolves Chat Files folder (same as HTTP upload `chat` flag). */
  chat?: boolean;
}

function toTrimmedString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function sourceToMulterLike(source: DriveUploadSource): Express.Multer.File {
  if ('fieldname' in source) return source;
  return {
    fieldname: 'file',
    originalname: source.originalname,
    encoding: '7bit',
    mimetype: source.mimetype,
    buffer: source.buffer,
    size: source.size,
  } as Express.Multer.File;
}

async function resolveUploadTarget(
  userId: string,
  folderId: string | null | undefined,
  dashboardId: string | null | undefined,
  chat?: boolean
): Promise<{ folderIdStr: string | null; effectiveDashboardId: string | null }> {
  let folderIdStr = toTrimmedString(folderId);

  if (chat) {
    const chatFolder = await getOrCreateChatFilesFolder(userId);
    folderIdStr = chatFolder.id;
  }

  const dashboardIdStr = toTrimmedString(dashboardId);
  let folderRow: { dashboardId: string | null } | null = null;

  if (folderIdStr) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderIdStr },
      select: { dashboardId: true, trashedAt: true },
    });
    if (!folder || folder.trashedAt) {
      throw new DriveUploadError('Folder not found', 404);
    }
    if (!(await canWriteFolder(userId, folderIdStr))) {
      throw new DriveUploadError('Access denied', 403);
    }
    const uploadPolicyDual = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_UPLOAD,
      resourceType: 'folder',
      resourceId: folderIdStr,
      scope: folder.dashboardId ? { dashboardId: folder.dashboardId } : undefined,
    });
    if (uploadPolicyDual.blocked) {
      throw new DriveUploadError('Access denied', 403);
    }
    folderRow = folder;
    if (dashboardIdStr !== null && (folder.dashboardId ?? null) !== dashboardIdStr) {
      throw new DriveUploadError('folderId does not match dashboardId', 400);
    }
  }

  const effectiveDashboardId = dashboardIdStr ?? folderRow?.dashboardId ?? null;

  if (!folderIdStr) {
    const rootUploadPolicyDual = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_UPLOAD,
      resourceType: 'folder',
      resourceId: userId,
      metadata: { uploadRoot: true },
      scope: effectiveDashboardId ? { dashboardId: effectiveDashboardId } : undefined,
    });
    if (rootUploadPolicyDual.blocked) {
      throw new DriveUploadError('Access denied', 403);
    }
  }

  if (effectiveDashboardId) {
    try {
      await assertUserOwnsDashboard(prisma, userId, effectiveDashboardId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'Task dashboard not found') {
        throw new DriveUploadError('Access denied', 403);
      }
      throw err;
    }
  }

  return { folderIdStr, effectiveDashboardId };
}

/**
 * Canonical File Hub file creation — used by HTTP upload and AI save-to-drive (FH-4).
 * Policy Engine → storage → persistence → domain event → module activity → realtime.
 */
export async function createDriveFile(input: CreateDriveFileInput): Promise<File> {
  const { userId, source, chat } = input;
  const fileLike = sourceToMulterLike(source);
  const { originalname, mimetype, size } = fileLike;

  if (!originalname || originalname.trim() === '') {
    throw new DriveUploadError('File name is required', 400);
  }

  const { folderIdStr, effectiveDashboardId } = await resolveUploadTarget(
    userId,
    input.folderId,
    input.dashboardId,
    chat
  );

  const fileExtension = path.extname(originalname);
  const uniqueFilename = `files/${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;

  const uploadResult = await storageService.uploadFile(fileLike, uniqueFilename, {
    makePublic: true,
    metadata: {
      userId,
      originalName: originalname,
      folderId: folderIdStr || '',
      dashboardId: effectiveDashboardId || '',
    },
  });

  const fileRecord = await prisma.file.create({
    data: {
      userId,
      name: originalname,
      type: mimetype,
      size,
      url: uploadResult.url,
      path: uploadResult.path,
      folderId: folderIdStr || null,
      dashboardId: effectiveDashboardId,
    },
  });

  await emitModuleActivityEvent({
    actorUserId: userId,
    moduleId: 'drive',
    action: 'create',
    targetType: 'file',
    targetId: fileRecord.id,
    parentType: fileRecord.folderId ? 'folder' : undefined,
    parentId: fileRecord.folderId ?? undefined,
    dashboardId: fileRecord.dashboardId,
    metadata: {
      fileName: originalname,
      fileType: mimetype,
      fileSize: size,
      source: chat ? 'chat' : 'upload',
    },
  });

  emitFileUploadedEvent({
    actorUserId: userId,
    fileId: fileRecord.id,
    folderId: fileRecord.folderId,
    fileType: mimetype,
    fileName: originalname,
    sizeBytes: size,
    dashboardId: fileRecord.dashboardId,
  });

  try {
    getChatSocketService().broadcastDriveEvent(userId, 'drive:item:created', {
      itemId: fileRecord.id,
      itemType: 'file',
      dashboardId: fileRecord.dashboardId,
      folderId: fileRecord.folderId,
    });
  } catch (socketError: unknown) {
    const err = socketError instanceof Error ? socketError : new Error(String(socketError));
    void logger.error('Failed to broadcast drive:item:created event', {
      operation: 'drive_upload_socket_broadcast',
      error: { message: err.message, stack: err.stack },
    });
  }

  return fileRecord;
}
