import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { AdminService } from '../adminService';
import { CERTIFICATION_VALIDATOR_VERSION } from '../moduleCertificationValidator';
import { ModuleVersionCertificationBlockedError } from '../moduleVersionCertificationGate';
import * as persistence from '../moduleCertificationPersistence';

vi.mock('../ModuleRegistrySyncService.js', () => ({
  moduleRegistrySyncService: { syncModule: vi.fn().mockResolvedValue(undefined) },
}));

const validManifest = {
  name: 'Cert Module',
  version: '1.0.0',
  supportedContexts: ['personal'],
  permissions: ['test:read'],
  runtime: { apiVersion: '1.0' },
  frontend: { entryUrl: 'https://cdn.example.com/app/index.html' },
};

function mockSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    moduleId: 'test-module',
    status: 'PENDING',
    module: {
      id: 'test-module',
      version: '1.0.0',
      name: 'Cert Module',
      manifest: validManifest,
      permissions: ['test:read'],
    },
    ...overrides,
  };
}

function mockLatestVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mv-1',
    moduleId: 'test-module',
    version: '1.0.0',
    manifestSnapshot: validManifest,
    certificationStatus: 'PASSED',
    certificationErrors: [],
    certificationWarnings: [],
    certificationChecklist: [],
    certificationValidatedAt: new Date(),
    certificationValidatorVersion: CERTIFICATION_VALIDATOR_VERSION,
    ...overrides,
  };
}

describe('MP-Q3 approval publish certification gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as never);
  });

  it('allows approval publish with fresh PASSED certification without revalidation', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue(mockSubmission() as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(mockLatestVersion() as never);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    const persistSpy = vi.spyOn(persistence, 'persistModuleVersionCertification').mockResolvedValue();
    vi.spyOn(prisma.moduleSubmission, 'update').mockResolvedValue({ id: 'sub-1', status: 'APPROVED' } as never);
    vi.spyOn(prisma.moduleVersion, 'updateMany').mockResolvedValue({ count: 0 });
    const versionUpdateSpy = vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-1' } as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({ id: 'test-module' } as never);

    const result = await AdminService.reviewModuleSubmission('sub-1', 'approve', 'ok', 'admin-1');

    expect(persistSpy).not.toHaveBeenCalled();
    expect(versionUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mv-1' },
        data: expect.objectContaining({ status: 'PUBLISHED', isCurrent: true }),
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        certification: expect.objectContaining({ status: 'passed', revalidated: false }),
      })
    );
  });

  it('allows approval publish with WARNING after gate revalidation', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue(mockSubmission() as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(
      mockLatestVersion({
        certificationStatus: 'NOT_RUN',
        certificationValidatorVersion: null,
        manifestSnapshot: {
          name: 'Warn',
          version: '1.0.0',
          supportedContexts: ['personal'],
          permissions: [],
          runtime: {},
          frontend: { entryUrl: 'https://cdn.example.com/x.html' },
        },
      }) as never
    );
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    const persistSpy = vi.spyOn(persistence, 'persistModuleVersionCertification').mockResolvedValue();
    vi.spyOn(prisma.moduleSubmission, 'update').mockResolvedValue({ id: 'sub-1' } as never);
    vi.spyOn(prisma.moduleVersion, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-1' } as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({ id: 'test-module' } as never);

    const result = await AdminService.reviewModuleSubmission('sub-1', 'approve', 'warn ok', 'admin-1');

    expect(persistSpy).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        certification: expect.objectContaining({ status: 'warning', revalidated: true }),
      })
    );
  });

  it('blocks approval publish when certification fails', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue(
      mockSubmission({
        module: {
          id: 'bad-module-id',
          version: '1.0.0',
          name: 'Bad',
          manifest: { permissions: [] },
          permissions: [],
        },
      }) as never
    );
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(
      mockLatestVersion({
        id: 'mv-bad',
        moduleId: 'bad-module-id',
        manifestSnapshot: { permissions: [] },
        certificationStatus: 'NOT_RUN',
      }) as never
    );
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    vi.spyOn(persistence, 'persistModuleVersionCertification').mockResolvedValue();
    const updateSpy = vi.spyOn(prisma.moduleSubmission, 'update');

    await expect(
      AdminService.reviewModuleSubmission('sub-1', 'approve', 'nope', 'admin-1')
    ).rejects.toBeInstanceOf(ModuleVersionCertificationBlockedError);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('revalidates stale validator version before publish', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue(mockSubmission() as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(
      mockLatestVersion({
        certificationStatus: 'PASSED',
        certificationValidatorVersion: '0.0.1',
      }) as never
    );
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    const persistSpy = vi.spyOn(persistence, 'persistModuleVersionCertification').mockResolvedValue();
    vi.spyOn(prisma.moduleSubmission, 'update').mockResolvedValue({ id: 'sub-1' } as never);
    vi.spyOn(prisma.moduleVersion, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-1' } as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({ id: 'test-module' } as never);

    const result = await AdminService.reviewModuleSubmission('sub-1', 'approve', 'ok', 'admin-1');

    expect(persistSpy).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        certification: expect.objectContaining({ revalidated: true }),
      })
    );
  });

  it('persists certification before submission update and publish on NOT_RUN', async () => {
    const callOrder: string[] = [];
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue(mockSubmission() as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(
      mockLatestVersion({ certificationStatus: 'NOT_RUN', certificationValidatorVersion: null }) as never
    );
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    vi.spyOn(persistence, 'persistModuleVersionCertification').mockImplementation(async () => {
      callOrder.push('persist');
    });
    vi.spyOn(prisma.moduleSubmission, 'update').mockImplementation((async () => {
      callOrder.push('submission');
      return { id: 'sub-1' };
    }) as never);
    vi.spyOn(prisma.moduleVersion, 'updateMany').mockImplementation((async () => {
      callOrder.push('archive');
      return { count: 0 };
    }) as never);
    vi.spyOn(prisma.moduleVersion, 'update').mockImplementation((async () => {
      callOrder.push('publish');
      return { id: 'mv-1' };
    }) as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({ id: 'test-module' } as never);

    await AdminService.reviewModuleSubmission('sub-1', 'approve', 'ok', 'admin-1');

    expect(callOrder.indexOf('persist')).toBeGreaterThanOrEqual(0);
    expect(callOrder.indexOf('persist')).toBeLessThan(callOrder.indexOf('submission'));
    expect(callOrder.indexOf('submission')).toBeLessThan(callOrder.indexOf('publish'));
  });
});
