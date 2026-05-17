import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  CERTIFICATION_VALIDATOR_VERSION,
  type ModuleCertificationValidationResult,
} from './moduleCertificationValidator';

export type CertificationStatusApi = 'not_run' | 'passed' | 'warning' | 'failed';

export interface ModuleCertificationApiShape {
  status: CertificationStatusApi;
  errors: string[];
  warnings: string[];
  checklist: ModuleCertificationValidationResult['checklist'];
  validatedAt: string | null;
  validatorVersion: string | null;
}

export function resolveCertificationStatus(
  result: ModuleCertificationValidationResult
): CertificationStatusApi {
  if (!result.passed) return 'failed';
  if (result.warnings.length > 0) return 'warning';
  return 'passed';
}

function toPrismaCertificationStatus(
  apiStatus: CertificationStatusApi
): 'NOT_RUN' | 'PASSED' | 'WARNING' | 'FAILED' {
  switch (apiStatus) {
    case 'passed':
      return 'PASSED';
    case 'warning':
      return 'WARNING';
    case 'failed':
      return 'FAILED';
    default:
      return 'NOT_RUN';
  }
}

export function certificationResultToPrismaUpdate(
  result: ModuleCertificationValidationResult
): {
  certificationStatus: 'NOT_RUN' | 'PASSED' | 'WARNING' | 'FAILED';
  certificationErrors: Prisma.InputJsonValue;
  certificationWarnings: Prisma.InputJsonValue;
  certificationChecklist: Prisma.InputJsonValue;
  certificationValidatedAt: Date;
  certificationValidatorVersion: string;
} {
  const apiStatus = resolveCertificationStatus(result);
  return {
    certificationStatus: toPrismaCertificationStatus(apiStatus),
    certificationErrors: result.errors as Prisma.InputJsonValue,
    certificationWarnings: result.warnings as Prisma.InputJsonValue,
    certificationChecklist: JSON.parse(JSON.stringify(result.checklist)) as Prisma.InputJsonValue,
    certificationValidatedAt: new Date(),
    certificationValidatorVersion: CERTIFICATION_VALIDATOR_VERSION,
  };
}

export async function persistModuleVersionCertification(
  moduleVersionId: string,
  result: ModuleCertificationValidationResult
): Promise<void> {
  await prisma.moduleVersion.update({
    where: { id: moduleVersionId },
    data: certificationResultToPrismaUpdate(result),
  });
}

export function serializeCertificationFromVersion(version: {
  certificationStatus?: string | null;
  certificationErrors?: unknown;
  certificationWarnings?: unknown;
  certificationChecklist?: unknown;
  certificationValidatedAt?: Date | null;
  certificationValidatorVersion?: string | null;
}): ModuleCertificationApiShape {
  const prismaStatus = version.certificationStatus ?? 'NOT_RUN';
  const status = prismaStatus.toLowerCase() as CertificationStatusApi;

  return {
    status,
    errors: Array.isArray(version.certificationErrors)
      ? (version.certificationErrors as string[])
      : [],
    warnings: Array.isArray(version.certificationWarnings)
      ? (version.certificationWarnings as string[])
      : [],
    checklist: Array.isArray(version.certificationChecklist)
      ? (version.certificationChecklist as ModuleCertificationValidationResult['checklist'])
      : [],
    validatedAt: version.certificationValidatedAt
      ? version.certificationValidatedAt.toISOString()
      : null,
    validatorVersion: version.certificationValidatorVersion ?? null,
  };
}

export function certificationAdvisoryFromResult(
  result: ModuleCertificationValidationResult
): ModuleCertificationApiShape {
  return {
    status: resolveCertificationStatus(result),
    errors: result.errors,
    warnings: result.warnings,
    checklist: result.checklist,
    validatedAt: new Date().toISOString(),
    validatorVersion: CERTIFICATION_VALIDATOR_VERSION,
  };
}
