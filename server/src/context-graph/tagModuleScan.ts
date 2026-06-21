/**
 * Bounded module tag scan for lookup-by-module — read-only; PE via getTagsForEntity.
 */

import type { AdapterContext } from './contextGraphTypes.js';
import type { ContextGraphTagProvider } from './tagProviderTypes.js';
import type { TagDescriptor, TagIndexQueryScope } from './tagDescriptorTypes.js';
import { prisma } from '../lib/prisma.js';

const SCAN_ENTITY_CAP = 30;

export async function scanModuleTags(
  provider: ContextGraphTagProvider,
  ctx: AdapterContext,
  scope: TagIndexQueryScope,
  resultLimit: number
): Promise<{ descriptors: TagDescriptor[]; entitiesScanned: number; truncated: boolean }> {
  const entityIds = await listRecentEntityIds(provider.moduleId, provider.supportedEntityTypes, scope);
  const cappedIds = entityIds.slice(0, SCAN_ENTITY_CAP);

  const descriptors: TagDescriptor[] = [];
  const seen = new Set<string>();

  for (const entry of cappedIds) {
    const batch = await provider.getTagsForEntity(ctx, entry);
    for (const descriptor of batch) {
      if (seen.has(descriptor.tagId)) continue;
      seen.add(descriptor.tagId);
      descriptors.push(descriptor);
      if (descriptors.length >= resultLimit) {
        return {
          descriptors,
          entitiesScanned: cappedIds.length,
          truncated: true,
        };
      }
    }
  }

  return {
    descriptors,
    entitiesScanned: cappedIds.length,
    truncated: entityIds.length > SCAN_ENTITY_CAP || descriptors.length >= resultLimit,
  };
}

async function listRecentEntityIds(
  moduleId: string,
  entityTypes: readonly string[],
  scope: TagIndexQueryScope
): Promise<Array<{ moduleId: string; entityType: string; entityId: string }>> {
  const results: Array<{ moduleId: string; entityType: string; entityId: string }> = [];

  if (moduleId === 'todo' && entityTypes.includes('task')) {
    const rows = await prisma.task.findMany({
      where: {
        trashedAt: null,
        tags: { isEmpty: false },
        ...(scope.businessId
          ? { businessId: scope.businessId }
          : scope.householdId
            ? { householdId: scope.householdId }
            : scope.dashboardId
              ? { dashboardId: scope.dashboardId }
              : {}),
      },
      select: { id: true },
      take: SCAN_ENTITY_CAP,
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      results.push({ moduleId: 'todo', entityType: 'task', entityId: row.id });
    }
  }

  if (moduleId === 'notes' && entityTypes.includes('note')) {
    const rows = await prisma.note.findMany({
      where: {
        trashedAt: null,
        tags: { isEmpty: false },
        ...(scope.businessId
          ? { businessId: scope.businessId }
          : scope.dashboardId
            ? { dashboardId: scope.dashboardId }
            : {}),
      },
      select: { id: true },
      take: SCAN_ENTITY_CAP,
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      results.push({ moduleId: 'notes', entityType: 'note', entityId: row.id });
    }
  }

  if (moduleId === 'place' && entityTypes.includes('place_list')) {
    const rows = await prisma.businessPlaceListing.findMany({
      where: {
        trashedAt: null,
        tags: { isEmpty: false },
        ...(scope.businessId ? { businessId: scope.businessId } : {}),
      },
      select: { id: true },
      take: SCAN_ENTITY_CAP,
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      results.push({ moduleId: 'place', entityType: 'place_list', entityId: row.id });
    }
  }

  return results;
}
