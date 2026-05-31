import { getChatSocketService } from './chatSocketService';
import { logger } from '../lib/logger';

type DriveSocketEvent =
  | 'drive:item:created'
  | 'drive:item:updated'
  | 'drive:item:deleted'
  | 'drive:item:moved'
  | 'drive:item:pinned';

/** Fan-out a drive realtime event to one or more users (deduped). */
export function broadcastDriveEventToUsers(
  userIds: string[],
  event: DriveSocketEvent,
  data: Record<string, unknown>
): void {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueUserIds.length === 0) return;

  try {
    const socketService = getChatSocketService();
    for (const userId of uniqueUserIds) {
      socketService.broadcastDriveEvent(userId, event, data);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to broadcast drive event to users', {
      operation: 'drive_realtime_broadcast',
      event,
      userIds: uniqueUserIds,
      error: { message: err.message, stack: err.stack },
    });
  }
}

/** Notify owner and collaborator when share permissions change (FH-2). */
export function broadcastDriveShareChange(params: {
  ownerUserId: string;
  recipientUserId: string;
  itemId: string;
  itemType: 'file' | 'folder';
  action: 'share' | 'unshare';
  dashboardId?: string | null;
  folderId?: string | null;
}): void {
  broadcastDriveEventToUsers(
    [params.ownerUserId, params.recipientUserId],
    'drive:item:updated',
    {
      itemId: params.itemId,
      itemType: params.itemType,
      dashboardId: params.dashboardId ?? null,
      folderId: params.folderId ?? null,
      shareChange: params.action,
    }
  );
}
