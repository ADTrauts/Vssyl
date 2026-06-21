import { VLinkEntityType } from '@prisma/client';
import { resolveNoteForVLink } from '../../services/notesVlinkAccessService.js';
import { getVLinksForEntity } from '../../services/vlinkService.js';
import { listPageLinks } from '../../services/notebook/notebookLinkService.js';
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
import { notebookLinkTargetToRef } from './notebookLinkRef.js';

const MODULE_ID = 'notes';

export const notesContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['note'],

  async getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    const node = await this.getNode(ctx, ref);
    if (!node) return permissionsFromAccess('denied', 'not_found');
    return node.permissions;
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'note') return null;

    const result = await resolveNoteForVLink(ctx.userId, ref.entityId);
    if (result.state === 'deleted') return null;

    const access = result.allowed ? 'full' : 'restricted';
    const baseMetadata = { state: result.state };
    const metadata =
      access === 'full'
        ? await enrichNodeMetadataWithTags(
            ctx,
            { moduleId: MODULE_ID, entityType: 'note', entityId: ref.entityId },
            baseMetadata
          )
        : baseMetadata;

    return {
      moduleId: MODULE_ID,
      entityType: 'note',
      entityId: ref.entityId,
      title: result.title ?? 'Note',
      summary: result.allowed ? `Note: ${result.title ?? ref.entityId}` : 'Restricted note',
      permissions: permissionsFromAccess(access),
      display: result.url ? { url: result.url } : undefined,
      metadata,
    };
  },

  async getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]> {
    if (ref.entityType !== 'note') return [];

    const edges: NeighborEdge[] = [];

    const vlinks = await getVLinksForEntity(ctx.userId, VLinkEntityType.NOTE, ref.entityId);
    for (const v of vlinks) {
      edges.push({
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
      });
    }

    try {
      const { links } = await listPageLinks({
        userId: ctx.userId,
        pageId: ref.entityId,
      });
      for (const link of links) {
        const targetRef = notebookLinkTargetToRef(link.targetType, link.targetId);
        if (!targetRef) continue;
        edges.push({
          edgeId: link.id,
          edgeType: 'notebook.link',
          relationshipClass: link.relationshipType.toLowerCase(),
          source: { moduleId: MODULE_ID, entityType: 'note', entityId: ref.entityId },
          target: targetRef,
          direction: 'outbound',
          grantsContentAccess: false,
          metadata: { relationshipType: link.relationshipType },
        });
      }
    } catch {
      // Page not readable — no notebook link edges
    }

    return edges;
  },

  async getSummary(ctx: AdapterContext, ref: EntityRef): Promise<string | null> {
    const node = await this.getNode(ctx, ref);
    return node?.summary ?? null;
  },
};
