import { VLinkEntityType, VLinkScope } from '@prisma/client';
import {
  assertVLinkAccess,
  getVLinkMembership,
} from '../../services/vlinkPermissionService.js';
import {
  findVLinkByIdOrCode,
  getVLinkDetail,
  listVLinkEntities,
  VLinkServiceError,
} from '../../services/vlinkService.js';
import { resolveEntityAccess } from '../../services/vlinkEntityResolverService.js';
import type {
  AdapterContext,
  ContextGraphAdapter,
  ContextGraphNode,
  EntityRef,
  NeighborEdge,
  NodePermissions,
  VLinkContainerRef,
} from '../contextGraphTypes.js';
import { permissionsFromAccess } from '../permissionResolver.js';

const MODULE_ID = 'vlink';

const VLINK_ENTITY_TYPE_MAP: Partial<Record<VLinkEntityType, EntityRef>> = {
  [VLinkEntityType.FILE]: { moduleId: 'drive', entityType: 'file', entityId: '' },
  [VLinkEntityType.FOLDER]: { moduleId: 'drive', entityType: 'folder', entityId: '' },
  [VLinkEntityType.CALENDAR_EVENT]: { moduleId: 'calendar', entityType: 'event', entityId: '' },
  [VLinkEntityType.TASK]: { moduleId: 'todo', entityType: 'task', entityId: '' },
  [VLinkEntityType.TODO]: { moduleId: 'todo', entityType: 'task', entityId: '' },
  [VLinkEntityType.NOTE]: { moduleId: 'notes', entityType: 'note', entityId: '' },
  [VLinkEntityType.CHAT_CONVERSATION]: { moduleId: 'chat', entityType: 'conversation', entityId: '' },
  [VLinkEntityType.PLACE_LISTING]: { moduleId: 'place', entityType: 'place_list', entityId: '' },
  [VLinkEntityType.PLACE_MEETING]: { moduleId: 'place', entityType: 'place', entityId: '' },
};

function vlinkEntityToRef(entityType: VLinkEntityType, entityId: string): EntityRef | null {
  const template = VLINK_ENTITY_TYPE_MAP[entityType];
  if (!template) return null;
  return { moduleId: template.moduleId, entityType: template.entityType, entityId };
}

export async function resolveVLinkContainer(
  ctx: AdapterContext,
  vlinkIdOrCode: string
): Promise<{ container: VLinkContainerRef; node: ContextGraphNode; tenantScope: {
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  scope: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
} } | null> {
  const vlink = await findVLinkByIdOrCode(vlinkIdOrCode);
  if (!vlink) return null;

  const access = await assertVLinkAccess({ vlink, userId: ctx.userId, action: 'read' });
  if (!access.allowed) return null;

  const detail = await getVLinkDetail(vlink.id, ctx.userId);
  const membership = await getVLinkMembership(vlink.id, ctx.userId);

  const container: VLinkContainerRef = {
    kind: 'container',
    containerType: 'vlink',
    vlinkId: vlink.id,
    publicCode: vlink.publicCode,
  };

  const node: ContextGraphNode = {
    moduleId: MODULE_ID,
    entityType: 'container',
    entityId: vlink.id,
    title: detail.title,
    summary: detail.description ?? `V_Link ${vlink.publicCode}`,
    permissions: permissionsFromAccess('full'),
    metadata: {
      publicCode: vlink.publicCode,
      scope: detail.scope,
      membershipRole: membership?.role ?? null,
      attachmentCount:
        (detail.entityCounts?.restricted ?? 0) +
        Object.values(detail.entityCounts?.accessible ?? {}).reduce((a, b) => a + b, 0),
    },
  };

  const scope =
    detail.scope === VLinkScope.BUSINESS
      ? 'BUSINESS'
      : detail.scope === VLinkScope.HOUSEHOLD
        ? 'HOUSEHOLD'
        : 'PERSONAL';

  return {
    container,
    node,
    tenantScope: {
      dashboardId: detail.dashboardId,
      businessId: detail.businessId,
      householdId: detail.householdId,
      scope,
    },
  };
}

export async function listVLinkAttachmentEdges(
  ctx: AdapterContext,
  vlinkId: string
): Promise<NeighborEdge[]> {
  const entities = await listVLinkEntities(vlinkId, ctx.userId);
  const containerRef: VLinkContainerRef = {
    kind: 'container',
    containerType: 'vlink',
    vlinkId,
  };

  const edges: NeighborEdge[] = [];
  for (const entity of entities) {
    const targetRef = vlinkEntityToRef(entity.entityType, entity.entityId);
    if (!targetRef) continue;

    edges.push({
      edgeId: entity.id,
      edgeType: 'vlink.attachment',
      relationshipClass: 'association',
      source: containerRef,
      target: targetRef,
      direction: 'outbound',
      grantsContentAccess: false,
      metadata: {
        vlinkAccess: entity.access,
        moduleId: entity.moduleId,
      },
    });
  }
  return edges;
}

/** Hydrate attachment via vlink resolver fallback (P0 modules use registry in bundleResolver). */
export async function hydrateAttachmentNode(
  ctx: AdapterContext,
  entityType: VLinkEntityType,
  entityId: string
): Promise<ContextGraphNode | null> {
  const ref = vlinkEntityToRef(entityType, entityId);

  const accessResult = await resolveEntityAccess(ctx.userId, entityType, entityId);
  if (accessResult.access === 'restricted' && !accessResult.title) {
    return null;
  }

  return {
    moduleId: ref?.moduleId ?? 'unknown',
    entityType: ref?.entityType ?? entityType.toLowerCase(),
    entityId,
    title: accessResult.title ?? 'Linked item',
    summary: accessResult.access === 'full' ? accessResult.title : 'Restricted item',
    permissions: permissionsFromAccess(accessResult.access),
    display: accessResult.url ? { url: accessResult.url } : undefined,
  };
}

export const vlinkContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['container'],

  async getPermissions(_ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    if (ref.entityType !== 'container') {
      return permissionsFromAccess('denied', 'unsupported_entity_type');
    }
    return permissionsFromAccess('full');
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID || ref.entityType !== 'container') return null;
    const resolved = await resolveVLinkContainer(ctx, ref.entityId);
    return resolved?.node ?? null;
  },

  async getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]> {
    if (ref.entityType !== 'container') return [];
    const vlink = await findVLinkByIdOrCode(ref.entityId);
    if (!vlink) return [];
    const access = await assertVLinkAccess({ vlink, userId: ctx.userId, action: 'read' });
    if (!access.allowed) return [];
    return listVLinkAttachmentEdges(ctx, vlink.id);
  },

  async getSummary(ctx: AdapterContext, ref: EntityRef): Promise<string | null> {
    const node = await this.getNode(ctx, ref);
    return node?.summary ?? null;
  },
};

export class ContextGraphNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextGraphNotFoundError';
  }
}

export class ContextGraphForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextGraphForbiddenError';
  }
}

export function mapVLinkServiceError(error: unknown): never {
  if (error instanceof VLinkServiceError) {
    if (error.statusCode === 404) {
      throw new ContextGraphNotFoundError(error.message);
    }
    if (error.statusCode === 403) {
      throw new ContextGraphForbiddenError(error.message);
    }
  }
  throw error;
}
