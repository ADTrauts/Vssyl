import {
  registerCalendarPlatformEntities,
  registerChatPlatformEntities,
  registerDrivePlatformEntities,
  registerHRPlatformEntities,
  registerNotebookPlatformEntities,
  registerNotesPlatformEntities,
  registerPlacePlatformEntities,
  registerSchedulingPlatformEntities,
  registerTodoPlatformEntities,
  registerWorkforceCommsPlatformEntities,
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
  registerSchedulingPlatformEntities();
  registerHRPlatformEntities();
  registerWorkforceCommsPlatformEntities();
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
      {
        moduleId: 'scheduling',
        entityTypes: ['schedule', 'shift', 'swap_request'],
      },
      {
        moduleId: 'hr',
        entityTypes: [
          'employee_profile',
          'time_off_request',
          'attendance_exception',
          'onboarding_journey',
        ],
      },
      {
        moduleId: 'workforce_comms',
        entityTypes: ['communication', 'campaign'],
      },
    ],
  });
}
