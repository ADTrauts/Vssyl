/**
 * CO-08 / G08 workforce template product labels.
 * @see docs/business-operations/SHIFT_TEMPLATE_DOMAIN_DECISION.md
 */

/** Scheduling `ShiftTemplate` — reusable shift planning patterns (`shift_templates`). */
export const SCHEDULING_SHIFT_TEMPLATE_LABEL = 'Scheduling Shift Template';

/** Scheduling `ScheduleTemplate` — multi-day schedule layouts (`schedule_templates`). */
export const SCHEDULING_SCHEDULE_TEMPLATE_LABEL = 'Schedule Template';

/** Shift pattern row inside a schedule template builder (not the ShiftTemplate entity). */
export const SCHEDULING_SHIFT_PATTERN_LABEL = 'Scheduling Shift Pattern';

/** HR `AttendanceShiftTemplate` — attendance expectations (`attendance_shift_templates`). */
export const HR_ATTENDANCE_EXPECTATION_TEMPLATE_LABEL = 'Attendance Expectation Template';

export const HR_ATTENDANCE_EXPECTATION_SUMMARY =
  'Expected work windows for attendance tracking — separate from Scheduling shift and schedule templates.';

export const SCHEDULING_TEMPLATE_DISAMBIGUATION_NOTE =
  'Schedule templates are for workforce planning. They are not HR attendance expectation templates.';
