import { VLinkEntityType } from '@prisma/client';
import { resolveTodoTaskForVLink } from '../../services/todoVlinkAccessService.js';
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

const MODULE_ID = 'todo';

export const todoContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['task'],

  async getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    const node = await this.getNode(ctx, ref);
    if (!node) return permissionsFromAccess('denied', 'not_found');
    return node.permissions;
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'task') return null;

    const result = await resolveTodoTaskForVLink(ctx.userId, ref.entityId);
    if (result.state === 'deleted') return null;

    const access = result.allowed ? 'full' : 'restricted';
    const baseMetadata = { state: result.state };
    const metadata =
      access === 'full'
        ? await enrichNodeMetadataWithTags(
            ctx,
            { moduleId: MODULE_ID, entityType: 'task', entityId: ref.entityId },
            baseMetadata
          )
        : baseMetadata;

    return {
      moduleId: MODULE_ID,
      entityType: 'task',
      entityId: ref.entityId,
      title: result.title ?? 'Task',
      summary: result.allowed ? `Task: ${result.title ?? ref.entityId}` : 'Restricted task',
      permissions: permissionsFromAccess(access),
      display: result.url ? { url: result.url } : undefined,
      metadata,
    };
  },

  async getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]> {
    if (ref.entityType !== 'task') return [];

    const vlinks = await getVLinksForEntity(ctx.userId, VLinkEntityType.TASK, ref.entityId);
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
