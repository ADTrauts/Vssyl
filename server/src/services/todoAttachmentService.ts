import type { Express } from 'express';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { assertCanWriteTask } from './todoPermissionService';
import { storageService } from './storageService';

export async function uploadAttachment(params: {
  userId: string;
  taskId: string;
  file: Express.Multer.File;
}) {
  if (!params.file) {
    throw new TodoServiceError('No file uploaded', 'invalid', 400);
  }

  await assertCanWriteTask(params.taskId, params.userId);

  const fileExtension = path.extname(params.file.originalname);
  const uniqueFilename = `task-attachments/${params.taskId}/${params.userId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

  const uploadResult = await storageService.uploadFile(params.file, uniqueFilename, {
    makePublic: true,
    metadata: {
      userId: params.userId,
      taskId: params.taskId,
      originalName: params.file.originalname,
    },
  });

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId: params.taskId,
      name: params.file.originalname,
      url: uploadResult.url,
      size: params.file.size,
      mimeType: params.file.mimetype,
    },
  });

  await logger.info('Task attachment uploaded', {
    operation: 'todo_upload_attachment',
    taskId: params.taskId,
    attachmentId: attachment.id,
    userId: params.userId,
  });

  return attachment;
}

async function getAttachmentForTask(
  userId: string,
  taskId: string,
  attachmentId: string
) {
  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, taskId },
    include: {
      task: {
        select: { createdById: true, assignedToId: true },
      },
    },
  });

  if (!attachment) {
    throw new TodoServiceError('Attachment not found', 'not_found', 404);
  }

  const hasAccess =
    attachment.task.createdById === userId ||
    attachment.task.assignedToId === userId;
  if (!hasAccess) {
    throw new TodoServiceError('Access denied', 'forbidden', 403);
  }

  return attachment;
}

export async function deleteAttachment(params: {
  userId: string;
  taskId: string;
  attachmentId: string;
}) {
  const attachment = await getAttachmentForTask(
    params.userId,
    params.taskId,
    params.attachmentId
  );

  if (attachment.url) {
    try {
      const urlObj = new URL(attachment.url);
      const pathToDelete = urlObj.pathname.startsWith('/')
        ? urlObj.pathname.substring(1)
        : urlObj.pathname;
      await storageService.deleteFile(pathToDelete);
    } catch (storageError: unknown) {
      await logger.error('Failed to delete file from storage', {
        operation: 'todo_delete_attachment_storage',
        attachmentId: params.attachmentId,
        error: {
          message:
            storageError instanceof Error ? storageError.message : 'Unknown error',
        },
      });
    }
  }

  await prisma.taskAttachment.delete({ where: { id: params.attachmentId } });

  await logger.info('Task attachment deleted', {
    operation: 'todo_delete_attachment',
    taskId: params.taskId,
    attachmentId: params.attachmentId,
    userId: params.userId,
  });

  return { success: true as const };
}

export async function serveAttachment(params: {
  userId: string;
  taskId: string;
  attachmentId: string;
}) {
  const attachment = await getAttachmentForTask(
    params.userId,
    params.taskId,
    params.attachmentId
  );

  if (!attachment.url) {
    throw new TodoServiceError('Attachment URL not found', 'not_found', 404);
  }

  let filePath: string;
  if (attachment.url.includes('storage.googleapis.com')) {
    const urlParts = attachment.url.split('/');
    const bucketIndex = urlParts.findIndex((part) =>
      part.includes('storage.googleapis.com')
    );
    if (bucketIndex >= 0 && urlParts[bucketIndex + 1]) {
      filePath = urlParts.slice(bucketIndex + 1).join('/');
    } else {
      throw new TodoServiceError('Invalid GCS URL format', 'invalid', 400);
    }
  } else if (attachment.url.includes('/uploads/')) {
    filePath = attachment.url.split('/uploads/')[1];
  } else {
    throw new TodoServiceError('Unsupported URL format', 'invalid', 400);
  }

  const fileBuffer = await storageService.getFileBuffer(filePath);

  return {
    buffer: fileBuffer,
    contentType: attachment.mimeType || 'application/octet-stream',
    filename: attachment.name,
  };
}
