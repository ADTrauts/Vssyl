import { prisma } from '../../lib/prisma.js';
import { resolvePlaceListingForVLink } from '../../services/place/placeVlinkAccessService.js';
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

const MODULE_ID = 'place';

export const placeTagProvider: ContextGraphTagProvider = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['place_list'],

  async getTagsForEntity(ctx: AdapterContext, ref: EntityRef): Promise<TagDescriptor[]> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'place_list') return [];

    const access = await resolvePlaceListingForVLink(ctx.userId, ref.entityId);
    if (!access.allowed) return [];

    const listing = await prisma.businessPlaceListing.findUnique({
      where: { id: ref.entityId },
      select: { tags: true, trashedAt: true },
    });
    if (!listing || listing.trashedAt) return [];

    return parseTagStrings(listing.tags).map((label) => tagDescriptorFromEntity(ref, label));
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
    const listings = await prisma.businessPlaceListing.findMany({
      where: {
        trashedAt: null,
        tags: { has: normalized },
        ...(scope.businessId ? { businessId: scope.businessId } : {}),
      },
      select: { id: true, tags: true },
      take: capped * 2,
      orderBy: { updatedAt: 'desc' },
    });

    const results: TagDescriptor[] = [];
    for (const listing of listings) {
      if (results.length >= capped) break;
      const ref: EntityRef = { moduleId: MODULE_ID, entityType: 'place_list', entityId: listing.id };
      const access = await resolvePlaceListingForVLink(ctx.userId, listing.id);
      if (!access.allowed) continue;
      const labels = parseTagStrings(listing.tags).filter((l) => l === normalized);
      for (const label of labels) {
        results.push(tagDescriptorFromEntity(ref, label));
        if (results.length >= capped) break;
      }
    }
    return results;
  },
};
