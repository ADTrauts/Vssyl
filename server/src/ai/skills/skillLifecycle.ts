/**
 * Phase 8 — Skill lifecycle transitions (immutable published versions).
 */
import type { AISkillStatus } from 'vssyl-shared';

const ALLOWED: Partial<Record<AISkillStatus, ReadonlySet<AISkillStatus>>> = {
  DRAFT: new Set(['REVIEW', 'SUSPENDED', 'RETIRED']),
  REVIEW: new Set(['CERTIFIED', 'DRAFT', 'SUSPENDED']),
  CERTIFIED: new Set(['ACTIVE', 'DEPRECATED', 'SUSPENDED']),
  ACTIVE: new Set(['DEPRECATED', 'SUSPENDED']),
  DEPRECATED: new Set(['RETIRED', 'SUSPENDED', 'ACTIVE']),
  SUSPENDED: new Set(['DRAFT', 'REVIEW', 'CERTIFIED', 'ACTIVE', 'RETIRED']),
  RETIRED: new Set(),
};

/** Published versions are immutable — status machine applies to registry activation pointers. */
export const IMMUTABLE_AFTER: ReadonlySet<AISkillStatus> = new Set([
  'CERTIFIED',
  'ACTIVE',
  'DEPRECATED',
  'RETIRED',
]);

export function canTransitionSkillStatus(from: AISkillStatus, to: AISkillStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.has(to) ?? false;
}

export function assertSkillStatusTransition(
  from: AISkillStatus,
  to: AISkillStatus
): { ok: true } | { ok: false; error: string } {
  if (canTransitionSkillStatus(from, to)) return { ok: true };
  return { ok: false, error: `Illegal skill status transition: ${from} → ${to}` };
}

export function isExecutableStatus(status: AISkillStatus): boolean {
  return status === 'ACTIVE' || status === 'CERTIFIED';
}
