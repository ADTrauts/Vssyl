import { describe, expect, it } from 'vitest';
import { POLICY_ACTIONS } from '../policyActions';

const SCHEDULING_ACTIONS = [
  'SCHEDULING_SCHEDULE_READ',
  'SCHEDULING_SCHEDULE_WRITE',
  'SCHEDULING_SCHEDULE_DELETE',
  'SCHEDULING_SCHEDULE_PUBLISH',
  'SCHEDULING_SHIFT_READ',
  'SCHEDULING_SHIFT_WRITE',
  'SCHEDULING_SHIFT_ASSIGN',
  'SCHEDULING_SHIFT_DELETE',
  'SCHEDULING_SWAP_MANAGE',
  'SCHEDULING_SWAP_REQUEST',
  'SCHEDULING_TEMPLATE_WRITE',
  'SCHEDULING_STATION_WRITE',
] as const;

const HR_ACTIONS = [
  'HR_EMPLOYEE_READ',
  'HR_EMPLOYEE_WRITE',
  'HR_EMPLOYEE_DELETE',
  'HR_EMPLOYEE_TERMINATE',
  'HR_EMPLOYEE_IMPORT',
  'HR_TIME_OFF_READ',
  'HR_TIME_OFF_REQUEST',
  'HR_TIME_OFF_APPROVE',
  'HR_TIME_OFF_DENY',
  'HR_ONBOARDING_MANAGE',
  'HR_ONBOARDING_CREATE',
  'HR_ONBOARDING_UPDATE',
  'HR_ONBOARDING_COMPLETE',
  'HR_ATTENDANCE_MANAGE',
  'HR_ATTENDANCE_EXCEPTION_CREATE',
  'HR_ATTENDANCE_EXCEPTION_UPDATE',
  'HR_SETTINGS_WRITE',
] as const;

describe('policyActions BO registry (CO-03)', () => {
  it('registers all scheduling P1 actions with scheduling namespace', () => {
    for (const key of SCHEDULING_ACTIONS) {
      const value = POLICY_ACTIONS[key];
      expect(value.startsWith('scheduling:')).toBe(true);
    }
  });

  it('registers all HR P1 actions with hr namespace', () => {
    for (const key of HR_ACTIONS) {
      const value = POLICY_ACTIONS[key];
      expect(value.startsWith('hr:')).toBe(true);
    }
  });

  it('uses dot-separated verb segments per BO naming convention', () => {
    expect(POLICY_ACTIONS.SCHEDULING_SCHEDULE_PUBLISH).toBe('scheduling:schedule.publish');
    expect(POLICY_ACTIONS.HR_ATTENDANCE_EXCEPTION_CREATE).toBe('hr:attendance.exception.create');
    expect(POLICY_ACTIONS.HR_TIME_OFF_APPROVE).toBe('hr:time_off.approve');
  });
});
