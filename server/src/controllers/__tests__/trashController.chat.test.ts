import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { deleteItem, emptyTrash, listTrashedItems, restoreItem, trashItem } from '../trashController';
import {
  clearGlobalTrashModuleHandlersForTests,
  registerGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import * as chatTrashService from '../../services/chatTrashService';
import type { ChatTrashItemType } from '../../services/chatTrashService';
import * as driveVisibility from '../../services/driveVisibilityService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/chatTrashService', () => ({
  softTrashChatItem: vi.fn(),
  restoreChatItem: vi.fn(),
  permanentlyDeleteChatItem: vi.fn(),
  emptyChatTrash: vi.fn(),
  listTrashedConversationsForGlobalTrash: vi.fn(),
  ChatTrashError: class ChatTrashError extends Error {
    code = 'not_found';
  },
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('trashController chat integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGlobalTrashModuleHandlersForTests();
    registerGlobalTrashModuleHandler({
      moduleId: 'chat',
      moduleName: 'Chat',
      supportedTypes: ['conversation', 'message'],
      softTrash: (input) =>
        chatTrashService.softTrashChatItem({
          userId: input.userId,
          type: input.type as ChatTrashItemType,
          id: input.id,
        }),
      restore: (input) =>
        chatTrashService.restoreChatItem({
          userId: input.userId,
          type: input.type as ChatTrashItemType,
          id: input.id,
        }),
      permanentDelete: (input) =>
        chatTrashService.permanentlyDeleteChatItem({
          userId: input.userId,
          type: input.type as ChatTrashItemType,
          id: input.id,
        }),
      emptyModuleTrash: (input) => chatTrashService.emptyChatTrash(input),
      listTrashed: (input) => chatTrashService.listTrashedConversationsForGlobalTrash(input.userId),
    });
  });

  it('trashItem delegates conversation to chat handler', async () => {
    vi.mocked(chatTrashService.softTrashChatItem).mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      body: {
        id: 'conv-1',
        name: 'Team',
        type: 'conversation',
        moduleId: 'chat',
        moduleName: 'Chat',
      },
    } as unknown as Request;
    const res = mockResponse();

    await trashItem(req, res);

    expect(chatTrashService.softTrashChatItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'conversation',
      id: 'conv-1',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item moved to trash' })
    );
  });

  it('restoreItem delegates chat conversation restore', async () => {
    vi.mocked(chatTrashService.restoreChatItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'conv-1' },
      query: { moduleId: 'chat', type: 'conversation' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await restoreItem(req, res);

    expect(chatTrashService.restoreChatItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'conversation',
      id: 'conv-1',
    });
  });

  it('deleteItem delegates chat permanent delete', async () => {
    vi.mocked(chatTrashService.permanentlyDeleteChatItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'conv-1' },
      query: { moduleId: 'chat', type: 'conversation' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await deleteItem(req, res);

    expect(chatTrashService.permanentlyDeleteChatItem).toHaveBeenCalled();
  });

  it('emptyTrash with moduleId=chat empties chat trash only', async () => {
    vi.mocked(chatTrashService.emptyChatTrash).mockResolvedValue(2);

    const req = {
      user: { id: 'user-1' },
      query: { moduleId: 'chat' },
    } as unknown as Request;
    const res = mockResponse();

    await emptyTrash(req, res);

    expect(chatTrashService.emptyChatTrash).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Chat trash emptied', deletedCount: 2 })
    );
  });

  it('listTrashedItems includes chat handler conversations', async () => {
    vi.spyOn(driveVisibility, 'listAccessibleTrashedFiles').mockResolvedValue([] as never);
    vi.spyOn(driveVisibility, 'listAccessibleTrashedFolders').mockResolvedValue([] as never);
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.event, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);
    vi.mocked(chatTrashService.listTrashedConversationsForGlobalTrash).mockResolvedValue([
      {
        id: 'conv-1',
        name: 'Team',
        type: 'conversation',
        moduleId: 'chat',
        moduleName: 'Chat',
        trashedAt: new Date(),
        metadata: {},
      },
    ]);

    const req = { user: { id: 'user-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(chatTrashService.listTrashedConversationsForGlobalTrash).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ moduleId: 'chat', type: 'conversation' }),
        ]),
      })
    );
  });
});
