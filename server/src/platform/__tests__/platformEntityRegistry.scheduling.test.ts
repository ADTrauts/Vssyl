import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerSchedulingPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry scheduling (CO-09 / G13)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers scheduling schedule, shift, and swap_request entities', () => {
    registerSchedulingPlatformEntities();

    expect(getPlatformEntity('scheduling', 'schedule')).toMatchObject({
      entityType: 'schedule',
      moduleId: 'scheduling',
      vlinkEntityType: 'SCHEDULE',
      supportsTrash: true,
      supportsSearch: false,
      activityTargetType: 'schedule',
    });
    expect(getPlatformEntity('scheduling', 'shift')).toMatchObject({
      vlinkEntityType: 'SCHEDULE_SHIFT',
      supportsTrash: true,
    });
    expect(getPlatformEntity('scheduling', 'swap_request')).toMatchObject({
      vlinkEntityType: 'SHIFT_SWAP_REQUEST',
      supportsTrash: false,
    });
  });

  it('does not register deferred scheduling template entities', () => {
    registerSchedulingPlatformEntities();

    expect(listPlatformEntitiesForModule('scheduling')).toHaveLength(3);
    expect(getPlatformEntity('scheduling', 'schedule_template')).toBeUndefined();
    expect(getPlatformEntity('scheduling', 'shift_template')).toBeUndefined();
  });
});
