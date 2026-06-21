import { VLinkEntityType } from '@prisma/client';
import { resolveCalendarEventForVLink } from '../../services/calendarVlinkAccessService.js';
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

const MODULE_ID = 'calendar';

export const calendarContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['event'],

  async getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    const node = await this.getNode(ctx, ref);
    if (!node) return permissionsFromAccess('denied', 'not_found');
    return node.permissions;
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'event') return null;

    const result = await resolveCalendarEventForVLink(ctx.userId, ref.entityId);
    if (result.state === 'deleted') return null;

    const access = result.allowed ? 'full' : 'restricted';
    return {
      moduleId: MODULE_ID,
      entityType: 'event',
      entityId: ref.entityId,
      title: result.title ?? 'Event',
      summary: result.allowed ? `Calendar event: ${result.title ?? ref.entityId}` : 'Restricted event',
      permissions: permissionsFromAccess(access),
      display: result.url ? { url: result.url } : undefined,
      metadata: { state: result.state },
    };
  },

  async getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]> {
    if (ref.entityType !== 'event') return [];

    const vlinks = await getVLinksForEntity(ctx.userId, VLinkEntityType.CALENDAR_EVENT, ref.entityId);
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
