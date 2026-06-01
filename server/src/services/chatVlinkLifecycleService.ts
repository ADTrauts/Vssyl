import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

/**
 * Soft-unlink all V_Link entity rows pointing at a chat conversation.
 * Called on permanent delete so links do not dangle (Chat Wave 1 Phase 3).
 */
export async function unlinkChatConversationFromAllVLinks(params: {
  actorUserId: string;
  conversationId: string;
}): Promise<number> {
  const { actorUserId, conversationId } = params;

  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType: VLinkEntityType.CHAT_CONVERSATION,
      entityId: conversationId,
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

  if (links.length === 0) return 0;

  await prisma.vLinkEntity.updateMany({
    where: { id: { in: links.map((l) => l.id) } },
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
      await logger.warn('Failed to emit V_Link entity unlinked event on chat delete', {
        operation: 'chat_vlink_unlink_on_delete',
        conversationId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}
