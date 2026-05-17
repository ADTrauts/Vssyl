import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { AdminService } from '../adminService';
import * as gate from '../moduleVersionCertificationGate';

const validManifest = {
  name: 'Test Module',
  version: '1.0.0',
  supportedContexts: ['personal'],
  permissions: ['test:read'],
  runtime: { apiVersion: '1.0' },
  frontend: { entryUrl: 'https://cdn.example.com/app/index.html' },
};

describe('AdminService.promoteModuleVersion certification gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('promotes when certification gate passes', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'test-module',
      name: 'Test',
      version: '1.0.0',
      permissions: ['test:read'],
    } as never);
    vi.spyOn(prisma.moduleVersion, 'findUnique').mockResolvedValue({
      id: 'mv-1',
      version: '1.0.0',
      isCurrent: false,
      manifestSnapshot: validManifest,
      certificationStatus: 'PASSED',
      certificationErrors: [],
      certificationWarnings: [],
      certificationChecklist: [],
      certificationValidatedAt: new Date(),
      certificationValidatorVersion: '1.0.0',
    } as never);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    vi.spyOn(gate, 'ensureModuleVersionCertificationForActivation').mockResolvedValue({
      certification: {
        status: 'passed',
        errors: [],
        warnings: [],
        checklist: [],
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0',
      },
      revalidated: false,
    });
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => {
      if (typeof fn !== 'function') return undefined;
      const tx = {
        moduleVersion: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          update: vi.fn().mockResolvedValue({ id: 'mv-1' }),
        },
        module: { update: vi.fn().mockResolvedValue({ id: 'test-module' }) },
        auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
      };
      return fn(tx as never);
    });

    const result = await AdminService.promoteModuleVersion('test-module', '1.0.0', 'admin-1');

    expect(result.certification.status).toBe('passed');
    expect(result.moduleId).toBe('test-module');
  });

  it('blocks promotion when certification gate throws', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue({
      id: 'test-module',
      name: 'Test',
      version: '1.0.0',
      permissions: [],
    } as never);
    vi.spyOn(prisma.moduleVersion, 'findUnique').mockResolvedValue({
      id: 'mv-fail',
      version: '1.0.0',
      isCurrent: false,
      manifestSnapshot: {},
    } as never);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    vi.spyOn(gate, 'ensureModuleVersionCertificationForActivation').mockRejectedValue(
      new gate.ModuleVersionCertificationBlockedError('Module certification validation failed', {
        status: 'failed',
        errors: ['manifest.name is required'],
        warnings: [],
        checklist: [],
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0',
      })
    );
    const txSpy = vi.spyOn(prisma, '$transaction');

    await expect(
      AdminService.promoteModuleVersion('test-module', '1.0.0', 'admin-1')
    ).rejects.toThrow('Module certification validation failed');

    expect(txSpy).not.toHaveBeenCalled();
  });
});
