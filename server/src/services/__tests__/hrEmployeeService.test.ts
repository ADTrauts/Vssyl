import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import employeeManagementService from '../employeeManagementService.js';
import {
  getDefaultOrganizationalTierId,
  importEmployeesFromCsv,
  listAdminEmployees,
  terminateEmployee,
} from '../hrEmployeeService';

vi.mock('../hrActivityService', () => ({
  recordEmployeeTerminated: vi.fn(),
  recordEmployeeCreated: vi.fn(),
  recordEmployeeUpdated: vi.fn(),
}));

vi.mock('../employeeManagementService.js', () => ({
  default: {
    importEmployeesFromCSV: vi.fn(),
    deactivateEmployeePositionById: vi.fn(),
  },
}));

describe('hrEmployeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefaultOrganizationalTierId', () => {
    it('returns the lowest-level tier id for a business', async () => {
      vi.spyOn(prisma.organizationalTier, 'findFirst').mockResolvedValue({
        id: 'tier-1',
      } as never);

      await expect(getDefaultOrganizationalTierId('biz-1')).resolves.toBe('tier-1');
    });
  });

  describe('importEmployeesFromCsv', () => {
    it('delegates to employeeManagementService.importEmployeesFromCSV', async () => {
      vi.mocked(employeeManagementService.importEmployeesFromCSV).mockResolvedValue({
        created: 1,
        updated: 0,
        skipped: 0,
        results: [],
      });

      await importEmployeesFromCsv({
        businessId: 'biz-1',
        assignedById: 'admin-1',
        defaultTierId: 'tier-1',
        rows: [{ row: 2, name: 'Alice', email: 'alice@example.com' }],
      });

      expect(employeeManagementService.importEmployeesFromCSV).toHaveBeenCalledWith({
        businessId: 'biz-1',
        assignedById: 'admin-1',
        defaultTierId: 'tier-1',
        rows: [{ row: 2, name: 'Alice', email: 'alice@example.com' }],
      });
    });
  });

  describe('listAdminEmployees', () => {
    it('queries active employee positions scoped to business', async () => {
      vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([] as never);
      vi.spyOn(prisma.employeePosition, 'count').mockResolvedValue(0);

      const result = await listAdminEmployees({
        businessId: 'biz-1',
        status: 'ACTIVE',
        q: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        pageSize: 20,
      });

      expect(result.count).toBe(0);
      expect(prisma.employeePosition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId: 'biz-1', active: true }),
        })
      );
    });
  });

  describe('terminateEmployee', () => {
    it('vacates position via employeeManagementService', async () => {
      vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
        id: 'ep-1',
        businessId: 'biz-1',
        userId: 'user-1',
        hrProfile: {
          id: 'hr-1',
          employmentStatus: 'ACTIVE',
          terminationDate: null,
          terminationReason: null,
          terminationNotes: null,
          terminatedBy: null,
        },
        user: { id: 'user-1', name: 'Pat', email: 'pat@example.com' },
      } as never);
      vi.spyOn(prisma.employeeHRProfile, 'update').mockResolvedValue({
        id: 'hr-1',
        employmentStatus: 'TERMINATED',
      } as never);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as never);

      await terminateEmployee({
        businessId: 'biz-1',
        userId: 'admin-1',
        employeePositionId: 'ep-1',
        terminationDate: new Date('2026-06-01T00:00:00.000Z'),
        notesProvided: false,
      });

      expect(employeeManagementService.deactivateEmployeePositionById).toHaveBeenCalledWith(
        'ep-1',
        'biz-1',
        expect.any(Date)
      );
    });
  });
});
