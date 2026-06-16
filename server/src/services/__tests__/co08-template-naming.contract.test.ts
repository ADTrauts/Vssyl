import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '../../../..');
const DECISION_PATH = join(
  REPO_ROOT,
  'docs/business-operations/SHIFT_TEMPLATE_DOMAIN_DECISION.md'
);
const HR_ATTENDANCE_SERVICE_PATH = join(
  __dirname,
  '../hrAttendanceService.ts'
);
const SCHEDULING_API_PATH = join(
  REPO_ROOT,
  'web/src/api/scheduling.ts'
);

describe('CO-08 template naming contract', () => {
  it('publishes SHIFT_TEMPLATE_DOMAIN_DECISION with canonical owners', () => {
    const doc = readFileSync(DECISION_PATH, 'utf8');
    expect(doc).toContain('AttendanceShiftTemplate');
    expect(doc).toContain('ShiftTemplate');
    expect(doc).toContain('ScheduleTemplate');
    expect(doc).toContain('HR ownership');
    expect(doc).toContain('Scheduling ownership');
    expect(doc).toContain('Tier B migration — remains unnecessary');
    expect(doc).toContain('No schema merge');
  });

  it('references decision record from hrAttendanceService module header', () => {
    const source = readFileSync(HR_ATTENDANCE_SERVICE_PATH, 'utf8');
    expect(source).toContain('SHIFT_TEMPLATE_DOMAIN_DECISION.md');
    expect(source).toContain('AttendanceShiftTemplate');
    expect(source).toContain('Attendance expectation templates');
  });

  it('documents scheduling ShiftTemplate separately in web API client', () => {
    const source = readFileSync(SCHEDULING_API_PATH, 'utf8');
    expect(source).toContain('Not HR `AttendanceShiftTemplate`');
    expect(source).toContain('scheduling shift templates');
    expect(source).toContain('Schedule templates (ScheduleTemplate');
  });
});
