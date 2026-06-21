import { prisma } from '../../lib/prisma.js';
import { resolveNoteForVLink } from '../../services/notesVlinkAccessService.js';
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
import { notebookLinkSourceToRef, notebookLinkTargetToRef } from './notebookLinkRef.js';

const MODULE_ID = 'notebook';

async function resolveNotebookFolderForRead(
  userId: string,
  folderId: string
): Promise<{ allowed: boolean; title?: string; state: 'active' | 'deleted' }> {
  const folder = await prisma.noteFolder.findFirst({
    where: {
      id: folderId,
      createdById: userId,
    },
    select: { id: true, name: true },
  });
  if (!folder) {
    return { allowed: false, state: 'deleted' };
  }
  return { allowed: true, title: folder.name, state: 'active' };
}

export const notebookContextGraphAdapter: ContextGraphAdapter = {
  moduleId: MODULE_ID,
  supportedEntityTypes: ['notebook', 'notebook_page'],

  async getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions> {
    const node = await this.getNode(ctx, ref);
    if (!node) return permissionsFromAccess('denied', 'not_found');
    return node.permissions;
  },

  async getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null> {
    if (ref.moduleId !== MODULE_ID) return null;

    if (ref.entityType === 'notebook_page') {
      const result = await resolveNoteForVLink(ctx.userId, ref.entityId);
      if (result.state === 'deleted') return null;
      const access = result.allowed ? 'full' : 'restricted';
      return {
        moduleId: MODULE_ID,
        entityType: 'notebook_page',
        entityId: ref.entityId,
        title: result.title ?? 'Notebook page',
        summary: result.allowed
          ? `Notebook page: ${result.title ?? ref.entityId}`
          : 'Restricted notebook page',
        permissions: permissionsFromAccess(access),
        display: result.url ? { url: result.url } : undefined,
        metadata: { state: result.state },
      };
    }

    if (ref.entityType === 'notebook') {
      const result = await resolveNotebookFolderForRead(ctx.userId, ref.entityId);
      if (result.state === 'deleted') return null;
      const access = result.allowed ? 'full' : 'restricted';
      return {
        moduleId: MODULE_ID,
        entityType: 'notebook',
        entityId: ref.entityId,
        title: result.title ?? 'Notebook',
        summary: result.allowed ? `Notebook folder: ${result.title ?? ref.entityId}` : 'Restricted notebook',
        permissions: permissionsFromAccess(access),
        metadata: { kind: 'note_folder' },
      };
    }

    return null;
  },

  async getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]> {
    if (ref.entityType === 'notebook_page') {
      const edges: NeighborEdge[] = [];
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
            source: { moduleId: MODULE_ID, entityType: 'notebook_page', entityId: ref.entityId },
            target: targetRef,
            direction: 'outbound',
            grantsContentAccess: false,
            metadata: { relationshipType: link.relationshipType },
          });
        }
      } catch {
        return [];
      }
      return edges;
    }

    if (ref.entityType === 'notebook') {
      const notes = await prisma.note.findMany({
        where: {
          folderId: ref.entityId,
          trashedAt: null,
          createdById: ctx.userId,
        },
        select: { id: true },
        take: 25,
      });
      return notes.map((note) => ({
        edgeId: `folder-page-${note.id}`,
        edgeType: 'notebook.containment',
        relationshipClass: 'containment',
        source: { moduleId: MODULE_ID, entityType: 'notebook', entityId: ref.entityId },
        target: { moduleId: MODULE_ID, entityType: 'notebook_page', entityId: note.id },
        direction: 'outbound',
        grantsContentAccess: false,
      }));
    }

    return [];
  },

  async getSummary(ctx: AdapterContext, ref: EntityRef): Promise<string | null> {
    const node = await this.getNode(ctx, ref);
    return node?.summary ?? null;
  },
};
