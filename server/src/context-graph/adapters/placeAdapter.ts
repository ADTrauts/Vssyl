import { VLinkEntityType } from '@prisma/client';
import {
  resolvePlaceListingForVLink,
  resolvePlaceMeetingForVLink,
} from '../../services/place/placeVlinkAccessService.js';
import { getVLinksForEntity } from '../../services/vlinkService.js';
import type {
  AdapterContext,
  ContextGraphAdapter,
  ContextGraphNode,
  EntityRef,
  NeighborEdge,
  NodePermissions,
} from '../contextGraphTypes.js';
import { permissionsFromAccess } from '../permissionResolver.js';
import { enrichNodeMetadataWithTags } from '../tagMetadataEnrichment.js';

const MODULE_ID = 'place';

function toVLinkEntityType(entityType: string): VLinkEntityType | null {
  if (entityType === 'place_list') return VLinkEntityType.PLACE_LISTING;
  if (entityType === 'place') return VLinkEntityType.PLACE_MEETING;
  return null;
}

export const placeContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['place', 'place_list'],

  async getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    const node = await this.getNode(ctx, ref);
    if (!node) return permissionsFromAccess('denied', 'not_found');
    return node.permissions;
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID) return null;

    if (ref.entityType === 'place_list') {
      const result = await resolvePlaceListingForVLink(ctx.userId, ref.entityId);
      if (result.state === 'deleted') return null;
      const access = result.allowed ? 'full' : 'restricted';
      const entityRef = { moduleId: MODULE_ID, entityType: 'place_list' as const, entityId: ref.entityId };
      const baseMetadata = { state: result.state };
      const metadata =
        access === 'full'
          ? await enrichNodeMetadataWithTags(ctx, entityRef, baseMetadata)
          : baseMetadata;
      return {
        moduleId: MODULE_ID,
        entityType: 'place_list',
        entityId: ref.entityId,
        title: result.title ?? 'Place listing',
        summary: result.allowed
          ? `Place listing: ${result.title ?? ref.entityId}`
          : 'Restricted place listing',
        permissions: permissionsFromAccess(access),
        display: result.url ? { url: result.url } : undefined,
        metadata,
      };
    }

    if (ref.entityType === 'place') {
      const result = await resolvePlaceMeetingForVLink(ctx.userId, ref.entityId);
      if (result.state === 'deleted') return null;
      const access = result.allowed ? 'full' : 'restricted';
      return {
        moduleId: MODULE_ID,
        entityType: 'place',
        entityId: ref.entityId,
        title: result.title ?? 'Place meeting',
        summary: result.allowed
          ? `Place meeting: ${result.title ?? ref.entityId}`
          : 'Restricted place meeting',
        permissions: permissionsFromAccess(access),
        display: result.url ? { url: result.url } : undefined,
        metadata: { state: result.state, kind: 'meeting' },
      };
    }

    return null;
  },

  async getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]> {
    const vlinkType = toVLinkEntityType(ref.entityType);
    if (!vlinkType) return [];

    const vlinks = await getVLinksForEntity(ctx.userId, vlinkType, ref.entityId);
    return vlinks.map((v) => ({
      edgeId: v.entityLinkId,
      edgeType: 'vlink.attachment',
      relationshipClass: 'association',
      source: {
        kind: 'container',
        containerType: 'vlink',
        vlinkId: v.id,
        publicCode: v.publicCode,
      },
      target: ref,
      direction: 'inbound',
      grantsContentAccess: false,
      metadata: { vlinkTitle: v.title },
    }));
  },

  async getSummary(ctx: AdapterContext, ref: EntityRef): Promise<string | null> {
    const node = await this.getNode(ctx, ref);
    return node?.summary ?? null;
  },
};
