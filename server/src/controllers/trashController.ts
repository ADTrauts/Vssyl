import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getGlobalTrashModuleHandler } from '../services/globalTrashModuleRegistry';
import { DriveDeleteError } from '../services/driveDeleteService';
import { ChatTrashError } from '../services/chatTrashService';
import { CalendarTrashError } from '../services/calendarTrashService';
import { TodoTrashError } from '../services/todoTrashService';
import { NotesTrashError } from '../services/notes/notesTrashService';
import {
  listAccessibleTrashedFiles,
  listAccessibleTrashedFolders,
} from '../services/driveVisibilityService';

function hasUserId(user: unknown): user is { id: string } | { sub: string } {
  return typeof user === 'object' && user !== null && 
    ('id' in user && typeof (user as Record<string, unknown>).id === 'string' ||
     'sub' in user && typeof (user as Record<string, unknown>).sub === 'string');
}

interface TrashItemRequest {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'conversation' | 'dashboard_tab' | 'module' | 'message' | 'ai_conversation' | 'event' | 'profile_photo' | 'task' | 'note';
  moduleId: string;
  moduleName: string;
  metadata?: Record<string, unknown>;
}

interface TrashedListItem {
  id: string;
  name: string;
  type: string;
  moduleId: string;
  moduleName: string;
  trashedAt: Date | null;
  metadata?: Record<string, unknown>;
}

function resolveTrashUserId(req: Request): string {
  const user = req.user as { id?: string; sub?: string };
  return user.id || user.sub || '';
}

function parseTrashHint(req: Request): { moduleId?: string; type?: string } {
  const body = req.body as { moduleId?: string; type?: string } | undefined;
  const moduleId =
    typeof req.query.moduleId === 'string' ? req.query.moduleId : body?.moduleId;
  const type = typeof req.query.type === 'string' ? req.query.type : body?.type;
  return { moduleId, type };
}

async function tryDriveRestore(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('drive');
  if (!handler) return false;

  if (moduleId === 'drive' && (type === 'file' || type === 'folder')) {
    return handler.restore({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.restore({ userId, type: 'file', id })) return true;
    if (await handler.restore({ userId, type: 'folder', id })) return true;
  }

  return false;
}

async function tryDrivePermanentDelete(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('drive');
  if (!handler) return false;

  if (moduleId === 'drive' && (type === 'file' || type === 'folder')) {
    return handler.permanentDelete({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.permanentDelete({ userId, type: 'file', id })) return true;
    if (await handler.permanentDelete({ userId, type: 'folder', id })) return true;
  }

  return false;
}

async function tryChatRestore(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('chat');
  if (!handler) return false;

  if (moduleId === 'chat' && (type === 'conversation' || type === 'message')) {
    return handler.restore({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.restore({ userId, type: 'conversation', id })) return true;
    if (await handler.restore({ userId, type: 'message', id })) return true;
  }

  return false;
}

async function tryChatPermanentDelete(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('chat');
  if (!handler) return false;

  if (moduleId === 'chat' && (type === 'conversation' || type === 'message')) {
    return handler.permanentDelete({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.permanentDelete({ userId, type: 'conversation', id })) return true;
    if (await handler.permanentDelete({ userId, type: 'message', id })) return true;
  }

  return false;
}

function mapChatTrashError(res: Response, error: unknown): boolean {
  if (error instanceof ChatTrashError) {
    if (error.code === 'forbidden') {
      res.status(403).json({ message: 'Forbidden' });
      return true;
    }
    if (error.code === 'not_found') {
      res.status(404).json({ message: 'Item not found or already trashed' });
      return true;
    }
  }
  return false;
}

function mapCalendarTrashError(res: Response, error: unknown): boolean {
  if (error instanceof CalendarTrashError) {
    if (error.code === 'forbidden') {
      res.status(403).json({ message: 'Forbidden' });
      return true;
    }
    if (error.code === 'not_found') {
      res.status(404).json({ message: 'Item not found or already trashed' });
      return true;
    }
  }
  return false;
}

function mapTodoTrashError(res: Response, error: unknown): boolean {
  if (error instanceof TodoTrashError) {
    if (error.code === 'forbidden') {
      res.status(403).json({ message: 'Forbidden' });
      return true;
    }
    if (error.code === 'not_found') {
      res.status(404).json({ message: 'Item not found or already trashed' });
      return true;
    }
  }
  return false;
}

function mapNotesTrashError(res: Response, error: unknown): boolean {
  if (error instanceof NotesTrashError) {
    if (error.code === 'forbidden') {
      res.status(403).json({ message: 'Forbidden' });
      return true;
    }
    if (error.code === 'not_found') {
      res.status(404).json({ message: 'Item not found or already trashed' });
      return true;
    }
  }
  return false;
}

async function tryCalendarRestore(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('calendar');
  if (!handler) return false;

  if (moduleId === 'calendar' && type === 'event') {
    return handler.restore({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.restore({ userId, type: 'event', id })) return true;
  }

  return false;
}

async function tryTodoRestore(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('todo');
  if (!handler) return false;

  if (moduleId === 'todo' && type === 'task') {
    return handler.restore({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.restore({ userId, type: 'task', id })) return true;
  }

  return false;
}

async function tryNotesRestore(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('notes');
  if (!handler) return false;

  if (moduleId === 'notes' && type === 'note') {
    return handler.restore({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.restore({ userId, type: 'note', id })) return true;
  }

  return false;
}

async function tryTodoPermanentDelete(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('todo');
  if (!handler) return false;

  if (moduleId === 'todo' && type === 'task') {
    return handler.permanentDelete({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.permanentDelete({ userId, type: 'task', id })) return true;
  }

  return false;
}

async function tryNotesPermanentDelete(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('notes');
  if (!handler) return false;

  if (moduleId === 'notes' && type === 'note') {
    return handler.permanentDelete({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.permanentDelete({ userId, type: 'note', id })) return true;
  }

  return false;
}

async function tryCalendarPermanentDelete(
  userId: string,
  id: string,
  moduleId?: string,
  type?: string
): Promise<boolean> {
  const handler = getGlobalTrashModuleHandler('calendar');
  if (!handler) return false;

  if (moduleId === 'calendar' && type === 'event') {
    return handler.permanentDelete({ userId, type, id });
  }

  if (!moduleId && !type) {
    if (await handler.permanentDelete({ userId, type: 'event', id })) return true;
  }

  return false;
}

async function loadTrashedCalendarEvents(userId: string): Promise<TrashedListItem[]> {
  const calendarHandler = getGlobalTrashModuleHandler('calendar');
  if (!calendarHandler?.listTrashed) {
    return [];
  }
  try {
    return (await calendarHandler.listTrashed({ userId })) as TrashedListItem[];
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Trash: calendar handler listTrashed failed', {
      operation: 'list_trashed_items',
      moduleId: 'calendar',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

async function loadTrashedDriveFiles(userId: string): Promise<Awaited<ReturnType<typeof listAccessibleTrashedFiles>>> {
  try {
    return await listAccessibleTrashedFiles(userId);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Trash: drive files query failed', {
      operation: 'list_trashed_items',
      moduleId: 'drive',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

async function loadTrashedDriveFolders(userId: string): Promise<Awaited<ReturnType<typeof listAccessibleTrashedFolders>>> {
  try {
    return await listAccessibleTrashedFolders(userId);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Trash: drive folders query failed', {
      operation: 'list_trashed_items',
      moduleId: 'drive',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

async function loadTrashedTodoTasks(userId: string): Promise<TrashedListItem[]> {
  const todoHandler = getGlobalTrashModuleHandler('todo');
  if (!todoHandler?.listTrashed) {
    return [];
  }
  try {
    return (await todoHandler.listTrashed({ userId })) as TrashedListItem[];
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Trash: todo handler listTrashed failed', {
      operation: 'list_trashed_items',
      moduleId: 'todo',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

async function loadTrashedNotesPages(userId: string): Promise<TrashedListItem[]> {
  const notesHandler = getGlobalTrashModuleHandler('notes');
  if (!notesHandler?.listTrashed) {
    return [];
  }
  try {
    return (await notesHandler.listTrashed({ userId })) as TrashedListItem[];
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Trash: notes handler listTrashed failed', {
      operation: 'list_trashed_items',
      moduleId: 'notes',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

async function loadTrashedChatItems(userId: string): Promise<TrashedListItem[]> {
  const chatHandler = getGlobalTrashModuleHandler('chat');
  if (!chatHandler?.listTrashed) {
    return [];
  }
  try {
    return (await chatHandler.listTrashed({ userId })) as TrashedListItem[];
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Trash: chat handler listTrashed failed', {
      operation: 'list_trashed_items',
      moduleId: 'chat',
      userId,
      error: { message: err.message },
    });
    return [];
  }
}

export async function listTrashedItems(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = (req.user as any).id || (req.user as any).sub;

    const trashedFiles = await loadTrashedDriveFiles(userId);
    const trashedFolders = await loadTrashedDriveFolders(userId);
    const trashedChatConversations = await loadTrashedChatItems(userId);
    const trashedCalendarEvents = await loadTrashedCalendarEvents(userId);
    const trashedTodoTasks = await loadTrashedTodoTasks(userId);
    const trashedNotesPages = await loadTrashedNotesPages(userId);

    // Get trashed dashboards
    const trashedDashboards = await prisma.dashboard.findMany({
      where: { 
        userId, 
        trashedAt: { not: null } 
      },
      select: {
        id: true,
        name: true,
        trashedAt: true,
        userId: true,
      },
      orderBy: { trashedAt: 'desc' },
    });

    // Get trashed profile photos (optional – table/column may not exist in all envs)
    let trashedProfilePhotos: Array<{ id: string; trashedAt: Date | null; originalUrl: string | null; avatarUrl: string | null }> = [];
    try {
      trashedProfilePhotos = await prisma.userProfilePhoto.findMany({
        where: {
          userId,
          trashedAt: { not: null },
        },
        select: {
          id: true,
          trashedAt: true,
          originalUrl: true,
          avatarUrl: true,
        },
        orderBy: { trashedAt: 'desc' },
      });
    } catch (e) {
      logger.warn('Trash: profile photos query failed (table/column may not exist)', {
        operation: 'list_trashed_items',
        userId,
        error: e instanceof Error ? { message: e.message } : undefined,
      });
    }

    // Get trashed AI conversations (with error handling for missing column)
    let trashedAIConversations: Array<{ id: string; title: string | null; trashedAt: Date | null; userId: string }> = [];
    try {
      trashedAIConversations = await prisma.aIConversation.findMany({
        where: { 
          userId, 
          trashedAt: { not: null } 
        },
        select: {
          id: true,
          title: true,
          trashedAt: true,
          userId: true,
        },
        orderBy: { trashedAt: 'desc' },
      });
    } catch (e) {
      logger.warn('Trash: AI conversations query failed (column may not exist)', {
        operation: 'list_trashed_items',
        userId,
        error: e instanceof Error ? { message: e.message } : undefined,
      });
    }

    // Transform all items to a consistent format
    const items: TrashedListItem[] = [
      ...trashedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: 'file' as const,
        moduleId: 'drive',
        moduleName: 'File Hub',
        trashedAt: file.trashedAt,
        metadata: {
          size: file.size,
          fileType: file.type,
        },
      })),
      ...trashedFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        moduleId: 'drive',
        moduleName: 'File Hub',
        trashedAt: folder.trashedAt,
        metadata: {},
      })),
      ...trashedChatConversations,
      ...trashedDashboards.map(dashboard => ({
        id: dashboard.id,
        name: dashboard.name,
        type: 'dashboard_tab' as const,
        moduleId: 'dashboard',
        moduleName: 'Dashboard',
        trashedAt: dashboard.trashedAt,
        metadata: {},
      })),
      ...trashedAIConversations.map(conversation => ({
        id: conversation.id,
        name: conversation.title || 'Untitled AI Conversation',
        type: 'ai_conversation' as const,
        moduleId: 'ai-chat',
        moduleName: 'AI Chat',
        trashedAt: conversation.trashedAt,
        metadata: {},
      })),
      ...trashedCalendarEvents,
      ...trashedTodoTasks,
      ...trashedNotesPages,
      ...trashedProfilePhotos.map(photo => ({
        id: photo.id,
        name: 'Profile Photo',
        type: 'profile_photo' as const,
        moduleId: 'profile-photos',
        moduleName: 'Profile Photos',
        trashedAt: photo.trashedAt,
        metadata: {
          originalUrl: photo.originalUrl,
          avatarUrl: photo.avatarUrl,
        },
      })),
    ];

    // Sort by trashed date (most recent first)
    items.sort((a, b) => new Date(b.trashedAt!).getTime() - new Date(a.trashedAt!).getTime());

    const moduleFilter =
      typeof req.query.moduleId === 'string' ? req.query.moduleId : undefined;
    const filteredItems = moduleFilter
      ? items.filter((item) => item.moduleId === moduleFilter)
      : items;

    res.json({ items: filteredItems });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = (req.user as { id?: string; sub?: string } | undefined)?.id ?? (req.user as { sub?: string } | undefined)?.sub;
    logger.error('Failed to list trashed items', {
      operation: 'list_trashed_items',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      message: 'Failed to list trashed items',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}

export async function trashItem(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id, name, type, moduleId, moduleName, metadata }: TrashItemRequest = req.body;

    let result;

    switch (type) {
      case 'file':
      case 'folder': {
        if (moduleId !== 'drive' && moduleId) {
          return res.status(400).json({ message: 'Invalid module for file/folder trash' });
        }
        try {
          const handler = getGlobalTrashModuleHandler('drive');
          if (!handler?.softTrash) {
            return res.status(500).json({ message: 'Drive trash handler not registered' });
          }
          await handler.softTrash({ userId, type, id, metadata });
          return res.json({ success: true, message: 'Item moved to trash' });
        } catch (error: unknown) {
          if (error instanceof DriveDeleteError) {
            if (error.code === 'forbidden') {
              return res.status(403).json({ message: 'Forbidden' });
            }
            if (error.code === 'not_found') {
              return res.status(404).json({ message: 'Item not found or already trashed' });
            }
          }
          throw error;
        }
      }

      case 'conversation':
      case 'message': {
        if (moduleId !== 'chat' && moduleId) {
          return res.status(400).json({ message: 'Invalid module for chat trash' });
        }
        try {
          const handler = getGlobalTrashModuleHandler('chat');
          if (!handler?.softTrash) {
            return res.status(500).json({ message: 'Chat trash handler not registered' });
          }
          await handler.softTrash({
            userId,
            type,
            id,
            metadata,
          });
          return res.json({ success: true, message: 'Item moved to trash' });
        } catch (error: unknown) {
          if (mapChatTrashError(res, error)) return;
          throw error;
        }
      }

      case 'dashboard_tab':
        result = await prisma.dashboard.updateMany({
          where: { id, userId, trashedAt: null },
          data: { trashedAt: new Date() },
        });
        break;

      case 'ai_conversation':
        result = await prisma.aIConversation.updateMany({
          where: { id, userId, trashedAt: null },
          data: { trashedAt: new Date() },
        });
        break;

      case 'event': {
        if (moduleId !== 'calendar' && moduleId) {
          return res.status(400).json({ message: 'Invalid module for calendar trash' });
        }
        try {
          const handler = getGlobalTrashModuleHandler('calendar');
          if (!handler?.softTrash) {
            return res.status(500).json({ message: 'Calendar trash handler not registered' });
          }
          await handler.softTrash({
            userId,
            type: 'event',
            id,
            metadata,
          });
          return res.json({ success: true, message: 'Item moved to trash' });
        } catch (error: unknown) {
          if (mapCalendarTrashError(res, error)) return;
          throw error;
        }
      }

      case 'profile_photo': {
        // Only allow trashing photos owned by the user
        const now = new Date();
        result = await prisma.userProfilePhoto.updateMany({
          where: { id, userId, trashedAt: null },
          data: { trashedAt: now },
        });

        if (result.count > 0) {
          // Unassign if this photo was assigned as personal or business
          await prisma.user.updateMany({
            where: { id: userId, OR: [{ personalPhotoId: id }, { businessPhotoId: id }] },
            data: {
              personalPhotoId: null,
              businessPhotoId: null,
              // Backward compat URLs cleared only if they match the trashed photo urls is handled elsewhere
            },
          });
        }
        break;
      }

      case 'task': {
        if (moduleId !== 'todo' && moduleId) {
          return res.status(400).json({ message: 'Invalid module for todo trash' });
        }
        try {
          const handler = getGlobalTrashModuleHandler('todo');
          if (!handler?.softTrash) {
            return res.status(500).json({ message: 'Todo trash handler not registered' });
          }
          await handler.softTrash({
            userId,
            type: 'task',
            id,
            metadata,
          });
          return res.json({ success: true, message: 'Item moved to trash' });
        } catch (error: unknown) {
          if (mapTodoTrashError(res, error)) return;
          throw error;
        }
      }

      case 'note': {
        if (moduleId !== 'notes' && moduleId) {
          return res.status(400).json({ message: 'Invalid module for notes trash' });
        }
        try {
          const handler = getGlobalTrashModuleHandler('notes');
          if (!handler?.softTrash) {
            return res.status(500).json({ message: 'Notes trash handler not registered' });
          }
          await handler.softTrash({
            userId,
            type: 'note',
            id,
            metadata,
          });
          return res.json({ success: true, message: 'Item moved to trash' });
        } catch (error: unknown) {
          if (mapNotesTrashError(res, error)) return;
          throw error;
        }
      }

      default:
        return res.status(400).json({ message: 'Invalid item type' });
    }

    if (result.count === 0) {
      return res.status(404).json({ message: 'Item not found or already trashed' });
    }

    res.json({ success: true, message: 'Item moved to trash' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error trashing item', {
      operation: 'trash_item',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ message: 'Failed to trash item' });
  }
}

export async function restoreItem(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = resolveTrashUserId(req);
    const { id } = req.params;
    const { moduleId, type } = parseTrashHint(req);

    if (await tryDriveRestore(userId, id, moduleId, type)) {
      return res.json({ success: true, message: 'Item restored' });
    }

    if (await tryChatRestore(userId, id, moduleId, type)) {
      return res.json({ success: true, message: 'Item restored' });
    }

    try {
      if (await tryCalendarRestore(userId, id, moduleId, type)) {
        return res.json({ success: true, message: 'Item restored' });
      }
    } catch (error: unknown) {
      if (mapCalendarTrashError(res, error)) return;
      throw error;
    }

    try {
      if (await tryTodoRestore(userId, id, moduleId, type)) {
        return res.json({ success: true, message: 'Item restored' });
      }
    } catch (error: unknown) {
      if (mapTodoTrashError(res, error)) return;
      throw error;
    }

    try {
      if (await tryNotesRestore(userId, id, moduleId, type)) {
        return res.json({ success: true, message: 'Item restored' });
      }
    } catch (error: unknown) {
      if (mapNotesTrashError(res, error)) return;
      throw error;
    }

    // Try to restore from each table (non-module handlers)
    let result = await prisma.dashboard.updateMany({
      where: { id, userId, trashedAt: { not: null } },
      data: { trashedAt: null },
    });

    if (result.count === 0) {
      result = await prisma.aIConversation.updateMany({
        where: { id, userId, trashedAt: { not: null } },
        data: { trashedAt: null },
      });
    }

    if (result.count === 0) {
      result = await prisma.userProfilePhoto.updateMany({
        where: { id, userId, trashedAt: { not: null } },
        data: { trashedAt: null },
      });
    }

    if (result.count === 0) {
      return res.status(404).json({ message: 'Item not found in trash' });
    }

    res.json({ success: true, message: 'Item restored' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error restoring item', {
      operation: 'trash_restore',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ message: 'Failed to restore item' });
  }
}

export async function deleteItem(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = resolveTrashUserId(req);
    const { id } = req.params;
    const { moduleId, type } = parseTrashHint(req);

    if (await tryDrivePermanentDelete(userId, id, moduleId, type)) {
      return res.json({ success: true, message: 'Item permanently deleted' });
    }

    if (await tryChatPermanentDelete(userId, id, moduleId, type)) {
      return res.json({ success: true, message: 'Item permanently deleted' });
    }

    try {
      if (await tryCalendarPermanentDelete(userId, id, moduleId, type)) {
        return res.json({ success: true, message: 'Item permanently deleted' });
      }
    } catch (error: unknown) {
      if (mapCalendarTrashError(res, error)) return;
      throw error;
    }

    try {
      if (await tryTodoPermanentDelete(userId, id, moduleId, type)) {
        return res.json({ success: true, message: 'Item permanently deleted' });
      }
    } catch (error: unknown) {
      if (mapTodoTrashError(res, error)) return;
      throw error;
    }

    try {
      if (await tryNotesPermanentDelete(userId, id, moduleId, type)) {
        return res.json({ success: true, message: 'Item permanently deleted' });
      }
    } catch (error: unknown) {
      if (mapNotesTrashError(res, error)) return;
      throw error;
    }

    // Try to delete from each table (non-module handlers)
    let result = await prisma.dashboard.deleteMany({
      where: { id, userId, trashedAt: { not: null } },
    });

    if (result.count === 0) {
      result = await prisma.aIConversation.deleteMany({
        where: { id, userId, trashedAt: { not: null } },
      });
    }

    if (result.count === 0) {
      result = await prisma.userProfilePhoto.deleteMany({
        where: { id, userId, trashedAt: { not: null } },
      });
    }

    if (result.count === 0) {
      return res.status(404).json({ message: 'Item not found in trash' });
    }

    res.json({ success: true, message: 'Item deleted permanently' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error deleting trashed item', {
      operation: 'trash_delete',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ message: 'Failed to delete item' });
  }
}

export async function emptyTrash(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = resolveTrashUserId(req);
    const moduleId =
      typeof req.query.moduleId === 'string' ? req.query.moduleId : undefined;

    if (moduleId === 'drive') {
      const handler = getGlobalTrashModuleHandler('drive');
      if (!handler) {
        return res.status(500).json({ message: 'Drive trash handler not registered' });
      }
      const deletedCount = await handler.emptyModuleTrash({ userId });
      return res.json({
        success: true,
        message: 'File Hub trash emptied',
        deletedCount,
      });
    }

    if (moduleId === 'chat') {
      const handler = getGlobalTrashModuleHandler('chat');
      if (!handler) {
        return res.status(500).json({ message: 'Chat trash handler not registered' });
      }
      const deletedCount = await handler.emptyModuleTrash({ userId });
      return res.json({
        success: true,
        message: 'Chat trash emptied',
        deletedCount,
      });
    }

    if (moduleId === 'calendar') {
      const handler = getGlobalTrashModuleHandler('calendar');
      if (!handler) {
        return res.status(500).json({ message: 'Calendar trash handler not registered' });
      }
      const deletedCount = await handler.emptyModuleTrash({ userId });
      return res.json({
        success: true,
        message: 'Calendar trash emptied',
        deletedCount,
      });
    }

    if (moduleId === 'todo') {
      const handler = getGlobalTrashModuleHandler('todo');
      if (!handler) {
        return res.status(500).json({ message: 'Todo trash handler not registered' });
      }
      const deletedCount = await handler.emptyModuleTrash({ userId });
      return res.json({
        success: true,
        message: 'Todo trash emptied',
        deletedCount,
      });
    }

    if (moduleId === 'notes') {
      const handler = getGlobalTrashModuleHandler('notes');
      if (!handler) {
        return res.status(500).json({ message: 'Notes trash handler not registered' });
      }
      const deletedCount = await handler.emptyModuleTrash({ userId });
      return res.json({
        success: true,
        message: 'Notebook pages trash emptied',
        deletedCount,
      });
    }

    const driveHandler = getGlobalTrashModuleHandler('drive');
    if (driveHandler) {
      await driveHandler.emptyModuleTrash({ userId });
    }

    const chatHandler = getGlobalTrashModuleHandler('chat');
    if (chatHandler) {
      await chatHandler.emptyModuleTrash({ userId });
    }

    const calendarHandler = getGlobalTrashModuleHandler('calendar');
    if (calendarHandler) {
      await calendarHandler.emptyModuleTrash({ userId });
    }

    const todoHandler = getGlobalTrashModuleHandler('todo');
    if (todoHandler) {
      await todoHandler.emptyModuleTrash({ userId });
    }

    const notesHandler = getGlobalTrashModuleHandler('notes');
    if (notesHandler) {
      await notesHandler.emptyModuleTrash({ userId });
    }

    await Promise.all([
      prisma.dashboard.deleteMany({
        where: { userId, trashedAt: { not: null } },
      }),
      prisma.aIConversation.deleteMany({
        where: { userId, trashedAt: { not: null } },
      }),
      prisma.userProfilePhoto.deleteMany({
        where: { userId, trashedAt: { not: null } },
      }),
    ]);

    res.json({ success: true, message: 'Trash emptied' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error emptying trash', {
      operation: 'trash_empty',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ message: 'Failed to empty trash' });
  }
} 