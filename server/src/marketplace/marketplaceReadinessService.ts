import { prisma } from '../lib/prisma.js';
import { asRecordJson } from '../controllers/module/moduleShared.js';
import { getPartnerSearchDelegate } from './searchDelegateRegistry.js';
import { getPartnerWorkspaceParticipation } from './workspaceParticipationRegistry.js';
import {
  isPartnerSearchDelegateEnabled,
  isModuleAllowedForSearchDelegate,
} from './searchDelegateConfig.js';
import {
  isPartnerWorkspaceBridgeEnabled,
  isModuleAllowedForWorkspaceBridge,
} from './workspaceBridgeConfig.js';
import {
  isPartnerActivityIngestEnabled,
  isModuleAllowedForActivityIngest,
} from './activityIngestConfig.js';
import { getPartnerActivityIngest } from './activityIngestRegistry.js';
import { parseActivityIngestFromManifest } from './activityIngestManifest.js';
import {
  moduleRequiresBusinessSubscription,
} from '../services/businessModuleSubscriptionService.js';
import { validateModuleCertification } from '../services/moduleCertificationValidator.js';
import { resolveEffectiveModuleScope } from './moduleScopeService.js';

export interface MarketplaceReadinessResult {
  moduleId: string;
  moduleScope: string | null;
  supportedContexts: string[];
  certification: {
    status: 'not_run' | 'passed' | 'warning' | 'failed';
    validatorVersion: string | null;
    passed: boolean;
    errorCount: number;
    warningCount: number;
  };
  searchDelegate: {
    declared: boolean;
    registered: boolean;
    enabled: boolean;
    allowlisted: boolean;
  };
  workspaceBridge: {
    declared: boolean;
    registered: boolean;
    enabled: boolean;
    allowlisted: boolean;
  };
  businessBilling: {
    applicable: boolean;
    requiresSubscription: boolean;
    scopeCompatible: boolean;
  };
  activityIngest: {
    declared: boolean;
    registered: boolean;
    enabled: boolean;
    allowlisted: boolean;
    manifestValid: boolean;
    certificationActive: boolean;
    lastProbeOutcome?: string | null;
  };
}

function declaresCapability(manifest: Record<string, unknown>, key: string): boolean {
  const caps = manifest.capabilities;
  if (caps && typeof caps === 'object' && !Array.isArray(caps)) {
    return (caps as Record<string, unknown>)[key] === true;
  }
  if (Array.isArray(caps)) {
    return caps.some((c) => typeof c === 'string' && c.toLowerCase() === key);
  }
  return false;
}

export async function getMarketplaceReadiness(
  moduleId: string
): Promise<MarketplaceReadinessResult | null> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      manifest: true,
      pricingTier: true,
      isProprietary: true,
      versions: {
        where: { isCurrent: true },
        take: 1,
        select: {
          manifestSnapshot: true,
          certificationStatus: true,
          certificationErrors: true,
          certificationWarnings: true,
          certificationValidatorVersion: true,
        },
      },
    },
  });

  if (!mod) return null;

  const manifest = asRecordJson(mod.versions[0]?.manifestSnapshot ?? mod.manifest);
  const resolved = resolveEffectiveModuleScope(manifest, moduleId);
  const certificationLive = validateModuleCertification({
    moduleId,
    manifest,
    isThirdParty: true,
  });

  const currentVersion = mod.versions[0];
  const certStatus = currentVersion?.certificationStatus?.toLowerCase() as
    | 'not_run'
    | 'passed'
    | 'warning'
    | 'failed'
    | undefined;

  const searchRegistered = Boolean(getPartnerSearchDelegate(moduleId));
  const workspaceRegistered = Boolean(getPartnerWorkspaceParticipation(moduleId));
  const activityRegistered = Boolean(getPartnerActivityIngest(moduleId));
  const { ingest: activityIngest, errors: activityErrors } = parseActivityIngestFromManifest(manifest);

  const scopeCompatible =
    resolved?.moduleScope === 'business' ||
    resolved?.moduleScope === 'both' ||
    resolved?.moduleScope === 'internal';

  return {
    moduleId,
    moduleScope: resolved?.moduleScope ?? null,
    supportedContexts: resolved?.supportedContexts ?? [],
    certification: {
      status:
        certStatus === 'passed' || certStatus === 'warning' || certStatus === 'failed'
          ? certStatus
          : certificationLive.passed
            ? 'passed'
            : 'failed',
      validatorVersion: currentVersion?.certificationValidatorVersion ?? null,
      passed: certificationLive.passed,
      errorCount: certificationLive.errors.length,
      warningCount: certificationLive.warnings.length,
    },
    searchDelegate: {
      declared: declaresCapability(manifest, 'search'),
      registered: searchRegistered,
      enabled: isPartnerSearchDelegateEnabled(),
      allowlisted: isModuleAllowedForSearchDelegate(moduleId),
    },
    workspaceBridge: {
      declared: declaresCapability(manifest, 'workspace'),
      registered: workspaceRegistered,
      enabled: isPartnerWorkspaceBridgeEnabled(),
      allowlisted: isModuleAllowedForWorkspaceBridge(moduleId),
    },
    businessBilling: {
      applicable: moduleRequiresBusinessSubscription(mod),
      requiresSubscription: moduleRequiresBusinessSubscription(mod),
      scopeCompatible,
    },
    activityIngest: {
      declared: declaresCapability(manifest, 'activity'),
      registered: activityRegistered,
      enabled: isPartnerActivityIngestEnabled(),
      allowlisted: isModuleAllowedForActivityIngest(moduleId),
      manifestValid: Boolean(activityIngest) && activityErrors.length === 0,
      certificationActive:
        certificationLive.passed &&
        certificationLive.checklist.find((c) => c.id === 'activity_ingest')?.status !== 'fail',
    },
  };
}

export async function getPublishedModuleManifest(
  moduleId: string
): Promise<Record<string, unknown> | null> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      manifest: true,
      versions: {
        where: { isCurrent: true },
        take: 1,
        select: { manifestSnapshot: true },
      },
    },
  });

  if (!mod) return null;
  return asRecordJson(mod.versions[0]?.manifestSnapshot ?? mod.manifest);
}
