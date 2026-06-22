import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as fileMigrationService from '../fileMigrationService';
import * as chatLifecycle from '../chat/chatDashboardLifecycleService';
import * as dashboardDomainEvents from '../dashboardDomainEventService';
import * as dashboardActivity from '../dashboardActivityService';
import { deleteDashboardWithFiles } from '../dashboardService';

describe('dashboardService deleteDashboardWithFiles (Package 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatLifecycle, 'prepareDashboardTabDeletion').mockResolvedValue(undefined);
    vi.spyOn(dashboardActivity, 'recordDashboardDeleted').mockResolvedValue(undefined);
    vi.spyOn(dashboardDomainEvents, 'recordDashboardTabDeletedDomainEvent').mockImplementation(() => undefined);
  });

  it('orchestrates file migration then dashboard delete', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'u1' } as never);
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      name: 'Personal',
      businessId: null,
      institutionId: null,
      householdId: null,
      widgets: [],
    } as never);

    vi.spyOn(fileMigrationService, 'moveFilesToMainDrive').mockResolvedValue({
      filesProcessed: 1,
      foldersProcessed: 0,
      totalSize: 100,
    } as never);

    vi.spyOn(prisma.widget, 'deleteMany').mockResolvedValue({ count: 0 } as never);
    vi.spyOn(prisma.dashboard, 'deleteMany').mockResolvedValue({ count: 1 } as never);

    const result = await deleteDashboardWithFiles('u1', 'd1', {
      type: 'move-to-main',
      createFolder: true,
      folderName: 'Archive',
    });

    expect(fileMigrationService.moveFilesToMainDrive).toHaveBeenCalled();
    expect(chatLifecycle.prepareDashboardTabDeletion).toHaveBeenCalledWith({
      actorUserId: 'u1',
      dashboardId: 'd1',
    });
    expect(result?.deleted).toBe(1);
    expect(dashboardDomainEvents.recordDashboardTabDeletedDomainEvent).toHaveBeenCalled();
  });
});
