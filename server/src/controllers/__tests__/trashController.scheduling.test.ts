import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { deleteItem, listTrashedItems, restoreItem, trashItem } from '../trashController';
import {
  clearGlobalTrashModuleHandlersForTests,
  registerGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import * as schedulingTrashService from '../../services/schedulingTrashService';
import type { SchedulingTrashItemType } from '../../services/schedulingTrashService';
import * as driveVisibility from '../../services/driveVisibilityService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/schedulingTrashService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/schedulingTrashService')>();
  return {
    ...actual,
    softTrashSchedulingItem: vi.fn(),
    restoreSchedulingItem: vi.fn(),
    permanentlyDeleteSchedulingItem: vi.fn(),
    emptySchedulingTrash: vi.fn(),
    listTrashedSchedulingItemsForGlobalTrash: vi.fn(),
  };
});

vi.mock('../../services/driveVisibilityService', () => ({
  listAccessibleTrashedFiles: vi.fn().mockResolvedValue([]),
  listAccessibleTrashedFolders: vi.fn().mockResolvedValue([]),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('trashController scheduling integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGlobalTrashModuleHandlersForTests();
    registerGlobalTrashModuleHandler({
      moduleId: 'scheduling',
      moduleName: 'Scheduling',
      supportedTypes: ['schedule', 'shift', 'schedule_template'],
      softTrash: (input) =>
        schedulingTrashService.softTrashSchedulingItem({
          userId: input.userId,
          type: input.type as SchedulingTrashItemType,
          id: input.id,
          metadata: input.metadata as Record<string, unknown> | undefined,
        }),
      restore: (input) =>
        schedulingTrashService.restoreSchedulingItem({
          userId: input.userId,
          type: input.type as SchedulingTrashItemType,
          id: input.id,
          metadata: input.metadata as Record<string, unknown> | undefined,
        }),
      permanentDelete: (input) =>
        schedulingTrashService.permanentlyDeleteSchedulingItem({
          userId: input.userId,
          type: input.type as SchedulingTrashItemType,
          id: input.id,
          metadata: input.metadata as Record<string, unknown> | undefined,
        }),
      emptyModuleTrash: (input) => schedulingTrashService.emptySchedulingTrash(input),
      listTrashed: (input) =>
        schedulingTrashService.listTrashedSchedulingItemsForGlobalTrash(input.userId),
    });
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);
  });

  it('trashItem delegates schedule to scheduling handler', async () => {
    vi.mocked(schedulingTrashService.softTrashSchedulingItem).mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      body: {
        id: 'sched-1',
        name: 'Week 12',
        type: 'schedule',
        moduleId: 'scheduling',
        moduleName: 'Scheduling',
        metadata: { businessId: 'biz-1' },
      },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(schedulingTrashService.softTrashSchedulingItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'schedule',
      id: 'sched-1',
      metadata: { businessId: 'biz-1' },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item moved to trash' })
    );
  });

  it('restoreItem delegates scheduling schedule restore', async () => {
    vi.mocked(schedulingTrashService.restoreSchedulingItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'sched-1' },
      query: { moduleId: 'scheduling', type: 'schedule' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await restoreItem(req, res);

    expect(schedulingTrashService.restoreSchedulingItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'schedule',
      id: 'sched-1',
      metadata: undefined,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item restored' })
    );
  });

  it('listTrashedItems includes scheduling handler results', async () => {
    vi.mocked(schedulingTrashService.listTrashedSchedulingItemsForGlobalTrash).mockResolvedValue([
      {
        id: 'sched-1',
        name: 'Week 12',
        type: 'schedule',
        moduleId: 'scheduling',
        moduleName: 'Scheduling',
        trashedAt: new Date(),
        metadata: { businessId: 'biz-1' },
      },
    ]);

    const req = { user: { id: 'user-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'sched-1', moduleId: 'scheduling', type: 'schedule' }),
        ]),
      })
    );
  });

  it('deleteItem delegates scheduling permanent delete', async () => {
    vi.mocked(schedulingTrashService.permanentlyDeleteSchedulingItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'sched-1' },
      query: { moduleId: 'scheduling', type: 'schedule' },
    } as unknown as Request;
    const res = mockResponse();

    await deleteItem(req, res);

    expect(schedulingTrashService.permanentlyDeleteSchedulingItem).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item permanently deleted' })
    );
  });
});
