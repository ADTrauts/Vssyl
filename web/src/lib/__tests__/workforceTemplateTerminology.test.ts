import { describe, expect, it } from 'vitest';
import {
  HR_ATTENDANCE_EXPECTATION_SUMMARY,
  HR_ATTENDANCE_EXPECTATION_TEMPLATE_LABEL,
  SCHEDULING_SCHEDULE_TEMPLATE_LABEL,
  SCHEDULING_SHIFT_PATTERN_LABEL,
  SCHEDULING_SHIFT_TEMPLATE_LABEL,
  SCHEDULING_TEMPLATE_DISAMBIGUATION_NOTE,
} from '../workforceTemplateTerminology';

describe('workforceTemplateTerminology (CO-08 / G08)', () => {
  it('uses distinct scheduling vs HR product labels', () => {
    expect(SCHEDULING_SHIFT_TEMPLATE_LABEL).toContain('Scheduling');
    expect(SCHEDULING_SHIFT_TEMPLATE_LABEL).not.toContain('Attendance');
    expect(HR_ATTENDANCE_EXPECTATION_TEMPLATE_LABEL).toContain('Attendance');
    expect(HR_ATTENDANCE_EXPECTATION_TEMPLATE_LABEL).not.toContain('Scheduling');
    expect(SCHEDULING_SCHEDULE_TEMPLATE_LABEL).toBe('Schedule Template');
  });

  it('keeps schedule-template shift patterns separate from ShiftTemplate entity label', () => {
    expect(SCHEDULING_SHIFT_PATTERN_LABEL).toContain('Scheduling');
    expect(SCHEDULING_SHIFT_PATTERN_LABEL).not.toBe(SCHEDULING_SHIFT_TEMPLATE_LABEL);
  });

  it('documents disambiguation between schedule templates and HR attendance expectations', () => {
    expect(SCHEDULING_TEMPLATE_DISAMBIGUATION_NOTE.toLowerCase()).toContain('attendance');
    expect(HR_ATTENDANCE_EXPECTATION_SUMMARY.toLowerCase()).toContain('scheduling');
  });

  it('renders attendance expectation label for HR UI copy', () => {
    const hrHeading = `${HR_ATTENDANCE_EXPECTATION_TEMPLATE_LABEL}s`;
    expect(hrHeading).toBe('Attendance Expectation Templates');
  });
});
