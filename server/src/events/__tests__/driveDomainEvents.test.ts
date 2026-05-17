import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emitFileDeletedEvent,
  emitFileUploadedEvent,
  emitFolderSharedEvent,
} from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';

describe('Drive domain events (DE-D1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('file.uploaded uses safe metadata only', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e1' } as never);

    emitFileUploadedEvent({
      actorUserId: 'u1',
      fileId: 'file-1',
      folderId: 'folder-a',
      fileType: 'text/plain',
      sizeBytes: 100,
      dashboardId: 'dash-1',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'file.uploaded',
        entityId: 'file-1',
        metadata: {
          folderId: 'folder-a',
          fileType: 'text/plain',
          sizeBytes: 100,
          dashboardId: 'dash-1',
        },
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> }).metadata;
    expect(meta).not.toHaveProperty('url');
    expect(meta).not.toHaveProperty('path');
  });

  it('file.deleted includes softDelete flag', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e2' } as never);

    emitFileDeletedEvent({
      actorUserId: 'u1',
      fileId: 'file-1',
      folderId: 'folder-a',
      softDelete: true,
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'file.deleted',
        metadata: expect.objectContaining({ softDelete: true, folderId: 'folder-a' }),
      })
    );
  });

  it('folder.shared includes recipient and shareRole', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e3' } as never);

    emitFolderSharedEvent({
      actorUserId: 'owner-1',
      folderId: 'folder-1',
      recipientUserId: 'collab-1',
      canRead: true,
      canWrite: false,
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'folder.shared',
        metadata: expect.objectContaining({
          recipientUserId: 'collab-1',
          shareRole: 'read',
        }),
      })
    );
  });
});
