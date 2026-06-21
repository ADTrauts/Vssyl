/**
 * Tag descriptor contract — tags are metadata on module entities, not graph nodes.
 * @see docs/context-graph/CG_2A_TAG_INDEX_ARCHITECTURE.md
 */

import type { EntityRef } from './contextGraphTypes.js';

export const TAG_INDEX_CONTRACT_VERSION = '1.0';

export const MAX_TAG_SEARCH_RESULTS = 50;
export const MAX_TAGS_PER_ENTITY = 25;

export interface TagDescriptor {
  /** Deterministic federated id — not a platform SoR tag row */
  tagId: string;
  tagLabel: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
}

export interface TagIndexQueryScope {
  dashboardId?: string;
  businessId?: string | null;
  householdId?: string | null;
}

export function normalizeTagLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function buildTagId(
  sourceModule: string,
  sourceEntityType: string,
  sourceEntityId: string,
  tagLabel: string
): string {
  const normalized = normalizeTagLabel(tagLabel);
  return `${sourceModule}:${sourceEntityType}:${sourceEntityId}:${normalized}`;
}

export function tagDescriptorFromEntity(
  ref: EntityRef,
  tagLabel: string
): TagDescriptor {
  const normalized = normalizeTagLabel(tagLabel);
  return {
    tagId: buildTagId(ref.moduleId, ref.entityType, ref.entityId, normalized),
    tagLabel: normalized,
    sourceModule: ref.moduleId,
    sourceEntityType: ref.entityType,
    sourceEntityId: ref.entityId,
  };
}

export function parseTagStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    .map((t) => normalizeTagLabel(t))
    .slice(0, MAX_TAGS_PER_ENTITY);
}
