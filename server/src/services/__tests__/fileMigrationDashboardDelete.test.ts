import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  findFallbackPersonalDashboardId,
  moveFilesToMainDrive,
  releaseDashboardTabStorageRefs,
} from '../fileMigrationService';

describe('fileMigrationService dashboard delete helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findFallbackPersonalDashboardId excludes the tab being deleted', async () => {
    const findFirst = vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'main-dash',
    } as never);

    const id = await findFallbackPersonalDashboardId('user-1', 'tab-to-delete');

    expect(id).toBe('main-dash');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          id: { not: 'tab-to-delete' },
        }),
        orderBy: { createdAt: 'asc' },
      })
    );
  });

  it('releaseDashboardTabStorageRefs reassigns files to fallback dashboard', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({ id: 'main-dash' } as never);
    vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 2 } as never);
    vi.spyOn(prisma.folder, 'updateMany').mockResolvedValue({ count: 1 } as never);

    const result = await releaseDashboardTabStorageRefs('user-1', 'tab-to-delete');

    expect(result).toEqual({ filesReleased: 2, foldersReleased: 1 });
    expect(prisma.file.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', dashboardId: 'tab-to-delete' },
      data: { dashboardId: 'main-dash' },
    });
  });

  it('moveFilesToMainDrive detaches files when no other personal tab exists', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue(null);
    const fileUpdate = vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 1 } as never);
    const folderUpdate = vi.spyOn(prisma.folder, 'updateMany').mockResolvedValue({ count: 0 } as never);

    const result = await moveFilesToMainDrive('user-1', 'only-tab', {
      createFolder: true,
      folderName: 'Archive',
    });

    expect(result.movedFiles).toBe(1);
    expect(fileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dashboardId: null }),
      })
    );
    expect(folderUpdate).toHaveBeenCalled();
  });
});
