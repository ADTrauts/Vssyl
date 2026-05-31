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

  void logger.info('Registered Global Trash module handlers', {
    operation: 'global_trash_handlers_register',
    modules: ['drive', 'chat'],
  });
}
