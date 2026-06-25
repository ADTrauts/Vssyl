/** Platform Adoption Program — operator visibility types (Wave 5). */

export type ParticipationLevel = 'full' | 'partial' | 'missing' | 'na';

export type AdoptionLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export type AdoptionLevelLabel =
  | 'Platform Native'
  | 'Strong'
  | 'Partial'
  | 'Minimal'
  | 'Legacy';

export type ModuleCategory =
  | 'product'
  | 'business'
  | 'composition'
  | 'platform'
  | 'partner';

export const PLATFORM_ADOPTION_CAPABILITY_KEYS = [
  'platformKernel',
  'unifiedSearch',
  'aiRetrieval',
  'contextGraph',
  'marketplaceCompat',
  'platformController',
  'policyEngine',
  'activity',
  'notifications',
  'realtime',
  'aiIntegration',
  'vLink',
] as const;

export type PlatformAdoptionCapabilityKey = (typeof PLATFORM_ADOPTION_CAPABILITY_KEYS)[number];

export type PlatformAdoptionCapabilities = Record<
  PlatformAdoptionCapabilityKey,
  ParticipationLevel
>;

export interface PlatformAdoptionDocLink {
  label: string;
  href: string;
}

export interface PlatformAdoptionChange {
  wave: number;
  date: string;
  summary: string;
}

export interface PlatformAdoptionRegistryEntry {
  moduleId: string;
  displayName: string;
  category: ModuleCategory;
  certificationRef: string;
  lastValidated: string;
  baselineScore: number;
  capabilities: PlatformAdoptionCapabilities;
  topGap: string;
  recommendedImprovements: string[];
  docLinks: PlatformAdoptionDocLink[];
  recentChanges: PlatformAdoptionChange[];
}

export interface PlatformAdoptionLiveSignals {
  searchProviderReady: boolean;
  manifestSearchClaim: boolean;
  manifestAiClaim: boolean;
  activityServiceDetected: boolean;
}

export interface PlatformAdoptionModuleCard {
  moduleId: string;
  displayName: string;
  category: ModuleCategory;
  adoptionLevel: AdoptionLevel;
  adoptionLevelLabel: AdoptionLevelLabel;
  score: number;
  certificationRef: string;
  lastValidated: string;
  missingCapabilities: string[];
  capabilities: PlatformAdoptionCapabilities;
  topGap: string;
  liveSignals: PlatformAdoptionLiveSignals;
  validationWarnings: string[];
}

export interface PlatformAdoptionFleetSummary {
  totalModules: number;
  averageScore: number;
  levelDistribution: Record<AdoptionLevel, number>;
  modulesFullySearchable: number;
  modulesAiRetrievalFull: number;
  modulesKernelActivityFull: number;
  modulesContextGraphFull: number;
  marketplaceCapableModules: number;
  certificationDistribution: Record<string, number>;
  validationWarningCount: number;
  lastAssessedAt: string;
}

export interface PlatformAdoptionModuleDetail extends PlatformAdoptionModuleCard {
  recommendedImprovements: string[];
  docLinks: PlatformAdoptionDocLink[];
  recentChanges: PlatformAdoptionChange[];
  capabilityChecklist: Array<{
    key: PlatformAdoptionCapabilityKey;
    label: string;
    level: ParticipationLevel;
    liveNote?: string;
  }>;
}

export interface PlatformAdoptionTrendPoint {
  date: string;
  label: string;
  averageScore: number;
  wave?: number;
}

export interface PlatformAdoptionValidationWarning {
  code: string;
  severity: 'warning' | 'error';
  moduleId?: string;
  message: string;
}

export interface PlatformAdoptionValidationResult {
  assessedAt: string;
  warnings: PlatformAdoptionValidationWarning[];
  errorCount: number;
  warningCount: number;
}

export interface PlatformAdoptionDashboardPayload {
  fleet: PlatformAdoptionFleetSummary;
  modules: PlatformAdoptionModuleCard[];
  trends: PlatformAdoptionTrendPoint[];
  validation: PlatformAdoptionValidationResult;
}
