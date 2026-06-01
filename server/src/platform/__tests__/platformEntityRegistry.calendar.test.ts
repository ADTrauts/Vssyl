import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerCalendarPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry calendar entities (Wave 2 Phase 2B)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers event descriptor for calendar module', () => {
    registerCalendarPlatformEntities();

    const event = getPlatformEntity('calendar', 'event');
    expect(event).toMatchObject({
      moduleId: 'calendar',
      entityType: 'event',
      vlinkEntityType: 'CALENDAR_EVENT',
      supportsTrash: true,
      supportsSearch: true,
      activityTargetType: 'event',
    });
    expect(listPlatformEntitiesForModule('calendar')).toHaveLength(1);
    expect(getPlatformEntity('calendar', 'reminder')).toBeUndefined();
    expect(getPlatformEntity('calendar', 'calendar')).toBeUndefined();
  });
});
