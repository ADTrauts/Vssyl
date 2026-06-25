import type {
  AdoptionLevel,
  PlatformAdoptionCapabilities,
  PlatformAdoptionDashboardPayload,
  PlatformAdoptionFleetSummary,
  PlatformAdoptionModuleCard,
  PlatformAdoptionModuleDetail,
  PlatformAdoptionValidationResult,
  PlatformAdoptionCapabilityKey,
} from '../../platform-adoption/platformAdoptionTypes.js';
import {
  CAPABILITY_LABELS,
  adoptionLevelLabel,
  listMissingCapabilities,
  scoreToAdoptionLevel,
} from '../../platform-adoption/platformAdoptionScoring.js';
import {
  PLATFORM_ADOPTION_REGISTRY,
  getAdoptionRegistryEntry,
  getAdoptionRegistryModuleIds,
} from '../../platform-adoption/platformAdoptionRegistry.js';
import {
  getValidationWarningsForModule,
  resolveLiveSignals,
  runPlatformAdoptionCiValidation,
} from '../../platform-adoption/platformAdoptionValidation.js';
import { getPlatformAdoptionTrends } from '../../platform-adoption/platformAdoptionTrends.js';
import { getEnabledPartnerSearchDelegates } from '../../marketplace/searchDelegateRegistry.js';
import { prisma } from '../../lib/prisma.js';

function wave5ControllerCapability(
  capabilities: PlatformAdoptionCapabilities,
): PlatformAdoptionCapabilities {
  if (capabilities.platformController === 'missing') {
    return { ...capabilities, platformController: 'partial' };
  }
  return capabilities;
}

function buildModuleCard(
  entry: (typeof PLATFORM_ADOPTION_REGISTRY)[number],
): PlatformAdoptionModuleCard {
  const capabilities = wave5ControllerCapability(entry.capabilities);
  const liveSignals = resolveLiveSignals(entry.moduleId);
  const validationWarnings = getValidationWarningsForModule(entry.moduleId);

  let score = entry.baselineScore;
  if (capabilities.unifiedSearch === 'full' && !liveSignals.searchProviderReady) {
    score = Math.max(0, score - 10);
  }

  const adoptionLevel = scoreToAdoptionLevel(score);

  return {
    moduleId: entry.moduleId,
    displayName: entry.displayName,
    category: entry.category,
    adoptionLevel,
    adoptionLevelLabel: adoptionLevelLabel(adoptionLevel),
    score,
    certificationRef: entry.certificationRef,
    lastValidated: entry.lastValidated,
    missingCapabilities: listMissingCapabilities(capabilities),
    capabilities,
    topGap: entry.topGap,
    liveSignals,
    validationWarnings,
  };
}

function countByLevel(modules: PlatformAdoptionModuleCard[]): Record<AdoptionLevel, number> {
  const dist: Record<AdoptionLevel, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const mod of modules) {
    dist[mod.adoptionLevel] += 1;
  }
  return dist;
}

function countFull(capabilities: PlatformAdoptionCapabilities[], key: PlatformAdoptionCapabilityKey): number {
  return capabilities.filter((c) => c[key] === 'full').length;
}

async function countMarketplaceModules(): Promise<number> {
  try {
    const builtInIds = new Set(getAdoptionRegistryModuleIds());
    const modules = await prisma.module.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, manifest: true },
    });
    return modules.filter((m) => {
      const manifest = m.manifest as Record<string, unknown> | null;
      const moduleId = typeof manifest?.id === 'string' ? manifest.id : m.id;
      return !builtInIds.has(moduleId);
    }).length;
  } catch {
    return getEnabledPartnerSearchDelegates().length;
  }
}

function buildFleetSummary(
  modules: PlatformAdoptionModuleCard[],
  validation: PlatformAdoptionValidationResult,
  marketplaceCapableModules: number,
): PlatformAdoptionFleetSummary {
  const capabilityRows = modules.map((m) => m.capabilities);
  const certDist: Record<string, number> = {};
  for (const mod of modules) {
    certDist[mod.certificationRef] = (certDist[mod.certificationRef] ?? 0) + 1;
  }

  const averageScore =
    modules.length === 0
      ? 0
      : Math.round((modules.reduce((sum, m) => sum + m.score, 0) / modules.length) * 10) / 10;

  return {
    totalModules: modules.length,
    averageScore,
    levelDistribution: countByLevel(modules),
    modulesFullySearchable: countFull(capabilityRows, 'unifiedSearch'),
    modulesAiRetrievalFull: countFull(capabilityRows, 'aiRetrieval'),
    modulesKernelActivityFull: countFull(capabilityRows, 'platformKernel'),
    modulesContextGraphFull: countFull(capabilityRows, 'contextGraph'),
    marketplaceCapableModules,
    certificationDistribution: certDist,
    validationWarningCount: validation.warningCount + validation.errorCount,
    lastAssessedAt: validation.assessedAt,
  };
}

export async function getPlatformAdoptionDashboard(): Promise<PlatformAdoptionDashboardPayload> {
  const validation = runPlatformAdoptionCiValidation();
  const modules = PLATFORM_ADOPTION_REGISTRY.map(buildModuleCard).sort((a, b) => b.score - a.score);
  const marketplaceCapableModules = await countMarketplaceModules();

  return {
    fleet: buildFleetSummary(modules, validation, marketplaceCapableModules),
    modules,
    trends: getPlatformAdoptionTrends(),
    validation,
  };
}

export function getPlatformAdoptionModuleDetail(moduleId: string): PlatformAdoptionModuleDetail {
  const entry = getAdoptionRegistryEntry(moduleId);
  if (!entry) {
    throw new Error(`Unknown adoption module: ${moduleId}`);
  }

  const card = buildModuleCard(entry);
  const liveSignals = resolveLiveSignals(moduleId);

  const capabilityChecklist = (
    Object.keys(CAPABILITY_LABELS) as PlatformAdoptionCapabilityKey[]
  ).map((key) => {
    let liveNote: string | undefined;
    if (key === 'unifiedSearch') {
      liveNote = liveSignals.searchProviderReady
        ? 'Search provider registered (ready)'
        : liveSignals.manifestSearchClaim
          ? 'Manifest claims search — provider gap'
          : 'No search participation';
    }
    if (key === 'activity') {
      liveNote = liveSignals.activityServiceDetected
        ? 'Activity service mapping detected'
        : 'No mapped activity service';
    }
    if (key === 'platformController') {
      liveNote = 'Visible in Platform Adoption dashboard (Wave 5)';
    }
    return {
      key,
      label: CAPABILITY_LABELS[key],
      level: card.capabilities[key],
      liveNote,
    };
  });

  return {
    ...card,
    recommendedImprovements: entry.recommendedImprovements,
    docLinks: entry.docLinks,
    recentChanges: entry.recentChanges,
    capabilityChecklist,
  };
}

export function getPlatformAdoptionValidation(): PlatformAdoptionValidationResult {
  return runPlatformAdoptionCiValidation();
}
