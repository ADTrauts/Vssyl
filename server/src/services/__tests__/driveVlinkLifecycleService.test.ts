import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as vlinkEvents from '../../events/vlinkDomainEventEmitters';
import { unlinkDriveEntityFromAllVLinks } from '../driveVlinkLifecycleService';

describe('driveVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('soft-unlinks all V_Link rows on permanent file delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.FILE,
        entityId: 'file-1',
        vlink: { dashboardId: null, businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkDriveEntityFromAllVLinks({
      actorUserId: 'owner-1',
      entityType: VLinkEntityType.FILE,
      entityId: 'file-1',
    });

    expect(count).toBe(1);
    expect(prisma.vLinkEntity.updateMany).toHaveBeenCalled();
    expect(vlinkEvents.emitVLinkEntityUnlinkedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: VLinkEntityType.FILE,
        entityId: 'file-1',
      })
    );
  });

  it('returns zero when no links exist', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([] as never);
    const count = await unlinkDriveEntityFromAllVLinks({
      actorUserId: 'owner-1',
      entityType: VLinkEntityType.FOLDER,
      entityId: 'folder-1',
    });
    expect(count).toBe(0);
  });
});
