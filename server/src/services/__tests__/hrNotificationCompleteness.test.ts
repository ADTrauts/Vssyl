import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttendanceExceptionType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import { createAttendanceException } from '../hrAttendanceService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../hrActivityService', () => ({
  recordAttendanceExceptionCreated: vi.fn().mockResolvedValue(undefined),
}));

describe('HR notification completeness (CO-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAttendanceException emits hr_attendance_missing_punch for MISSED_PUNCH', async () => {
    vi.spyOn(prisma.attendanceException, 'create').mockResolvedValue({ id: 'ex-1' } as never);
    vi.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValue({ userId: 'emp-1' } as never);
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue(null);

    await createAttendanceException({
      businessId: 'biz-1',
      employeePositionId: 'ep-1',
      type: AttendanceExceptionType.MISSED_PUNCH,
      actorUserId: 'system-1',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hr_attendance_missing_punch', userId: 'emp-1' })
    );
  });

  it('createAttendanceException emits hr_attendance_policy_violation for GEO_VIOLATION', async () => {
    vi.spyOn(prisma.attendanceException, 'create').mockResolvedValue({ id: 'ex-2' } as never);
    vi.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValue({ userId: 'emp-1' } as never);
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue(null);

    await createAttendanceException({
      businessId: 'biz-1',
      employeePositionId: 'ep-1',
      type: AttendanceExceptionType.GEO_VIOLATION,
      actorUserId: 'system-1',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hr_attendance_policy_violation', userId: 'emp-1' })
    );
  });

  it('createAttendanceException notifies manager with hr_attendance_exception_created', async () => {
    vi.spyOn(prisma.attendanceException, 'create').mockResolvedValue({ id: 'ex-3' } as never);
    vi.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValue({ userId: 'emp-1' } as never);
    // Shape must match resolveManagerOccupancyForEmployeePosition (reportsToId + occupant email).
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
      position: {
        reportsToId: 'mgr-pos-1',
        reportsTo: {
          employeePositions: [
            {
              userId: 'mgr-1',
              user: { name: 'Manager', email: 'mgr@example.com' },
            },
          ],
        },
      },
    } as never);

    await createAttendanceException({
      businessId: 'biz-1',
      employeePositionId: 'ep-1',
      type: AttendanceExceptionType.ABSENCE,
      actorUserId: 'emp-1',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hr_attendance_exception_created', userId: 'mgr-1' })
    );
  });
});
