import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests HR (CO-09 / G13)', () => {
  it('declares HR V-Link entities and runtime capabilities', () => {
    const manifest = buildBuiltInModuleManifest('hr');

    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.capabilities?.trash).toBe(true);
    expect(manifest.entities).toHaveLength(4);
    expect(manifest.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'employee_profile',
          vlinkEntityType: 'HR_EMPLOYEE_PROFILE',
          supportsTrash: true,
        }),
        expect.objectContaining({
          type: 'time_off_request',
          vlinkEntityType: 'HR_TIME_OFF_REQUEST',
          supportsTrash: false,
        }),
        expect.objectContaining({
          type: 'attendance_exception',
          vlinkEntityType: 'HR_ATTENDANCE_EXCEPTION',
          supportsTrash: false,
        }),
        expect.objectContaining({
          type: 'onboarding_journey',
          vlinkEntityType: 'HR_ONBOARDING_JOURNEY',
          supportsTrash: false,
        }),
      ])
    );
  });
});
