import type { PlatformAdoptionTrendPoint } from './platformAdoptionTypes.js';

/** Wave completion milestones for operator trend reporting. */
export const PLATFORM_ADOPTION_TREND_HISTORY: PlatformAdoptionTrendPoint[] = [
  { date: '2026-06-01', label: 'Phase 0A baseline', averageScore: 58.2 },
  { date: '2026-06-18', label: 'Wave 1 — Kernel reads', averageScore: 62.4, wave: 1 },
  { date: '2026-06-22', label: 'Wave 2 — Discoverability', averageScore: 65.8, wave: 2 },
  { date: '2026-06-24', label: 'Wave 3 — Query-native AI', averageScore: 67.2, wave: 3 },
  { date: '2026-06-25', label: 'Wave 4 — Dashboard native', averageScore: 68.1, wave: 4 },
  { date: '2026-06-25', label: 'Wave 5 — Operator visibility', averageScore: 68.1, wave: 5 },
];

export function getPlatformAdoptionTrends(): PlatformAdoptionTrendPoint[] {
  return [...PLATFORM_ADOPTION_TREND_HISTORY];
}
