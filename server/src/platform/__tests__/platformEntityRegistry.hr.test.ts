import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerHRPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry HR (CO-09 / G13)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers HR employee profile, time-off, attendance exception, and onboarding journey', () => {
    registerHRPlatformEntities();

    expect(getPlatformEntity('hr', 'employee_profile')).toMatchObject({
      entityType: 'employee_profile',
      moduleId: 'hr',
      vlinkEntityType: 'HR_EMPLOYEE_PROFILE',
      supportsTrash: true,
      supportsSearch: false,
      activityTargetType: 'employee_profile',
    });
    expect(getPlatformEntity('hr', 'time_off_request')).toMatchObject({
      vlinkEntityType: 'HR_TIME_OFF_REQUEST',
      supportsTrash: false,
    });
    expect(getPlatformEntity('hr', 'attendance_exception')).toMatchObject({
      vlinkEntityType: 'HR_ATTENDANCE_EXCEPTION',
      supportsTrash: false,
    });
    expect(getPlatformEntity('hr', 'onboarding_journey')).toMatchObject({
      vlinkEntityType: 'HR_ONBOARDING_JOURNEY',
      supportsTrash: false,
    });
  });

  it('registers exactly four HR platform entities', () => {
    registerHRPlatformEntities();

    expect(listPlatformEntitiesForModule('hr')).toHaveLength(4);
    expect(getPlatformEntity('hr', 'attendance_record')).toBeUndefined();
  });
});
