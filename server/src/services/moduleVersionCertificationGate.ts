import {
  CERTIFICATION_VALIDATOR_VERSION,
  buildCertificationInputFromModule,
  validateModuleCertification,
} from './moduleCertificationValidator';
import {
  certificationAdvisoryFromResult,
  persistModuleVersionCertification,
  serializeCertificationFromVersion,
  type ModuleCertificationApiShape,
} from './moduleCertificationPersistence';

export class ModuleVersionCertificationBlockedError extends Error {
  readonly name = 'ModuleVersionCertificationBlockedError';

  constructor(
    message: string,
    public readonly certification: ModuleCertificationApiShape
  ) {
    super(message);
  }
}

export type ModuleVersionCertificationRow = {
  id: string;
  manifestSnapshot: unknown;
  certificationStatus?: string | null;
  certificationErrors?: unknown;
  certificationWarnings?: unknown;
  certificationChecklist?: unknown;
  certificationValidatedAt?: Date | null;
  certificationValidatorVersion?: string | null;
};

/** True when certification was never run or validator version is outdated. */
export function isCertificationStale(version: {
  certificationStatus?: string | null;
  certificationValidatorVersion?: string | null;
}): boolean {
  if (!version.certificationStatus || version.certificationStatus === 'NOT_RUN') {
    return true;
  }
  return version.certificationValidatorVersion !== CERTIFICATION_VALIDATOR_VERSION;
}

function assertCertificationAllowsActivation(certification: ModuleCertificationApiShape): void {
  if (certification.status === 'failed') {
    throw new ModuleVersionCertificationBlockedError(
      'Module certification validation failed',
      certification
    );
  }
}

/**
 * Ensures a module version has fresh, passing certification before promotion/rollback (make current).
 * Re-runs validator when stale or not_run; persists results; blocks on hard errors only.
 */
export async function ensureModuleVersionCertificationForActivation(params: {
  moduleId: string;
  moduleVersion: ModuleVersionCertificationRow;
  modulePermissions?: unknown;
}): Promise<{ certification: ModuleCertificationApiShape; revalidated: boolean }> {
  const { moduleId, moduleVersion, modulePermissions } = params;

  if (isCertificationStale(moduleVersion)) {
    const result = validateModuleCertification(
      buildCertificationInputFromModule(
        {
          id: moduleId,
          manifest: moduleVersion.manifestSnapshot,
          permissions: modulePermissions,
        },
        moduleVersion.manifestSnapshot
      )
    );
    await persistModuleVersionCertification(moduleVersion.id, result);
    const certification = certificationAdvisoryFromResult(result);
    assertCertificationAllowsActivation(certification);
    return { certification, revalidated: true };
  }

  const certification = serializeCertificationFromVersion(moduleVersion);
  assertCertificationAllowsActivation(certification);
  return { certification, revalidated: false };
}
