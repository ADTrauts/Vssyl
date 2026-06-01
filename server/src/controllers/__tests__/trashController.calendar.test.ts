import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { deleteItem, emptyTrash, listTrashedItems, restoreItem, trashItem } from '../trashController';
import {
  clearGlobalTrashModuleHandlersForTests,
  registerGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import * as calendarTrashService from '../../services/calendarTrashService';
import type { CalendarTrashItemType } from '../../services/calendarTrashService';
import * as driveVisibility from '../../services/driveVisibilityService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/calendarTrashService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/calendarTrashService')>();
  return {
    ...actual,
    softTrashCalendarItem: vi.fn(),
    restoreCalendarItem: vi.fn(),
    permanentlyDeleteCalendarItem: vi.fn(),
    emptyCalendarTrash: vi.fn(),
    listTrashedCalendarEventsForGlobalTrash: vi.fn(),
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

describe('trashController calendar integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGlobalTrashModuleHandlersForTests();
    registerGlobalTrashModuleHandler({
      moduleId: 'calendar',
      moduleName: 'Calendar',
      supportedTypes: ['event'],
      softTrash: (input) =>
        calendarTrashService.softTrashCalendarItem({
          userId: input.userId,
          type: input.type as CalendarTrashItemType,
          id: input.id,
        }),
      restore: (input) =>
        calendarTrashService.restoreCalendarItem({
          userId: input.userId,
          type: input.type as CalendarTrashItemType,
          id: input.id,
        }),
      permanentDelete: (input) =>
        calendarTrashService.permanentlyDeleteCalendarItem({
          userId: input.userId,
          type: input.type as CalendarTrashItemType,
          id: input.id,
        }),
      emptyModuleTrash: (input) => calendarTrashService.emptyCalendarTrash(input),
      listTrashed: (input) => calendarTrashService.listTrashedCalendarEventsForGlobalTrash(input.userId),
    });
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);
  });

  it('trashItem delegates event to calendar handler', async () => {
    vi.mocked(calendarTrashService.softTrashCalendarItem).mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      body: {
        id: 'evt-1',
        name: 'Standup',
        type: 'event',
        moduleId: 'calendar',
        moduleName: 'Calendar',
      },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(calendarTrashService.softTrashCalendarItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'event',
      id: 'evt-1',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item moved to trash' })
    );
  });

  it('trashItem returns 404 for calendar not_found', async () => {
    vi.mocked(calendarTrashService.softTrashCalendarItem).mockRejectedValue(
      new calendarTrashService.CalendarTrashError('Event not found', 'not_found')
    );

    const req = {
      user: { id: 'user-1' },
      body: {
        id: 'evt-missing',
        type: 'event',
        moduleId: 'calendar',
      },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('restoreItem delegates calendar event restore', async () => {
    vi.mocked(calendarTrashService.restoreCalendarItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'evt-1' },
      query: { moduleId: 'calendar', type: 'event' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await restoreItem(req, res);

    expect(calendarTrashService.restoreCalendarItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'event',
      id: 'evt-1',
    });
  });

  it('deleteItem delegates calendar permanent delete', async () => {
    vi.mocked(calendarTrashService.permanentlyDeleteCalendarItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'evt-1' },
      query: { moduleId: 'calendar', type: 'event' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await deleteItem(req, res);

    expect(calendarTrashService.permanentlyDeleteCalendarItem).toHaveBeenCalled();
  });

  it('listTrashedItems includes calendar events from handler', async () => {
    vi.mocked(calendarTrashService.listTrashedCalendarEventsForGlobalTrash).mockResolvedValue([
      {
        id: 'evt-1',
        name: 'Standup',
        type: 'event',
        moduleId: 'calendar',
        moduleName: 'Calendar',
        trashedAt: new Date(),
        metadata: { calendarName: 'Work' },
      },
    ]);

    const req = { user: { id: 'user-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'evt-1', moduleId: 'calendar', type: 'event' }),
        ]),
      })
    );
  });

  it('emptyTrash with moduleId calendar delegates to handler', async () => {
    vi.mocked(calendarTrashService.emptyCalendarTrash).mockResolvedValue(2);

    const req = { user: { id: 'user-1' }, query: { moduleId: 'calendar' } } as unknown as Request;
    const res = mockResponse();

    await emptyTrash(req, res);

    expect(calendarTrashService.emptyCalendarTrash).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, deletedCount: 2 })
    );
  });
});
