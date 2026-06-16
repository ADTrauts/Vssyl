import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const schedulingAdminPath = join(
  process.cwd(),
  'src/controllers/scheduling/schedulingAdminController.ts'
);
const hrControllerPath = join(process.cwd(), 'src/controllers/hrController.ts');

describe('CO-01 activity wiring contract', () => {
  const schedulingAdminSource = readFileSync(schedulingAdminPath, 'utf8');
  const hrControllerSource = readFileSync(hrControllerPath, 'utf8');

  it('scheduling admin controller delegates activity to schedulingActivityService', () => {
    expect(schedulingAdminSource).toMatch(/schedulingActivityService/);
    expect(schedulingAdminSource).not.toMatch(/emitModuleActivityEvent/);
    expect(schedulingAdminSource).toMatch(/recordScheduleCreated/);
    expect(schedulingAdminSource).toMatch(/recordShiftMutationActivities/);
  });

  it('hr controller delegates activity to hrActivityService', () => {
    expect(hrControllerSource).toMatch(/hrActivityService/);
    expect(hrControllerSource).not.toMatch(/emitModuleActivityEvent/);
    expect(hrControllerSource).toMatch(/recordEmployeeCreated/);
    expect(hrControllerSource).toMatch(/recordPtoRequested/);
  });
});
