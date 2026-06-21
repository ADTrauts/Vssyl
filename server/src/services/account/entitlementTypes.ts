/**
 * Canonical platform tier vocabulary (PP-3 Package 1).
 * Subscription.tier is the write authority; Business.tier is a derived cache.
 */
export const PLATFORM_TIERS = [
  'free',
  'pro',
  'business_basic',
  'business_advanced',
  'enterprise',
] as const;

export type PlatformTier = (typeof PLATFORM_TIERS)[number];

export type TierSource = 'subscription' | 'business_cache' | 'default';

export type EntitlementScope = 'personal' | 'business';

export interface EntitlementContext {
  userId: string;
  businessId?: string;
}

export interface TierResolution {
  tier: PlatformTier;
  source: TierSource;
  subscriptionId?: string;
  rawTier?: string;
  businessId?: string;
  userId: string;
}

export interface EffectiveEntitlements {
  tier: PlatformTier;
  source: TierSource;
  subscriptionId?: string;
  scope: EntitlementScope;
  userId: string;
  businessId?: string;
  features: string[];
}

export interface FeatureAccessResult {
  allowed: boolean;
  tier: PlatformTier;
  reason?: string;
}

export interface ModuleAccessResult {
  allowed: boolean;
  tier: PlatformTier;
  missingFeatures: string[];
  availableFeatures: string[];
}

/** Ordered tier hierarchy for comparison (higher index = more capable). */
export const TIER_HIERARCHY: Record<PlatformTier, number> = {
  free: 0,
  pro: 1,
  business_basic: 2,
  business_advanced: 3,
  enterprise: 4,
};

const BUSINESS_TIERS = new Set<PlatformTier>([
  'business_basic',
  'business_advanced',
  'enterprise',
]);

/**
 * Normalize legacy tier strings to canonical vocabulary.
 * `standard` maps to `pro` (personal) or `business_basic` (business context).
 */
export function normalizeTier(raw: string | null | undefined, businessContext?: boolean): PlatformTier {
  if (!raw) return 'free';
  const lower = raw.toLowerCase();
  if (lower === 'standard') {
    return businessContext ? 'business_basic' : 'pro';
  }
  if (PLATFORM_TIERS.includes(lower as PlatformTier)) {
    return lower as PlatformTier;
  }
  return 'free';
}

export function isPlatformTier(value: string): value is PlatformTier {
  return (PLATFORM_TIERS as readonly string[]).includes(value);
}

export function compareTiers(userTier: PlatformTier, requiredTier: PlatformTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

export function isBusinessTier(tier: PlatformTier): boolean {
  return BUSINESS_TIERS.has(tier);
}
