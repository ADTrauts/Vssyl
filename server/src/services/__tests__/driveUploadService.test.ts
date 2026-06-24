import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import * as driveHelpers from '../drivePermissionHelpers';
import { storageService } from '../storageService';
import { emitModuleActivityEvent } from '../moduleActivityService';
import { emitFileUploadedEvent } from '../../events/domainEventEmitters';
import { createDriveFile, DriveUploadError } from '../driveUploadService';

vi.mock('../moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue('evt_test'),
}));

vi.mock('../../events/domainEventEmitters', () => ({
  emitFileUploadedEvent: vi.fn(),
}));

const broadcastDriveEvent = vi.fn();

vi.mock('../chatSocketService', () => ({
  getChatSocketService: vi.fn(() => ({
    broadcastDriveEvent,
  })),
}));

describe('driveUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(storageService, 'uploadFile').mockResolvedValue({
      url: 'https://example.com/f.png',
      path: 'files/u1.png',
    });
    vi.spyOn(prisma.file, 'create').mockResolvedValue({
      id: 'file-1',
      userId: 'user-1',
      name: 'ai.png',
      type: 'image/png',
      size: 100,
      url: 'https://example.com/f.png',
      path: 'files/u1.png',
      folderId: null,
      dashboardId: null,
    } as never);
  });

  it('createDriveFile runs PE, storage, module activity, domain event, and realtime', async () => {
    const record = await createDriveFile({
      userId: 'user-1',
      source: {
        buffer: Buffer.from('x'),
        originalname: 'ai.png',
        mimetype: 'image/png',
        size: 1,
      },
    });

    expect(record.id).toBe('file-1');
    expect(drivePolicyDual.evaluateDrivePolicyDual).toHaveBeenCalled();
    expect(storageService.uploadFile).toHaveBeenCalled();
    expect(emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ moduleId: 'drive', action: 'create', targetId: 'file-1' })
    );
    expect(emitFileUploadedEvent).toHaveBeenCalled();
    expect(broadcastDriveEvent).toHaveBeenCalledWith(
      'user-1',
      'drive:item:created',
      expect.objectContaining({ itemId: 'file-1' })
    );
  });

  it('createDriveFile validates folder write access', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      dashboardId: 'dash-1',
      trashedAt: null,
    } as never);
    vi.spyOn(driveHelpers, 'canWriteFolder').mockResolvedValue(false);

    await expect(
      createDriveFile({
        userId: 'user-1',
        source: {
          buffer: Buffer.from('x'),
          originalname: 'ai.png',
          mimetype: 'image/png',
          size: 1,
        },
        folderId: 'folder-1',
      })
    ).rejects.toBeInstanceOf(DriveUploadError);
  });
});
