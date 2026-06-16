import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeOffStatus, TimeOffType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  calculateTimeOffBalance,
  requestTimeOff,
  TimeOffConflictError,
} from '../hrPtoService';

vi.mock('../hrScheduleService', () => ({
  syncTimeOffRequestCalendar: vi.fn(),
}));

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn(),
  },
}));

vi.mock('../hrActivityService', () => ({
  recordPtoRequested: vi.fn(),
}));

describe('hrPtoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTimeOffBalance', () => {
    it('returns available balance from approved requests', async () => {
      vi.spyOn(prisma.employeeHRProfile, 'findUnique').mockResolvedValue({
        hireDate: new Date('2020-01-01'),
      } as never);
      vi.spyOn(prisma.timeOffRequest, 'findMany')
        .mockResolvedValueOnce([
          {
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-02'),
          },
        ] as never)
        .mockResolvedValueOnce([] as never);

      const balance = await calculateTimeOffBalance('biz-1', 'ep-1', TimeOffType.PTO);

      expect(balance.allotment).toBe(15);
      expect(balance.used).toBe(2);
      expect(balance.available).toBe(13);
    });
  });

  describe('requestTimeOff', () => {
    it('throws when an overlapping request exists', async () => {
      vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
        id: 'ep-1',
      } as never);
      vi.spyOn(prisma.timeOffRequest, 'findFirst').mockResolvedValue({
        id: 'tor-1',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-05'),
        status: TimeOffStatus.PENDING,
      } as never);

      await expect(
        requestTimeOff({
          businessId: 'biz-1',
          userId: 'user-1',
          userName: 'Pat',
          userEmail: 'pat@example.com',
          type: 'PTO',
          startDate: '2026-07-03T00:00:00.000Z',
          endDate: '2026-07-04T00:00:00.000Z',
        })
      ).rejects.toBeInstanceOf(TimeOffConflictError);
    });
  });
});
