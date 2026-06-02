import { registerGlobalTrashModuleHandler } from '../services/globalTrashModuleRegistry';
import {
  emptyDriveTrash,
  permanentlyDeleteDriveItem,
  restoreDriveItem,
  softTrashDriveItem,
} from '../services/driveDeleteService';
import {
  emptyChatTrash,
  listTrashedConversationsForGlobalTrash,
  permanentlyDeleteChatItem,
  restoreChatItem,
  softTrashChatItem,
  type ChatTrashItemType,
} from '../services/chatTrashService';
import {
  emptyCalendarTrash,
  listTrashedCalendarEventsForGlobalTrash,
  permanentlyDeleteCalendarItem,
  restoreCalendarItem,
  softTrashCalendarItem,
  type CalendarTrashItemType,
} from '../services/calendarTrashService';
import {
  emptyTodoTrash,
  listTrashedTasksForGlobalTrash,
  permanentlyDeleteTodoItem,
  restoreTodoItem,
  softTrashTodoItem,
  type TodoTrashItemType,
} from '../services/todoTrashService';
import { logger } from '../lib/logger';

export function registerGlobalTrashHandlers(): void {
  registerGlobalTrashModuleHandler({
    moduleId: 'drive',
    moduleName: 'File Hub',
    supportedTypes: ['file', 'folder'],
    softTrash: async ({ userId, type, id }) => {
      if (type !== 'file' && type !== 'folder') {
        throw new Error(`Unsupported drive trash type: ${type}`);
      }
      await softTrashDriveItem({ userId, type, id });
    },
    restore: async ({ userId, type, id }) => {
      if (type !== 'file' && type !== 'folder') return false;
      return restoreDriveItem({ userId, type, id });
    },
    permanentDelete: async ({ userId, type, id }) => {
      if (type !== 'file' && type !== 'folder') return false;
      return permanentlyDeleteDriveItem({ userId, type, id });
    },
    emptyModuleTrash: async ({ userId }) => emptyDriveTrash({ userId }),
  });

  registerGlobalTrashModuleHandler({
    moduleId: 'chat',
    moduleName: 'Chat',
    /** Conversations in Global Trash UI; messages use in-module lifecycle via same handler methods. */
    supportedTypes: ['conversation', 'message'],
    softTrash: async ({ userId, type, id }) => {
      if (type !== 'conversation' && type !== 'message') {
        throw new Error(`Unsupported chat trash type: ${type}`);
      }
      await softTrashChatItem({
        userId,
        type: type as ChatTrashItemType,
        id,
      });
    },
    restore: async ({ userId, type, id }) => {
      if (type !== 'conversation' && type !== 'message') return false;
      return restoreChatItem({
        userId,
        type: type as ChatTrashItemType,
        id,
      });
    },
    permanentDelete: async ({ userId, type, id }) => {
      if (type !== 'conversation' && type !== 'message') return false;
      return permanentlyDeleteChatItem({
        userId,
        type: type as ChatTrashItemType,
        id,
      });
    },
    emptyModuleTrash: async ({ userId }) => emptyChatTrash({ userId }),
    listTrashed: async ({ userId }) => listTrashedConversationsForGlobalTrash(userId),
  });

  registerGlobalTrashModuleHandler({
    moduleId: 'calendar',
    moduleName: 'Calendar',
    supportedTypes: ['event'],
    softTrash: async ({ userId, type, id }) => {
      if (type !== 'event') {
        throw new Error(`Unsupported calendar trash type: ${type}`);
      }
      await softTrashCalendarItem({
        userId,
        type: type as CalendarTrashItemType,
        id,
      });
    },
    restore: async ({ userId, type, id }) => {
      if (type !== 'event') return false;
      return restoreCalendarItem({
        userId,
        type: type as CalendarTrashItemType,
        id,
      });
    },
    permanentDelete: async ({ userId, type, id }) => {
      if (type !== 'event') return false;
      return permanentlyDeleteCalendarItem({
        userId,
        type: type as CalendarTrashItemType,
        id,
      });
    },
    emptyModuleTrash: async ({ userId }) => emptyCalendarTrash({ userId }),
    listTrashed: async ({ userId }) => listTrashedCalendarEventsForGlobalTrash(userId),
  });

  registerGlobalTrashModuleHandler({
    moduleId: 'todo',
    moduleName: 'Todo',
    supportedTypes: ['task'],
    softTrash: async ({ userId, type, id }) => {
      if (type !== 'task') {
        throw new Error(`Unsupported todo trash type: ${type}`);
      }
      await softTrashTodoItem({
        userId,
        type: type as TodoTrashItemType,
        id,
      });
    },
    restore: async ({ userId, type, id }) => {
      if (type !== 'task') return false;
      return restoreTodoItem({
        userId,
        type: type as TodoTrashItemType,
        id,
      });
    },
    permanentDelete: async ({ userId, type, id }) => {
      if (type !== 'task') return false;
      return permanentlyDeleteTodoItem({
        userId,
        type: type as TodoTrashItemType,
        id,
      });
    },
    emptyModuleTrash: async ({ userId }) => emptyTodoTrash({ userId }),
    listTrashed: async ({ userId }) => listTrashedTasksForGlobalTrash(userId),
  });

  void logger.info('Registered Global Trash module handlers', {
    operation: 'global_trash_handlers_register',
    modules: ['drive', 'chat', 'calendar', 'todo'],
  });
}
