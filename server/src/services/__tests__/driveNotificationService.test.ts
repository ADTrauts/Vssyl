import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import {
  collectFileCollaboratorIds,
  notifyDriveItemRestored,
  notifyDriveItemTrashed,
  notifyDriveItemPermanentlyDeleted,
  notifyDrivePermissionUpdated,
} from '../driveNotificationService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    handleNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('driveNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('collectFileCollaboratorIds returns owner and permission holders excluding actor', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      userId: 'owner-1',
      permissions: [{ userId: 'collab-1' }, { userId: 'collab-2' }],
    } as never);

    const result = await collectFileCollaboratorIds('file-1', 'collab-1');

    expect(result.ownerId).toBe('owner-1');
    expect(result.recipientIds.sort()).toEqual(['collab-2', 'owner-1'].sort());
  });

  it('notifyDriveItemRestored excludes acting user and emits drive_item_restored', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      userId: 'owner-1',
      permissions: [{ userId: 'collab-1' }],
    } as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Alice', email: 'a@test.com' } as never);

    await notifyDriveItemRestored({
      actorUserId: 'collab-1',
      itemType: 'file',
      itemId: 'file-1',
      itemName: 'report.pdf',
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drive_item_restored',
        senderId: 'collab-1',
        recipients: ['owner-1'],
      })
    );
  });

  it('notifyDriveItemTrashed prevents self-notification when owner trashes own file', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      userId: 'owner-1',
      permissions: [],
    } as never);

    await notifyDriveItemTrashed({
      actorUserId: 'owner-1',
      itemType: 'file',
      itemId: 'file-1',
      itemName: 'solo.pdf',
      trashedAt: new Date(),
    });

    expect(NotificationService.handleNotification).not.toHaveBeenCalled();
  });

  it('notifyDriveItemTrashed notifies collaborators on soft delete', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      userId: 'owner-1',
      permissions: [{ userId: 'collab-1' }],
    } as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Bob', email: 'b@test.com' } as never);

    await notifyDriveItemTrashed({
      actorUserId: 'owner-1',
      itemType: 'file',
      itemId: 'file-1',
      itemName: 'shared.pdf',
      trashedAt: new Date(),
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drive_item_deleted',
        recipients: ['collab-1'],
        data: expect.objectContaining({ softDelete: true, permanent: false }),
      })
    );
  });

  it('notifyDriveItemPermanentlyDeleted uses safe metadata without leaking content', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Owner', email: 'o@test.com' } as never);

    await notifyDriveItemPermanentlyDeleted({
      actorUserId: 'owner-1',
      itemType: 'file',
      itemId: 'file-1',
      itemName: 'gone.pdf',
      recipientIds: ['owner-1', 'collab-1'],
      deletedAt: new Date('2026-05-31T12:00:00Z'),
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drive_item_deleted',
        recipients: ['collab-1'],
        data: expect.objectContaining({
          itemId: 'file-1',
          itemName: 'gone.pdf',
          permanent: true,
        }),
      })
    );
  });

  it('notifyDrivePermissionUpdated uses drive_permission for role changes', async () => {
    await notifyDrivePermissionUpdated({
      ownerUserId: 'owner-1',
      targetUserId: 'collab-1',
      itemType: 'file',
      itemId: 'file-1',
      itemName: 'doc.pdf',
      canRead: true,
      canWrite: false,
      ownerName: 'Owner',
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drive_permission',
        recipients: ['collab-1'],
        senderId: 'owner-1',
        data: expect.objectContaining({ action: 'updated' }),
      })
    );
  });

  it('dedupes duplicate recipient ids on permanent delete', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Owner', email: 'o@test.com' } as never);

    await notifyDriveItemPermanentlyDeleted({
      actorUserId: 'owner-1',
      itemType: 'folder',
      itemId: 'folder-1',
      itemName: 'Archive',
      recipientIds: ['collab-1', 'collab-1', 'owner-1'],
      deletedAt: new Date(),
    });

    expect(NotificationService.handleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: ['collab-1'],
      })
    );
  });
});
