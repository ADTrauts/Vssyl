import { prisma } from '../lib/prisma';
import type { CreateConversationInput } from './chat/chatTypes';
import { conversationParticipantInclude } from './chat/chatIncludes';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateChatPolicyDual } from '../auth/chatPolicyDual';
import {
  validateConversationDashboardAccess,
} from './chatPermissionService';
import { recordConversationCreated } from './chatActivityService';
import { recordChatConversationCreatedDomainEvent } from './chatDomainEventService';
import { ChatServiceError } from './chat/chatErrors';
import {
  restoreConversation as restoreConversationFromTrash,
  softTrashConversation,
  type ChatTrashMutationInput,
} from './chatTrashService';

export async function createConversation(input: CreateConversationInput) {
  const { userId, name, type, participantIds, dashboardId } = input;

  const allParticipantIds = [...new Set([userId, ...participantIds])];

  await validateConversationDashboardAccess(userId, dashboardId, allParticipantIds);

  const createPolicyDual = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_CONVERSATION_CREATE,
    resourceType: 'conversation',
    resourceId: userId,
    scope: dashboardId ? { dashboardId } : undefined,
  });
  if (createPolicyDual.blocked) {
    throw new ChatServiceError('Access denied', 'forbidden', 403);
  }

  if (type === 'DIRECT' && participantIds.length === 1) {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: { in: allParticipantIds },
            isActive: true,
          },
        },
      },
      include: conversationParticipantInclude,
    });

    if (existingConversation) {
      return { conversation: existingConversation, created: false as const };
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      name,
      type,
      dashboardId,
      participants: {
        create: allParticipantIds.map((participantId, index) => ({
          userId: participantId,
          role: index === 0 ? 'OWNER' : 'MEMBER',
        })),
      },
    },
    include: conversationParticipantInclude,
  });

  await recordConversationCreated({
    actorUserId: userId,
    conversationId: conversation.id,
    dashboardId: dashboardId ?? null,
    type,
  });

  recordChatConversationCreatedDomainEvent({
    actorUserId: userId,
    conversationId: conversation.id,
    conversationType: type,
    dashboardId: dashboardId ?? null,
  });

  return { conversation, created: true as const };
}

/** Global Trash entry point for conversation soft-delete (Pattern 5). */
export async function trashConversation(input: ChatTrashMutationInput) {
  return softTrashConversation(input);
}

/** Global Trash entry point for conversation restore. */
export async function restoreConversationFromTrashService(input: ChatTrashMutationInput) {
  return restoreConversationFromTrash(input);
}
