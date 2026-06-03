import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { NotificationService } from '../notificationService';

export async function notifyPageShared(params: {
  pageId: string;
  pageTitle: string;
  sharedById: string;
  sharedWithUserId: string;
  role: 'viewer' | 'editor';
}): Promise<void> {
  try {
    const sharer = await prisma.user.findUnique({
      where: { id: params.sharedById },
      select: { name: true },
    });
    const sharerName = sharer?.name ?? 'Someone';
    await NotificationService.createNotification({
      type: 'notes_shared',
      title: 'Page shared with you',
      body: `${sharerName} shared "${params.pageTitle}" with you as ${params.role}.`,
      userId: params.sharedWithUserId,
      data: {
        noteId: params.pageId,
        pageId: params.pageId,
        sharedById: params.sharedById,
        role: params.role,
        noteTitle: params.pageTitle,
        actionUrl: '/notebook',
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Failed to send notes_shared notification', {
      operation: 'notes_share_notification',
      error: { message: err.message, stack: err.stack },
    });
  }
}
