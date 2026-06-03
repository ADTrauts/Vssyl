import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerPlacePlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry place entities (Wave 2A)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers listing and meeting descriptors only', () => {
    registerPlacePlatformEntities();

    expect(getPlatformEntity('place', 'listing')).toMatchObject({
      moduleId: 'place',
      entityType: 'listing',
      vlinkEntityType: 'PLACE_LISTING',
      supportsTrash: true,
      supportsSearch: true,
      activityTargetType: 'listing',
    });
    expect(getPlatformEntity('place', 'meeting')).toMatchObject({
      moduleId: 'place',
      entityType: 'meeting',
      vlinkEntityType: 'PLACE_MEETING',
      supportsTrash: true,
      supportsSearch: false,
      activityTargetType: 'meeting',
    });
    expect(listPlatformEntitiesForModule('place')).toHaveLength(2);
    expect(getPlatformEntity('place', 'community')).toBeUndefined();
    expect(getPlatformEntity('place', 'node')).toBeUndefined();
    expect(getPlatformEntity('place', 'transaction')).toBeUndefined();
  });
});
