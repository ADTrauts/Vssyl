import { AttendanceExceptionStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  getAttendanceExceptionWithDetails,
  resolveTeamAttendanceExceptionForManager,
} from '../hrAttendanceService';

vi.mock('../hrActivityService', () => ({
  recordAttendanceExceptionResolved: vi.fn(),
}));

describe('hrAttendanceService manager resolution workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveTeamAttendanceExceptionForManager', () => {
    it('rejects managers with no direct reports', async () => {
      await expect(
        resolveTeamAttendanceExceptionForManager({
          businessId: 'biz-1',
          exceptionId: 'ex-1',
          managerUserId: 'mgr-1',
          directReportEmployeePositionIds: [],
          status: AttendanceExceptionStatus.RESOLVED,
        })
      ).rejects.toThrow('Not authorized to resolve this exception');
    });

    it('rejects when exception is outside manager direct reports', async () => {
      vi.spyOn(prisma.attendanceException, 'findFirst').mockResolvedValue({
        id: 'ex-1',
        employeePositionId: 'ep-other',
        status: AttendanceExceptionStatus.OPEN,
      } as never);

      await expect(
        resolveTeamAttendanceExceptionForManager({
          businessId: 'biz-1',
          exceptionId: 'ex-1',
          managerUserId: 'mgr-1',
          directReportEmployeePositionIds: ['ep-1'],
          status: AttendanceExceptionStatus.RESOLVED,
        })
      ).rejects.toThrow('Not authorized to resolve this exception');
    });

    it('delegates to resolveAttendanceException for authorized managers', async () => {
      vi.spyOn(prisma.attendanceException, 'findFirst').mockResolvedValue({
        id: 'ex-1',
        employeePositionId: 'ep-1',
        status: AttendanceExceptionStatus.OPEN,
      } as never);
      vi.spyOn(prisma.attendanceException, 'update').mockResolvedValue({
        id: 'ex-1',
        status: AttendanceExceptionStatus.RESOLVED,
      } as never);
      vi.spyOn(prisma.attendanceException, 'findUnique').mockResolvedValue({
        id: 'ex-1',
        status: AttendanceExceptionStatus.RESOLVED,
      } as never);

      const result = await resolveTeamAttendanceExceptionForManager({
        businessId: 'biz-1',
        exceptionId: 'ex-1',
        managerUserId: 'mgr-1',
        directReportEmployeePositionIds: ['ep-1'],
        status: AttendanceExceptionStatus.RESOLVED,
        resolutionNote: 'Approved',
      });

      expect(prisma.attendanceException.update).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'ex-1', status: AttendanceExceptionStatus.RESOLVED });
    });
  });

  describe('getAttendanceExceptionWithDetails', () => {
    it('scopes lookup by exception id', async () => {
      vi.spyOn(prisma.attendanceException, 'findUnique').mockResolvedValue({
        id: 'ex-1',
        businessId: 'biz-1',
      } as never);

      await getAttendanceExceptionWithDetails('ex-1', 'biz-1');

      expect(prisma.attendanceException.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ex-1' },
        })
      );
    });
  });
});
