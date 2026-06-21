/**
 * Read-only federated tag index — aggregates module tag providers; never owns tags.
 * Module SoR remains authoritative for tag assignment.
 */

import type { AdapterContext, EntityRef } from './contextGraphTypes.js';
import {
  getTagProviderByModule,
  getTagProviderForEntity,
  listTagProviders,
} from './tagProviderRegistry.js';
import {
  MAX_TAG_SEARCH_RESULTS,
  normalizeTagLabel,
  TAG_INDEX_CONTRACT_VERSION,
  type TagDescriptor,
  type TagIndexQueryScope,
} from './tagDescriptorTypes.js';

export interface TagIndexSearchResult {
  version: typeof TAG_INDEX_CONTRACT_VERSION;
  tagLabel: string;
  descriptors: TagDescriptor[];
  modulesQueried: string[];
  truncated: boolean;
}

export interface TagIndexEntityResult {
  version: typeof TAG_INDEX_CONTRACT_VERSION;
  entity: EntityRef;
  descriptors: TagDescriptor[];
}

export interface TagIndexModuleResult {
  version: typeof TAG_INDEX_CONTRACT_VERSION;
  moduleId: string;
  descriptors: TagDescriptor[];
  entitiesScanned: number;
  truncated: boolean;
}

function adapterContext(userId: string, scope?: TagIndexQueryScope): AdapterContext {
  return {
    userId,
    dashboardId: scope?.dashboardId,
    businessId: scope?.businessId,
    householdId: scope?.householdId,
  };
}

export async function lookupTagsByLabel(
  userId: string,
  tagLabel: string,
  scope: TagIndexQueryScope,
  limit = MAX_TAG_SEARCH_RESULTS
): Promise<TagIndexSearchResult> {
  const normalized = normalizeTagLabel(tagLabel);
  const capped = Math.min(Math.max(limit, 1), MAX_TAG_SEARCH_RESULTS);
  const ctx = adapterContext(userId, scope);
  const providers = listTagProviders();

  const batches = await Promise.all(
    providers.map((p) => p.searchByTagLabel(ctx, normalized, scope, capped))
  );

  const merged: TagDescriptor[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const descriptor of batch) {
      if (seen.has(descriptor.tagId)) continue;
      seen.add(descriptor.tagId);
      merged.push(descriptor);
      if (merged.length >= capped) break;
    }
    if (merged.length >= capped) break;
  }

  return {
    version: TAG_INDEX_CONTRACT_VERSION,
    tagLabel: normalized,
    descriptors: merged,
    modulesQueried: providers.map((p) => p.moduleId),
    truncated: merged.length >= capped,
  };
}

export async function lookupTagsByEntity(
  userId: string,
  ref: EntityRef
): Promise<TagIndexEntityResult> {
  const provider = getTagProviderForEntity(ref.moduleId, ref.entityType);
  const ctx = adapterContext(userId);
  const descriptors = provider ? await provider.getTagsForEntity(ctx, ref) : [];

  return {
    version: TAG_INDEX_CONTRACT_VERSION,
    entity: ref,
    descriptors,
  };
}

export async function lookupTagsByModule(
  userId: string,
  moduleId: string,
  scope: TagIndexQueryScope,
  limit = MAX_TAG_SEARCH_RESULTS
): Promise<TagIndexModuleResult> {
  const provider = getTagProviderByModule(moduleId);
  if (!provider) {
    return {
      version: TAG_INDEX_CONTRACT_VERSION,
      moduleId,
      descriptors: [],
      entitiesScanned: 0,
      truncated: false,
    };
  }

  const ctx = adapterContext(userId, scope);
  const capped = Math.min(Math.max(limit, 1), MAX_TAG_SEARCH_RESULTS);

  // Module facet: union tags from recent searchable hits via empty-ish scan —
  // use provider search with wildcard via listing known entity types' tags from search API.
  // For module rollup, aggregate unique descriptors from a bounded entity scan per entity type.
  const { scanModuleTags } = await import('./tagModuleScan.js');
  const scan = await scanModuleTags(provider, ctx, scope, capped);

  return {
    version: TAG_INDEX_CONTRACT_VERSION,
    moduleId,
    descriptors: scan.descriptors,
    entitiesScanned: scan.entitiesScanned,
    truncated: scan.truncated,
  };
}
