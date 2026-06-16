import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const controllerPath = join(process.cwd(), 'src/controllers/hrController.ts');

function extractImportEmployeesCsvSection(source: string): string {
  const marker = 'export const importEmployeesCSV';
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error('importEmployeesCSV not found in hrController.ts');
  }
  const nextExport = source.indexOf('\nexport const exportEmployeesCSV', start);
  if (nextExport === -1) {
    throw new Error('exportEmployeesCSV marker not found after importEmployeesCSV');
  }
  return source.slice(start, nextExport);
}

vi.mock('../../services/employeeManagementService', () => ({
  default: {
    importEmployeesFromCSV: vi.fn(),
    deactivateEmployeePositionById: vi.fn(),
  },
}));

vi.mock('../../services/hrEmployeeService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/hrEmployeeService')>();
  return {
    ...actual,
    getDefaultOrganizationalTierId: vi.fn(),
    importEmployeesFromCsv: vi.fn(),
  };
});

import {
  getDefaultOrganizationalTierId,
  importEmployeesFromCsv,
} from '../../services/hrEmployeeService';
import { importEmployeesCSV } from '../hrController';

function createMockResponse(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('hrController.importEmployeesCSV', () => {
  const source = readFileSync(controllerPath, 'utf8');
  const importSection = extractImportEmployeesCsvSection(source);

  it('does not create EmployeePosition records directly in the import handler', () => {
    expect(importSection).not.toMatch(/prisma\.employeePosition\.create/);
    expect(importSection).toMatch(/importEmployeesFromCsv/);
  });

  describe('runtime delegation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('delegates valid rows to hrEmployeeService.importEmployeesFromCsv', async () => {
      vi.mocked(getDefaultOrganizationalTierId).mockResolvedValue('tier-1');

      vi.mocked(importEmployeesFromCsv).mockResolvedValue({
        created: 1,
        updated: 0,
        skipped: 0,
        results: [
          {
            row: 2,
            success: true,
            email: 'alice@example.com',
            name: 'Alice',
            action: 'created',
          },
        ],
      });

      const csv = 'name,email\nAlice,alice@example.com\n';
      const req = {
        query: { businessId: 'biz-1' },
        user: { id: 'admin-1' },
        file: {
          buffer: Buffer.from(csv, 'utf-8'),
        },
      } as unknown as Request & { file?: Express.Multer.File };

      const res = createMockResponse();
      await importEmployeesCSV(req, res);

      expect(importEmployeesFromCsv).toHaveBeenCalledWith({
        businessId: 'biz-1',
        assignedById: 'admin-1',
        defaultTierId: 'tier-1',
        rows: [
          expect.objectContaining({
            row: 2,
            name: 'Alice',
            email: 'alice@example.com',
          }),
        ],
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        summary: {
          created: 1,
          updated: 0,
          skipped: 0,
        },
      });
    });

    it('returns validation errors for malformed rows without importing them', async () => {
      vi.mocked(getDefaultOrganizationalTierId).mockResolvedValue('tier-1');

      vi.mocked(importEmployeesFromCsv).mockResolvedValue({
        created: 0,
        updated: 0,
        skipped: 0,
        results: [],
      });

      const csv = 'name,email\nBad Row\n';
      const req = {
        query: { businessId: 'biz-1' },
        user: { id: 'admin-1' },
        file: {
          buffer: Buffer.from(csv, 'utf-8'),
        },
      } as unknown as Request & { file?: Express.Multer.File };

      const res = createMockResponse();
      await importEmployeesCSV(req, res);

      expect(importEmployeesFromCsv).toHaveBeenCalledWith(
        expect.objectContaining({ rows: [] })
      );
      expect(res.body).toMatchObject({
        success: true,
        summary: {
          skipped: 1,
        },
        results: [
          expect.objectContaining({
            success: false,
            error: 'Column count mismatch',
          }),
        ],
      });
    });
  });
});

describe('hrController lifecycle symmetry', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('terminateEmployee delegates to hrEmployeeService', () => {
    const terminateStart = source.indexOf('export const terminateEmployee');
    const terminateEnd = source.indexOf('export const getHRSettings', terminateStart);
    const terminateSection = source.slice(terminateStart, terminateEnd);
    expect(terminateSection).toMatch(/terminateEmployeeService\(/);
    expect(terminateSection).not.toMatch(/prisma\.employeePosition\.update\(/);
  });

  it('deleteEmployee vacates active positions via hrTrashService', () => {
    const deleteStart = source.indexOf('export const deleteEmployee');
    const deleteEnd = source.indexOf('export const getOnboardingTemplates', deleteStart);
    const deleteSection = source.slice(deleteStart, deleteEnd);
    expect(deleteSection).toMatch(/softTrashEmployeeProfile/);
  });
});
