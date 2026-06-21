import { prisma } from '../../lib/prisma.js';
import { resolveNoteForVLink } from '../../services/notesVlinkAccessService.js';
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

const MODULE_ID = 'notes';

function scopeWhere(scope: TagIndexQueryScope) {
  if (scope.businessId) return { businessId: scope.businessId };
  if (scope.dashboardId) return { dashboardId: scope.dashboardId };
  return {};
}

export const notesTagProvider: ContextGraphTagProvider = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['note'],

  async getTagsForEntity(ctx: AdapterContext, ref: EntityRef): Promise<TagDescriptor[]> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'note') return [];

    const access = await resolveNoteForVLink(ctx.userId, ref.entityId);
    if (!access.allowed) return [];

    const note = await prisma.note.findUnique({
      where: { id: ref.entityId },
      select: { tags: true, trashedAt: true },
    });
    if (!note || note.trashedAt) return [];

    return parseTagStrings(note.tags).map((label) => tagDescriptorFromEntity(ref, label));
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
    const notes = await prisma.note.findMany({
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
    for (const note of notes) {
      if (results.length >= capped) break;
      const ref: EntityRef = { moduleId: MODULE_ID, entityType: 'note', entityId: note.id };
      const access = await resolveNoteForVLink(ctx.userId, note.id);
      if (!access.allowed) continue;
      const labels = parseTagStrings(note.tags).filter((l) => l === normalized);
      for (const label of labels) {
        results.push(tagDescriptorFromEntity(ref, label));
        if (results.length >= capped) break;
      }
    }
    return results;
  },
};
