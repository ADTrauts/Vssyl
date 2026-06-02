import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as vlinkEmitters from '../../events/vlinkDomainEventEmitters';
import { unlinkTodoTaskFromAllVLinks } from '../todoVlinkLifecycleService';

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('todoVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unlinks TODO and TASK V_Link rows on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.TODO,
        entityId: 'task-1',
        vlink: { dashboardId: 'd1', businessId: null, householdId: null },
      },
      {
        id: 'link-2',
        vlinkId: 'vl-2',
        entityType: VLinkEntityType.TASK,
        entityId: 'task-1',
        vlink: { dashboardId: 'd1', businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 2 });
    const emitSpy = vi
      .spyOn(vlinkEmitters, 'emitVLinkEntityUnlinkedEvent')
      .mockReturnValue({ id: 'evt-1' } as never);

    const count = await unlinkTodoTaskFromAllVLinks({
      actorUserId: 'u1',
      taskId: 'task-1',
    });

    expect(count).toBe(2);
    expect(emitSpy).toHaveBeenCalledTimes(2);
  });

  it('logs but does not throw when unlink event emission fails', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.TODO,
        entityId: 'task-1',
        vlink: { dashboardId: 'd1', businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });
    vi.spyOn(vlinkEmitters, 'emitVLinkEntityUnlinkedEvent').mockImplementation(() => {
      throw new Error('emit failed');
    });

    await expect(
      unlinkTodoTaskFromAllVLinks({ actorUserId: 'u1', taskId: 'task-1' })
    ).resolves.toBe(1);
  });
});
