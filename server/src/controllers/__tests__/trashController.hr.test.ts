import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { deleteItem, listTrashedItems, restoreItem, trashItem } from '../trashController';
import {
  clearGlobalTrashModuleHandlersForTests,
  registerGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import * as hrTrashService from '../../services/hrTrashService';
import type { HRTrashItemType } from '../../services/hrTrashService';
import * as driveVisibility from '../../services/driveVisibilityService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/hrTrashService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/hrTrashService')>();
  return {
    ...actual,
    softTrashHRItem: vi.fn(),
    restoreHRItem: vi.fn(),
    permanentlyDeleteHRItem: vi.fn(),
    emptyHRTrash: vi.fn(),
    listTrashedEmployeeProfilesForGlobalTrash: vi.fn(),
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

describe('trashController hr integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGlobalTrashModuleHandlersForTests();
    registerGlobalTrashModuleHandler({
      moduleId: 'hr',
      moduleName: 'HR',
      supportedTypes: ['employee_profile'],
      softTrash: (input) =>
        hrTrashService.softTrashHRItem({
          userId: input.userId,
          type: input.type as HRTrashItemType,
          id: input.id,
          metadata: input.metadata as Record<string, unknown> | undefined,
        }),
      restore: (input) =>
        hrTrashService.restoreHRItem({
          userId: input.userId,
          type: input.type as HRTrashItemType,
          id: input.id,
          metadata: input.metadata as Record<string, unknown> | undefined,
        }),
      permanentDelete: (input) =>
        hrTrashService.permanentlyDeleteHRItem({
          userId: input.userId,
          type: input.type as HRTrashItemType,
          id: input.id,
          metadata: input.metadata as Record<string, unknown> | undefined,
        }),
      emptyModuleTrash: (input) => hrTrashService.emptyHRTrash(input),
      listTrashed: (input) =>
        hrTrashService.listTrashedEmployeeProfilesForGlobalTrash(input.userId),
    });
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);
  });

  it('trashItem delegates employee_profile to hr handler', async () => {
    vi.mocked(hrTrashService.softTrashHRItem).mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      body: {
        id: 'profile-1',
        name: 'Jane Doe',
        type: 'employee_profile',
        moduleId: 'hr',
        moduleName: 'HR',
        metadata: { businessId: 'biz-1' },
      },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(hrTrashService.softTrashHRItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'employee_profile',
      id: 'profile-1',
      metadata: { businessId: 'biz-1' },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item moved to trash' })
    );
  });

  it('restoreItem delegates hr employee_profile restore', async () => {
    vi.mocked(hrTrashService.restoreHRItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'profile-1' },
      query: { moduleId: 'hr', type: 'employee_profile' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await restoreItem(req, res);

    expect(hrTrashService.restoreHRItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'employee_profile',
      id: 'profile-1',
      metadata: undefined,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item restored' })
    );
  });

  it('listTrashedItems includes hr handler results', async () => {
    vi.mocked(hrTrashService.listTrashedEmployeeProfilesForGlobalTrash).mockResolvedValue([
      {
        id: 'profile-1',
        name: 'Jane Doe',
        type: 'employee_profile',
        moduleId: 'hr',
        moduleName: 'HR',
        trashedAt: new Date(),
        metadata: { businessId: 'biz-1', employeePositionId: 'ep-1' },
      },
    ]);

    const req = { user: { id: 'user-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'profile-1', moduleId: 'hr', type: 'employee_profile' }),
        ]),
      })
    );
  });

  it('deleteItem delegates hr permanent delete', async () => {
    vi.mocked(hrTrashService.permanentlyDeleteHRItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'profile-1' },
      query: { moduleId: 'hr', type: 'employee_profile' },
    } as unknown as Request;
    const res = mockResponse();

    await deleteItem(req, res);

    expect(hrTrashService.permanentlyDeleteHRItem).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item permanently deleted' })
    );
  });
});
