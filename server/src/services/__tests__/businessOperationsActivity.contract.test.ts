import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const schedulingScheduleServicePath = join(
  process.cwd(),
  'src/services/schedulingScheduleService.ts'
);
const schedulingShiftServicePath = join(
  process.cwd(),
  'src/services/schedulingShiftService.ts'
);
const schedulingAdminControllerPath = join(
  process.cwd(),
  'src/controllers/scheduling/schedulingAdminController.ts'
);
const hrEmployeeServicePath = join(process.cwd(), 'src/services/hrEmployeeService.ts');
const hrPtoServicePath = join(process.cwd(), 'src/services/hrPtoService.ts');
const hrControllerPath = join(process.cwd(), 'src/controllers/hrController.ts');

describe('CO-01 activity wiring contract', () => {
  const schedulingScheduleServiceSource = readFileSync(schedulingScheduleServicePath, 'utf8');
  const schedulingShiftServiceSource = readFileSync(schedulingShiftServicePath, 'utf8');
  const schedulingAdminControllerSource = readFileSync(schedulingAdminControllerPath, 'utf8');
  const hrEmployeeServiceSource = readFileSync(hrEmployeeServicePath, 'utf8');
  const hrPtoServiceSource = readFileSync(hrPtoServicePath, 'utf8');
  const hrControllerSource = readFileSync(hrControllerPath, 'utf8');

  it('scheduling domain services delegate activity to schedulingActivityService', () => {
    expect(schedulingScheduleServiceSource).toMatch(/schedulingActivityService/);
    expect(schedulingScheduleServiceSource).not.toMatch(/emitModuleActivityEvent/);
    expect(schedulingScheduleServiceSource).toMatch(/recordScheduleCreated/);

    expect(schedulingShiftServiceSource).toMatch(/schedulingActivityService/);
    expect(schedulingShiftServiceSource).not.toMatch(/emitModuleActivityEvent/);
    expect(schedulingShiftServiceSource).toMatch(/recordShiftMutationActivities/);

    expect(schedulingAdminControllerSource).not.toMatch(/emitModuleActivityEvent/);
  });

  it('hr domain services delegate activity to hrActivityService', () => {
    expect(hrEmployeeServiceSource).toMatch(/hrActivityService/);
    expect(hrEmployeeServiceSource).not.toMatch(/emitModuleActivityEvent/);
    expect(hrEmployeeServiceSource).toMatch(/recordEmployeeCreated/);
    expect(hrEmployeeServiceSource).not.toMatch(/hrDomainEventService/);

    expect(hrPtoServiceSource).toMatch(/hrActivityService/);
    expect(hrPtoServiceSource).not.toMatch(/emitModuleActivityEvent/);
    expect(hrPtoServiceSource).toMatch(/recordPtoRequested/);

    expect(hrControllerSource).not.toMatch(/emitModuleActivityEvent/);
  });

  it('hr activity service dual-emits domain events via hrDomainEventService', () => {
    const hrActivitySource = readFileSync(
      join(process.cwd(), 'src/services/hrActivityService.ts'),
      'utf8'
    );
    expect(hrActivitySource).toMatch(/hrDomainEventService/);
    expect(hrActivitySource).toMatch(/recordEmployeeCreatedDomainEvent/);
  });
});
