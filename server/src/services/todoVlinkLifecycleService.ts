import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

const TODO_VLINK_ENTITY_TYPES: VLinkEntityType[] = [
  VLinkEntityType.TODO,
  VLinkEntityType.TASK,
];

/**
 * Soft-unlink all V_Link entity rows pointing at a todo task.
 * Called before permanent delete (Todo Wave 2 Phase 2). Soft trash does not unlink.
 */
export async function unlinkTodoTaskFromAllVLinks(params: {
  actorUserId: string;
  taskId: string;
}): Promise<number> {
  const { actorUserId, taskId } = params;

  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType: { in: TODO_VLINK_ENTITY_TYPES },
      entityId: taskId,
      unlinkedAt: null,
    },
    select: {
      id: true,
      vlinkId: true,
      entityType: true,
      entityId: true,
      vlink: {
        select: { dashboardId: true, businessId: true, householdId: true },
      },
    },
  });

  if (links.length === 0) {
    return 0;
  }

  await prisma.vLinkEntity.updateMany({
    where: { id: { in: links.map((link) => link.id) } },
    data: { unlinkedAt: new Date() },
  });

  for (const link of links) {
    try {
      emitVLinkEntityUnlinkedEvent({
        actorUserId,
        vlinkId: link.vlinkId,
        entityType: link.entityType,
        entityId: link.entityId,
        vlink: link.vlink,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Failed to emit V_Link entity unlinked event on todo delete', {
        operation: 'todo_vlink_unlink_on_delete',
        taskId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}
