import {
  registerCalendarPlatformEntities,
  registerChatPlatformEntities,
  registerDrivePlatformEntities,
  registerNotebookPlatformEntities,
  registerNotesPlatformEntities,
  registerPlacePlatformEntities,
  registerTodoPlatformEntities,
} from '../platform/platformEntityRegistry';
import { logger } from '../lib/logger';

export function registerPlatformEntities(): void {
  registerDrivePlatformEntities();
  registerChatPlatformEntities();
  registerCalendarPlatformEntities();
  registerTodoPlatformEntities();
  registerNotesPlatformEntities();
  registerNotebookPlatformEntities();
  registerPlacePlatformEntities();
  void logger.info('Platform entity descriptors registered', {
    operation: 'register_platform_entities',
    modules: [
      { moduleId: 'drive', entityTypes: ['file', 'folder'] },
      { moduleId: 'chat', entityTypes: ['conversation'] },
      { moduleId: 'calendar', entityTypes: ['event'] },
      { moduleId: 'todo', entityTypes: ['task'] },
      { moduleId: 'notes', entityTypes: ['page'] },
      { moduleId: 'notebook', entityTypes: ['page'] },
      { moduleId: 'place', entityTypes: ['listing', 'meeting'] },
    ],
  });
}
