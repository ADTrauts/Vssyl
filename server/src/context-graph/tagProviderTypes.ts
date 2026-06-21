/**
 * Federation contract for module-owned tag reads.
 * Context Graph reads tags; modules remain SoR. No tag writes in this layer.
 */

import type { AdapterContext, EntityRef } from './contextGraphTypes.js';
import type { TagDescriptor, TagIndexQueryScope } from './tagDescriptorTypes.js';

export interface ContextGraphTagProvider {
  readonly moduleId: string;
  readonly supportedEntityTypes: readonly string[];

  /** Tags on a single entity — empty if denied or none */
  getTagsForEntity(ctx: AdapterContext, ref: EntityRef): Promise<TagDescriptor[]>;

  /** Federated lookup by tag label within tenant scope */
  searchByTagLabel(
    ctx: AdapterContext,
    tagLabel: string,
    scope: TagIndexQueryScope,
    limit: number
  ): Promise<TagDescriptor[]>;
}

export function isContextGraphTagProvider(
  value: unknown
): value is ContextGraphTagProvider {
  if (!value || typeof value !== 'object') return false;
  const record = value as ContextGraphTagProvider;
  return (
    typeof record.moduleId === 'string' &&
    Array.isArray(record.supportedEntityTypes) &&
    typeof record.getTagsForEntity === 'function' &&
    typeof record.searchByTagLabel === 'function'
  );
}
