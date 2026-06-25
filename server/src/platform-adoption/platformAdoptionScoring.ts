import {
  PLATFORM_ADOPTION_CAPABILITY_KEYS,
  type PlatformAdoptionCapabilities,
  type PlatformAdoptionCapabilityKey,
  type ParticipationLevel,
  type AdoptionLevel,
  type AdoptionLevelLabel,
} from './platformAdoptionTypes.js';

export const CAPABILITY_LABELS: Record<PlatformAdoptionCapabilityKey, string> = {
  platformKernel: 'Platform Kernel',
  unifiedSearch: 'Unified Search',
  aiRetrieval: 'AI Retrieval',
  contextGraph: 'Context Graph',
  marketplaceCompat: 'Marketplace Compatibility',
  platformController: 'Platform Controller',
  policyEngine: 'Policy Engine',
  activity: 'Activity System',
  notifications: 'Notifications',
  realtime: 'Realtime',
  aiIntegration: 'AI Integration',
  vLink: 'V_Link',
};

export function participationPoints(level: ParticipationLevel): number | null {
  if (level === 'na') return null;
  if (level === 'full') return 10;
  if (level === 'partial') return 5;
  return 0;
}

export function computeScoreFromCapabilities(
  capabilities: PlatformAdoptionCapabilities,
): number {
  let earned = 0;
  let applicable = 0;
  for (const key of PLATFORM_ADOPTION_CAPABILITY_KEYS as readonly PlatformAdoptionCapabilityKey[]) {
    const points = participationPoints(capabilities[key]);
    if (points === null) continue;
    applicable += 10;
    earned += points;
  }
  if (applicable === 0) return 0;
  return Math.round((earned / applicable) * 100);
}

export function scoreToAdoptionLevel(score: number): AdoptionLevel {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 55) return 'C';
  if (score >= 35) return 'D';
  return 'E';
}

export function adoptionLevelLabel(level: AdoptionLevel): AdoptionLevelLabel {
  switch (level) {
    case 'A':
      return 'Platform Native';
    case 'B':
      return 'Strong';
    case 'C':
      return 'Partial';
    case 'D':
      return 'Minimal';
    case 'E':
      return 'Legacy';
  }
}

export function listMissingCapabilities(
  capabilities: PlatformAdoptionCapabilities,
): string[] {
  return (PLATFORM_ADOPTION_CAPABILITY_KEYS as readonly PlatformAdoptionCapabilityKey[])
    .filter((key) => capabilities[key] === 'missing')
    .map((key) => CAPABILITY_LABELS[key]);
}

/** Decode 12-char capability string (F/P/M/N) into capability map. */
export function decodeCapabilityString(encoded: string): PlatformAdoptionCapabilities {
  const chars = encoded.split('');
  const keys = PLATFORM_ADOPTION_CAPABILITY_KEYS as readonly PlatformAdoptionCapabilityKey[];
  const map = {} as PlatformAdoptionCapabilities;
  const decodeChar = (c: string): ParticipationLevel => {
    switch (c) {
      case 'F':
        return 'full';
      case 'P':
        return 'partial';
      case 'N':
        return 'na';
      default:
        return 'missing';
    }
  };
  keys.forEach((key, index) => {
    map[key] = decodeChar(chars[index] ?? 'M');
  });
  return map;
}
