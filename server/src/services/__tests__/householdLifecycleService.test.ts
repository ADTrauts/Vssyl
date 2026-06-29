import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatLifecycle from '../chat/chatDashboardLifecycleService';
import * as fileMigrationService from '../fileMigrationService';
import {
  deleteHouseholdCascadeForOwner,
  findUserPrimaryHousehold,
  hasActiveHouseholdDashboard,
} from '../householdLifecycleService';

vi.mock('../chat/chatDashboardLifecycleService');
vi.mock('../fileMigrationService');

describe('householdLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatLifecycle.prepareDashboardTabDeletion).mockResolvedValue(undefined);
    vi.mocked(fileMigrationService.releaseDashboardTabStorageRefs).mockResolvedValue({
      filesReleased: 0,
      foldersReleased: 0,
    });
  });

  it('hasActiveHouseholdDashboard is false when only trashed tabs exist', async () => {
    vi.spyOn(prisma.dashboard, 'count').mockResolvedValue(0);

    await expect(hasActiveHouseholdDashboard('u1', 'h1')).resolves.toBe(false);
    expect(prisma.dashboard.count).toHaveBeenCalledWith({
      where: { userId: 'u1', householdId: 'h1', trashedAt: null },
    });
  });

  it('deleteHouseholdCascadeForOwner removes dashboards, members, and household', async () => {
    vi.spyOn(prisma.householdMember, 'findFirst').mockResolvedValue({ id: 'm1' } as never);
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([{ id: 'd1' }] as never);
    vi.spyOn(prisma.widget, 'deleteMany').mockResolvedValue({ count: 0 } as never);
    vi.spyOn(prisma.retentionPolicy, 'deleteMany').mockResolvedValue({ count: 0 } as never);
    vi.spyOn(prisma.complianceSettings, 'deleteMany').mockResolvedValue({ count: 0 } as never);
    vi.spyOn(prisma.dashboard, 'deleteMany').mockResolvedValue({ count: 1 } as never);
    vi.spyOn(prisma.calendar, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.householdMember, 'deleteMany').mockResolvedValue({ count: 1 } as never);
    vi.spyOn(prisma.household, 'delete').mockResolvedValue({ id: 'h1' } as never);

    await deleteHouseholdCascadeForOwner('u1', 'h1');

    expect(prisma.household.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
    expect(chatLifecycle.prepareDashboardTabDeletion).toHaveBeenCalledWith({
      actorUserId: 'u1',
      dashboardId: 'd1',
    });
  });

  it('findUserPrimaryHousehold scopes to owner membership', async () => {
    vi.spyOn(prisma.household, 'findFirst').mockResolvedValue({ id: 'h1' } as never);

    const household = await findUserPrimaryHousehold('u1');

    expect(household?.id).toBe('h1');
    expect(prisma.household.findFirst).toHaveBeenCalled();
  });
});
