import { registerGlobalTrashModuleHandler } from '../services/globalTrashModuleRegistry';
import {
  emptyDriveTrash,
  permanentlyDeleteDriveItem,
  restoreDriveItem,
  softTrashDriveItem,
} from '../services/driveDeleteService';
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

  void logger.info('Registered Global Trash module handlers', {
    operation: 'global_trash_handlers_register',
    modules: ['drive'],
  });
}
