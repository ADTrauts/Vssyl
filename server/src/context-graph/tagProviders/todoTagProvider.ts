import { prisma } from '../../lib/prisma.js';
import { resolveTodoTaskForVLink } from '../../services/todoVlinkAccessService.js';
import type { AdapterContext, EntityRef } from '../contextGraphTypes.js';
import {
  MAX_TAG_SEARCH_RESULTS,
  normalizeTagLabel,
  parseTagStrings,
  tagDescriptorFromEntity,
  type TagDescriptor,
  type TagIndexQueryScope,
} from '../tagDescriptorTypes.js';
import type { ContextGraphTagProvider } from '../tagProviderTypes.js';

const MODULE_ID = 'todo';

function scopeWhere(scope: TagIndexQueryScope) {
  if (scope.businessId) return { businessId: scope.businessId };
  if (scope.householdId) return { householdId: scope.householdId };
  if (scope.dashboardId) return { dashboardId: scope.dashboardId };
  return {};
}

export const todoTagProvider: ContextGraphTagProvider = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['task'],

  async getTagsForEntity(ctx: AdapterContext, ref: EntityRef): Promise<TagDescriptor[]> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'task') return [];

    const access = await resolveTodoTaskForVLink(ctx.userId, ref.entityId);
    if (!access.allowed) return [];

    const task = await prisma.task.findUnique({
      where: { id: ref.entityId },
      select: { tags: true, trashedAt: true },
    });
    if (!task || task.trashedAt) return [];

    return parseTagStrings(task.tags).map((label) => tagDescriptorFromEntity(ref, label));
  },

  async searchByTagLabel(
    ctx: AdapterContext,
    tagLabel: string,
    scope: TagIndexQueryScope,
    limit: number
  ): Promise<TagDescriptor[]> {
    const normalized = normalizeTagLabel(tagLabel);
    if (!normalized) return [];

    const capped = Math.min(limit, MAX_TAG_SEARCH_RESULTS);
    const tasks = await prisma.task.findMany({
      where: {
        trashedAt: null,
        tags: { has: normalized },
        ...scopeWhere(scope),
      },
      select: { id: true, tags: true },
      take: capped * 2,
      orderBy: { updatedAt: 'desc' },
    });

    const results: TagDescriptor[] = [];
    for (const task of tasks) {
      if (results.length >= capped) break;
      const ref: EntityRef = { moduleId: MODULE_ID, entityType: 'task', entityId: task.id };
      const access = await resolveTodoTaskForVLink(ctx.userId, task.id);
      if (!access.allowed) continue;
      const labels = parseTagStrings(task.tags).filter((l) => l === normalized);
      for (const label of labels) {
        results.push(tagDescriptorFromEntity(ref, label));
        if (results.length >= capped) break;
      }
    }
    return results;
  },
};
