import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/**
 * Chat-owned cleanup before dashboard tab hard delete (K2-04).
 * Dashboard service invokes this; Chat module owns conversation lifecycle.
 */
export async function prepareDashboardTabDeletion(params: {
  actorUserId: string;
  dashboardId: string;
}): Promise<void> {
  const { dashboardId } = params;

  const conversations = await prisma.conversation.findMany({
    where: { dashboardId },
    select: { id: true },
  });

  if (conversations.length === 0) {
    return;
  }

  const conversationIds = conversations.map((c) => c.id);

  await prisma.conversationParticipant.deleteMany({
    where: { conversationId: { in: conversationIds } },
  });

  await prisma.conversation.deleteMany({
    where: { id: { in: conversationIds } },
  });

  await logger.info('Chat module cleaned up conversations for dashboard tab deletion', {
    operation: 'chat_dashboard_tab_cleanup',
    context: { dashboardId, conversationCount: conversationIds.length },
  });
}
