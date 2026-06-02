import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { deleteItem, emptyTrash, listTrashedItems, restoreItem, trashItem } from '../trashController';
import {
  clearGlobalTrashModuleHandlersForTests,
  registerGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import * as todoTrashService from '../../services/todoTrashService';
import type { TodoTrashItemType } from '../../services/todoTrashService';
import * as driveVisibility from '../../services/driveVisibilityService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/todoTrashService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/todoTrashService')>();
  return {
    ...actual,
    softTrashTodoItem: vi.fn(),
    restoreTodoItem: vi.fn(),
    permanentlyDeleteTodoItem: vi.fn(),
    emptyTodoTrash: vi.fn(),
    listTrashedTasksForGlobalTrash: vi.fn(),
  };
});

vi.mock('../../services/driveVisibilityService', () => ({
  listAccessibleTrashedFiles: vi.fn().mockResolvedValue([]),
  listAccessibleTrashedFolders: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('trashController todo integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGlobalTrashModuleHandlersForTests();
    registerGlobalTrashModuleHandler({
      moduleId: 'todo',
      moduleName: 'Todo',
      supportedTypes: ['task'],
      softTrash: (input) =>
        todoTrashService.softTrashTodoItem({
          userId: input.userId,
          type: input.type as TodoTrashItemType,
          id: input.id,
        }),
      restore: (input) =>
        todoTrashService.restoreTodoItem({
          userId: input.userId,
          type: input.type as TodoTrashItemType,
          id: input.id,
        }),
      permanentDelete: (input) =>
        todoTrashService.permanentlyDeleteTodoItem({
          userId: input.userId,
          type: input.type as TodoTrashItemType,
          id: input.id,
        }),
      emptyModuleTrash: (input) => todoTrashService.emptyTodoTrash(input),
      listTrashed: (input) => todoTrashService.listTrashedTasksForGlobalTrash(input.userId),
    });
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
  });

  it('trashItem delegates task to todo handler', async () => {
    vi.mocked(todoTrashService.softTrashTodoItem).mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      body: {
        id: 'task-1',
        name: 'Ship',
        type: 'task',
        moduleId: 'todo',
        moduleName: 'Todo',
      },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(todoTrashService.softTrashTodoItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'task',
      id: 'task-1',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item moved to trash' })
    );
  });

  it('trashItem returns 404 for todo not_found', async () => {
    vi.mocked(todoTrashService.softTrashTodoItem).mockRejectedValue(
      new todoTrashService.TodoTrashError('Task not found', 'not_found')
    );

    const req = {
      user: { id: 'user-1' },
      body: { id: 'task-missing', type: 'task', moduleId: 'todo' },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('restoreItem delegates todo task restore', async () => {
    vi.mocked(todoTrashService.restoreTodoItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'task-1' },
      query: { moduleId: 'todo', type: 'task' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await restoreItem(req, res);

    expect(todoTrashService.restoreTodoItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'task',
      id: 'task-1',
    });
  });

  it('deleteItem delegates todo permanent delete', async () => {
    vi.mocked(todoTrashService.permanentlyDeleteTodoItem).mockResolvedValue(true as never);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'task-1' },
      query: { moduleId: 'todo', type: 'task' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await deleteItem(req, res);

    expect(todoTrashService.permanentlyDeleteTodoItem).toHaveBeenCalled();
  });

  it('listTrashedItems includes todo tasks from handler', async () => {
    vi.mocked(todoTrashService.listTrashedTasksForGlobalTrash).mockResolvedValue([
      {
        id: 'task-1',
        name: 'Ship',
        type: 'task',
        moduleId: 'todo',
        moduleName: 'Todo',
        trashedAt: new Date(),
        metadata: { dashboardId: 'dash-1' },
      },
    ]);

    const req = { user: { id: 'user-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'task-1', moduleId: 'todo', type: 'task' }),
        ]),
      })
    );
  });

  it('emptyTrash with moduleId todo delegates to handler', async () => {
    vi.mocked(todoTrashService.emptyTodoTrash).mockResolvedValue(3);

    const req = { user: { id: 'user-1' }, query: { moduleId: 'todo' } } as unknown as Request;
    const res = mockResponse();

    await emptyTrash(req, res);

    expect(todoTrashService.emptyTodoTrash).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, deletedCount: 3 })
    );
  });
});
