import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  ensureModuleVersionCertificationForActivation,
  isCertificationStale,
  ModuleVersionCertificationBlockedError,
} from '../moduleVersionCertificationGate';
import { CERTIFICATION_VALIDATOR_VERSION } from '../moduleCertificationValidator';

const validManifest = {
  name: 'Test Module',
  version: '1.0.0',
  moduleScope: 'personal',
  supportedContexts: ['personal'],
  permissions: ['test:read'],
  runtime: { apiVersion: '1.0' },
  frontend: { entryUrl: 'https://cdn.example.com/app/index.html' },
};

describe('moduleVersionCertificationGate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('isCertificationStale when NOT_RUN or validator version mismatch', () => {
    expect(isCertificationStale({ certificationStatus: 'NOT_RUN' })).toBe(true);
    expect(
      isCertificationStale({
        certificationStatus: 'PASSED',
        certificationValidatorVersion: '0.0.1',
      })
    ).toBe(true);
    expect(
      isCertificationStale({
        certificationStatus: 'PASSED',
        certificationValidatorVersion: CERTIFICATION_VALIDATOR_VERSION,
      })
    ).toBe(false);
  });

  it('allows promotion with fresh PASSED certification without revalidation', async () => {
    const result = await ensureModuleVersionCertificationForActivation({
      moduleId: 'test-module',
      moduleVersion: {
        id: 'mv-1',
        manifestSnapshot: validManifest,
        certificationStatus: 'PASSED',
        certificationErrors: [],
        certificationWarnings: [],
        certificationChecklist: [],
        certificationValidatedAt: new Date(),
        certificationValidatorVersion: CERTIFICATION_VALIDATOR_VERSION,
      },
      modulePermissions: ['test:read'],
    });

    expect(result.revalidated).toBe(false);
    expect(result.certification.status).toBe('passed');
  });

  it('allows promotion with WARNING after revalidation', async () => {
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-2' } as never);

    const result = await ensureModuleVersionCertificationForActivation({
      moduleId: 'test-module',
      moduleVersion: {
        id: 'mv-2',
        manifestSnapshot: {
          name: 'Test',
          version: '1.0.0',
          moduleScope: 'personal',
          supportedContexts: ['personal'],
          permissions: [],
          runtime: {},
          frontend: { entryUrl: 'https://cdn.example.com/x.html' },
        },
        certificationStatus: 'NOT_RUN',
      },
      modulePermissions: [],
    });

    expect(result.revalidated).toBe(true);
    expect(result.certification.status).toBe('warning');
    expect(result.certification.warnings.length).toBeGreaterThan(0);
  });

  it('blocks promotion when certification fails', async () => {
    vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-3' } as never);

    await expect(
      ensureModuleVersionCertificationForActivation({
        moduleId: 'bad-id',
        moduleVersion: {
          id: 'mv-3',
          manifestSnapshot: { permissions: [] },
          certificationStatus: 'NOT_RUN',
        },
      })
    ).rejects.toBeInstanceOf(ModuleVersionCertificationBlockedError);
  });

  it('blocks when persisted certification is FAILED without revalidation', async () => {
    await expect(
      ensureModuleVersionCertificationForActivation({
        moduleId: 'test-module',
        moduleVersion: {
          id: 'mv-4',
          manifestSnapshot: validManifest,
          certificationStatus: 'FAILED',
          certificationErrors: ['manifest.name is required'],
          certificationValidatorVersion: CERTIFICATION_VALIDATOR_VERSION,
        },
      })
    ).rejects.toBeInstanceOf(ModuleVersionCertificationBlockedError);
  });

  it('revalidates when validator version is stale', async () => {
    const updateSpy = vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-5' } as never);

    const result = await ensureModuleVersionCertificationForActivation({
      moduleId: 'test-module',
      moduleVersion: {
        id: 'mv-5',
        manifestSnapshot: validManifest,
        certificationStatus: 'PASSED',
        certificationValidatorVersion: '0.9.0',
      },
      modulePermissions: ['test:read'],
    });

    expect(result.revalidated).toBe(true);
    expect(updateSpy).toHaveBeenCalled();
    expect(result.certification.status).toBe('passed');
  });
});
