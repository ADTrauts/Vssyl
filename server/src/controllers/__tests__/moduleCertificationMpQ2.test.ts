import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { reviewModuleSubmission } from '../module/moduleSubmissionController';
import * as persistence from '../../services/moduleCertificationPersistence';
import { CERTIFICATION_VALIDATOR_VERSION } from '../../services/moduleCertificationValidator';

vi.mock('../../services/ModuleRegistrySyncService.js', () => ({
  moduleRegistrySyncService: { syncModule: vi.fn().mockResolvedValue(undefined) },
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

const validManifest = {
  name: 'Cert Module',
  version: '1.0.0',
  moduleScope: 'personal',
  supportedContexts: ['personal'],
  permissions: ['test:read'],
  runtime: { apiVersion: '1.0' },
  frontend: { entryUrl: 'https://cdn.example.com/app/index.html' },
};

describe('MP-Q2 certification persistence on review', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('persists failed certification and blocks approval', async () => {
    const persistSpy = vi.spyOn(persistence, 'persistModuleVersionCertification').mockResolvedValue();
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as never);

    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue({
      id: 'sub-1',
      moduleId: 'bad-module-id',
      status: 'PENDING',
      module: {
        id: 'bad-module-id',
        version: '1.0.0',
        name: 'Bad',
        manifest: { permissions: [] },
        permissions: [],
      },
    } as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue({
      id: 'mv-1',
      moduleId: 'bad-module-id',
      version: '1.0.0',
      manifestSnapshot: { permissions: [] },
    } as never);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    const updateSpy = vi.spyOn(prisma.moduleSubmission, 'update');

    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      params: { submissionId: 'sub-1' },
      body: { action: 'approve', reviewNotes: 'nope' },
    } as unknown as Request;
    const res = mockResponse();

    await reviewModuleSubmission(req, res);

    expect(persistSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        details: expect.objectContaining({
          certification: expect.objectContaining({ status: 'failed' }),
        }),
      })
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('allows approval when scan passed and fresh PASSED certification (no re-persist)', async () => {
    const persistSpy = vi.spyOn(persistence, 'persistModuleVersionCertification').mockResolvedValue();
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as never);

    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue({
      id: 'sub-2',
      moduleId: 'test-module',
      status: 'PENDING',
      module: {
        id: 'test-module',
        version: '1.0.0',
        name: 'Good',
        manifest: validManifest,
        permissions: ['test:read'],
      },
    } as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue({
      id: 'mv-2',
      moduleId: 'test-module',
      version: '1.0.0',
      manifestSnapshot: validManifest,
      certificationStatus: 'PASSED',
      certificationErrors: [],
      certificationWarnings: [],
      certificationChecklist: [],
      certificationValidatedAt: new Date(),
      certificationValidatorVersion: CERTIFICATION_VALIDATOR_VERSION,
    } as never);
    vi.spyOn(prisma.moduleArtifact, 'findUnique').mockResolvedValue({ scanStatus: 'PASSED' } as never);
    vi.spyOn(prisma.moduleSubmission, 'update').mockResolvedValue({
      id: 'sub-2',
      status: 'APPROVED',
      module: { id: 'test-module' },
      submitter: {},
      reviewer: {},
    } as never);
    vi.spyOn(prisma.moduleVersion, 'updateMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-2' } as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({ id: 'test-module' } as never);

    const req = {
      user: { id: 'admin-1', role: 'ADMIN' },
      params: { submissionId: 'sub-2' },
      body: { action: 'approve', reviewNotes: 'ok' },
    } as unknown as Request;
    const res = mockResponse();

    await reviewModuleSubmission(req, res);

    expect(persistSpy).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          certification: expect.objectContaining({ status: 'passed', revalidated: false }),
        }),
      })
    );
  });
});
