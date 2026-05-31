import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerDrivePlatformEntities,
} from '../../platform/platformEntityRegistry';

describe('platformEntityRegistry drive entities', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers file and folder descriptors for drive module', () => {
    registerDrivePlatformEntities();

    const file = getPlatformEntity('drive', 'file');
    const folder = getPlatformEntity('drive', 'folder');

    expect(file).toMatchObject({
      moduleId: 'drive',
      entityType: 'file',
      vlinkEntityType: 'FILE',
      supportsTrash: true,
      supportsSearch: true,
    });
    expect(folder).toMatchObject({
      moduleId: 'drive',
      entityType: 'folder',
      vlinkEntityType: 'FOLDER',
    });
    expect(listPlatformEntitiesForModule('drive')).toHaveLength(2);
  });
});
