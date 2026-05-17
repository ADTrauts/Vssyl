import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  resolveCertificationStatus,
  certificationResultToPrismaUpdate,
  persistModuleVersionCertification,
  serializeCertificationFromVersion,
} from '../moduleCertificationPersistence';
import { CERTIFICATION_VALIDATOR_VERSION } from '../moduleCertificationValidator';

describe('moduleCertificationPersistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolveCertificationStatus maps failed, warning, passed', () => {
    expect(resolveCertificationStatus({ passed: false, errors: ['x'], warnings: [], checklist: [] })).toBe(
      'failed'
    );
    expect(
      resolveCertificationStatus({ passed: true, errors: [], warnings: ['advisory'], checklist: [] })
    ).toBe('warning');
    expect(resolveCertificationStatus({ passed: true, errors: [], warnings: [], checklist: [] })).toBe(
      'passed'
    );
  });

  it('certificationResultToPrismaUpdate includes validator version', () => {
    const data = certificationResultToPrismaUpdate({
      passed: true,
      errors: [],
      warnings: [],
      checklist: [{ id: 'a', label: 'A', status: 'pass' }],
    });
    expect(data.certificationStatus).toBe('PASSED');
    expect(data.certificationValidatorVersion).toBe(CERTIFICATION_VALIDATOR_VERSION);
    expect(data.certificationValidatedAt).toBeInstanceOf(Date);
  });

  it('persistModuleVersionCertification updates module version row', async () => {
    const updateSpy = vi.spyOn(prisma.moduleVersion, 'update').mockResolvedValue({ id: 'mv-1' } as never);

    await persistModuleVersionCertification('mv-1', {
      passed: false,
      errors: ['manifest.name is required'],
      warnings: [],
      checklist: [],
    });

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'mv-1' },
      data: expect.objectContaining({
        certificationStatus: 'FAILED',
        certificationErrors: ['manifest.name is required'],
      }),
    });
  });

  it('serializeCertificationFromVersion maps prisma enum to api shape', () => {
    const api = serializeCertificationFromVersion({
      certificationStatus: 'WARNING',
      certificationErrors: [],
      certificationWarnings: ['empty permissions'],
      certificationChecklist: [],
      certificationValidatedAt: new Date('2026-05-17T12:00:00.000Z'),
      certificationValidatorVersion: '1.0.0',
    });
    expect(api.status).toBe('warning');
    expect(api.warnings).toEqual(['empty permissions']);
    expect(api.validatedAt).toBe('2026-05-17T12:00:00.000Z');
  });
});
