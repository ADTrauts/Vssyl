import { registerDrivePlatformEntities } from '../platform/platformEntityRegistry';
import { logger } from '../lib/logger';

export function registerPlatformEntities(): void {
  registerDrivePlatformEntities();
  void logger.info('Platform entity descriptors registered', {
    operation: 'register_platform_entities',
    moduleId: 'drive',
    entityTypes: ['file', 'folder'],
  });
}
