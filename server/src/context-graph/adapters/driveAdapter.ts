import { VLinkEntityType } from '@prisma/client';
import {
  resolveDriveFileForVLink,
  resolveDriveFolderForVLink,
} from '../../services/driveVlinkAccessService.js';
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

const MODULE_ID = 'drive';

function toVLinkEntityType(entityType: string): VLinkEntityType | null {
  if (entityType === 'file') return VLinkEntityType.FILE;
  if (entityType === 'folder') return VLinkEntityType.FOLDER;
  return null;
}

export const driveContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['file', 'folder'],

  async getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    const node = await this.getNode(ctx, ref);
    if (!node) {
      return permissionsFromAccess('denied', 'not_found');
    }
    return node.permissions;
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID) return null;

    if (ref.entityType === 'file') {
      const result = await resolveDriveFileForVLink(ctx.userId, ref.entityId);
      if (result.state === 'deleted') {
        return null;
      }
      const access = result.allowed ? 'full' : 'restricted';
      return {
        moduleId: MODULE_ID,
        entityType: 'file',
        entityId: ref.entityId,
        title: result.title ?? 'File',
        summary: result.allowed ? `Drive file: ${result.title ?? ref.entityId}` : 'Restricted file',
        permissions: permissionsFromAccess(access),
        display: result.url ? { url: result.url } : undefined,
        metadata: { state: result.state },
      };
    }

    if (ref.entityType === 'folder') {
      const result = await resolveDriveFolderForVLink(ctx.userId, ref.entityId);
      if (result.state === 'deleted') {
        return null;
      }
      const access = result.allowed ? 'full' : 'restricted';
      return {
        moduleId: MODULE_ID,
        entityType: 'folder',
        entityId: ref.entityId,
        title: result.title ?? 'Folder',
        summary: result.allowed ? `Drive folder: ${result.title ?? ref.entityId}` : 'Restricted folder',
        permissions: permissionsFromAccess(access),
        display: result.url ? { url: result.url } : undefined,
        metadata: { state: result.state },
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
