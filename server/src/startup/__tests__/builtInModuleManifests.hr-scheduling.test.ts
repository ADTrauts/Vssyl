import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

const HR_EMITTED_TYPES = [
  'hr_time_off_request_submitted',
  'hr_time_off_request_approved',
  'hr_time_off_request_denied',
  'hr_time_off_balance_low',
  'hr_onboarding_assigned',
  'hr_onboarding_task_approved',
  'hr_onboarding_task_pending_approval',
  'hr_onboarding_journey_completed',
  'hr_attendance_exception_created',
  'hr_attendance_policy_violation',
  'hr_attendance_missing_punch',
  'hr_attendance_exception_resolved',
];

const SCHEDULING_EMITTED_TYPES = [
  'scheduling_schedule_published',
  'scheduling_shift_assigned',
  'scheduling_swap_requested',
  'scheduling_swap_approved',
  'scheduling_swap_denied',
  'scheduling_open_shift_available',
];

describe('builtInModuleManifests hr + scheduling (CO-02)', () => {
  it('enables notifications capability for hr and scheduling', () => {
    expect(buildBuiltInModuleManifest('hr').capabilities?.notifications).toBe(true);
    expect(buildBuiltInModuleManifest('scheduling').capabilities?.notifications).toBe(true);
  });

  it('includes all emitted hr notification types', () => {
    const manifest = buildBuiltInModuleManifest('hr');
    const types = manifest.notifications?.map((entry) => entry.type) ?? [];
    for (const expected of HR_EMITTED_TYPES) {
      expect(types).toContain(expected);
    }
  });

  it('includes all emitted scheduling notification types', () => {
    const manifest = buildBuiltInModuleManifest('scheduling');
    const types = manifest.notifications?.map((entry) => entry.type) ?? [];
    expect(types).toEqual(SCHEDULING_EMITTED_TYPES);
  });

  it('registers workforce hooks as planned only on hr manifest', () => {
    const manifest = buildBuiltInModuleManifest('hr');
    const workforce = manifest.notifications?.filter((entry) => entry.type.startsWith('workforce_'));
    expect(workforce?.map((entry) => entry.type)).toEqual([
      'workforce_announcement_posted',
      'workforce_policy_ack_required',
    ]);
    expect(workforce?.every((entry) => entry.planned === true)).toBe(true);
  });
});
