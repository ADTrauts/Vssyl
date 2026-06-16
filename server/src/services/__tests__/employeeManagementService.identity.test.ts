import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { EmployeeManagementService } from '../employeeManagementService';

describe('EmployeeManagementService — identity authority', () => {
  let service: EmployeeManagementService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new EmployeeManagementService();
  });

  describe('deactivateEmployeePositionById', () => {
    it('delegates to removeEmployeeFromPosition with the resolved assignment', async () => {
      vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
        userId: 'user-1',
        positionId: 'pos-1',
      } as never);

      const removeSpy = vi
        .spyOn(service, 'removeEmployeeFromPosition')
        .mockResolvedValue(undefined);

      const endDate = new Date('2026-01-15T12:00:00.000Z');
      await service.deactivateEmployeePositionById('ep-1', 'biz-1', endDate);

      expect(removeSpy).toHaveBeenCalledWith('user-1', 'pos-1', 'biz-1', endDate);
    });

    it('no-ops when no active assignment exists', async () => {
      vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue(null);
      const removeSpy = vi.spyOn(service, 'removeEmployeeFromPosition');

      await service.deactivateEmployeePositionById('ep-missing', 'biz-1');

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeEmployeeFromPosition', () => {
    it('deactivates active assignments with the provided end date', async () => {
      const updateManySpy = vi
        .spyOn(prisma.employeePosition, 'updateMany')
        .mockResolvedValue({ count: 1 });

      const endDate = new Date('2026-02-01T00:00:00.000Z');
      await service.removeEmployeeFromPosition('user-1', 'pos-1', 'biz-1', endDate);

      expect(updateManySpy).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          positionId: 'pos-1',
          businessId: 'biz-1',
          active: true,
        },
        data: {
          active: false,
          endDate,
        },
      });
    });
  });

  describe('importEmployeesFromCSV', () => {
    it('creates placement via assignEmployeeToPosition for new rows', async () => {
      const assignSpy = vi.spyOn(service, 'assignEmployeeToPosition').mockResolvedValue({
        id: 'ep-new',
      } as never);

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        name: 'New Hire',
      } as never);
      vi.spyOn(prisma.businessMember, 'upsert').mockResolvedValue({} as never);
      vi.spyOn(prisma.department, 'findFirst').mockResolvedValue({
        id: 'dept-1',
        businessId: 'biz-1',
        name: 'General',
      } as never);
      vi.spyOn(prisma.position, 'findFirst').mockResolvedValue({
        id: 'pos-1',
        businessId: 'biz-1',
      } as never);
      vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.employeeHRProfile, 'upsert').mockResolvedValue({} as never);

      const result = await service.importEmployeesFromCSV({
        businessId: 'biz-1',
        assignedById: 'admin-1',
        defaultTierId: 'tier-1',
        rows: [
          {
            row: 2,
            name: 'New Hire',
            email: 'new@example.com',
          },
        ],
      });

      expect(assignSpy).toHaveBeenCalled();
      expect(result.created).toBe(1);
      expect(result.results[0]).toMatchObject({
        row: 2,
        success: true,
        action: 'created',
      });
    });

    it('updates existing active assignments without direct employeePosition.create', async () => {
      const createSpy = vi.spyOn(prisma.employeePosition, 'create');
      const updateSpy = vi
        .spyOn(service, 'updateEmployeePosition')
        .mockResolvedValue({ id: 'ep-existing' } as never);

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-1',
        email: 'existing@example.com',
        name: 'Existing',
      } as never);
      vi.spyOn(prisma.businessMember, 'upsert').mockResolvedValue({} as never);
      vi.spyOn(prisma.department, 'findFirst').mockResolvedValue({
        id: 'dept-1',
      } as never);
      vi.spyOn(prisma.position, 'findFirst').mockResolvedValue({
        id: 'pos-1',
      } as never);
      vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
        id: 'ep-existing',
        userId: 'user-1',
        positionId: 'pos-1',
        businessId: 'biz-1',
        active: true,
      } as never);
      vi.spyOn(prisma.employeeHRProfile, 'upsert').mockResolvedValue({} as never);

      const result = await service.importEmployeesFromCSV({
        businessId: 'biz-1',
        assignedById: 'admin-1',
        defaultTierId: 'tier-1',
        rows: [
          {
            row: 2,
            name: 'Existing',
            email: 'existing@example.com',
            hiredate: '2024-06-01',
          },
        ],
      });

      expect(updateSpy).toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(result.updated).toBe(1);
    });
  });
});
