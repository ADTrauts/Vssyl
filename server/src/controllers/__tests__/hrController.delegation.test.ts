import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/hrController.ts');

function sectionBetween(startMarker: string, endMarker: string): string {
  const source = readFileSync(controllerPath, 'utf8');
  const start = source.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`${startMarker} not found`);
  }
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end === -1) {
    throw new Error(`${endMarker} not found after ${startMarker}`);
  }
  return source.slice(start, end);
}

describe('hrController delegation (Package 6A)', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('has no direct Prisma usage', () => {
    expect(source).not.toMatch(/prisma\./);
    expect(source).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
  });

  it('getDashboardSummary delegates to hrAnalyticsSupportService', () => {
    const section = sectionBetween(
      'export const getDashboardSummary',
      'export const getAdminEmployees'
    );
    expect(section).toMatch(/getDashboardSummaryService\(/);
  });

  it('resolveTeamAttendanceException delegates to hrAttendanceService', () => {
    const section = sectionBetween(
      'export const resolveTeamAttendanceException',
      'export const getOwnHRData'
    );
    expect(section).toMatch(/resolveTeamAttendanceExceptionForManager\(/);
    expect(section).not.toMatch(/prisma\.attendanceException/);
  });

  it('completeMyOnboardingTask delegates task lookup to hrOnboardingService', () => {
    const section = sectionBetween(
      'export const completeMyOnboardingTask',
      'export const completeTeamOnboardingTask'
    );
    expect(section).toMatch(/findEmployeeOwnedOnboardingTask\(/);
    expect(section).not.toMatch(/prisma\.employeeOnboardingTask/);
  });

  it('requestTimeOff delegates to hrPtoService', () => {
    const section = sectionBetween(
      'export const requestTimeOff',
      'export const getPendingTeamTimeOff'
    );
    expect(section).toMatch(/requestTimeOffService\(/);
  });
});
