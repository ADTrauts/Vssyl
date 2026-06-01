import { prisma } from '../lib/prisma';
import { evaluateChatPolicyDual } from '../auth/chatPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';

export type ChatVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface ChatVlinkAccessResult {
  allowed: boolean;
  state: ChatVlinkEntityState;
  title?: string;
  url?: string;
}

async function userIsActiveConversationParticipant(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
      isActive: true,
    },
    select: { id: true },
  });
  return participant != null;
}

async function passesChatConversationReadPolicy(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const policy = await evaluateChatPolicyDual({
    userId,
    action: POLICY_ACTIONS.CHAT_CONVERSATION_READ,
    resourceType: 'conversation',
    resourceId: conversationId,
  });
  return !policy.blocked;
}

/**
 * Canonical V_Link access for chat conversations (Wave 1 Phase 4).
 * Content access requires active conversation membership — V_Link membership alone is insufficient.
 */
export async function resolveChatConversationForVLink(
  userId: string,
  conversationId: string
): Promise<ChatVlinkAccessResult> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, name: true, trashedAt: true },
  });

  if (!conversation) {
    return { allowed: false, state: 'deleted' };
  }

  if (conversation.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: conversation.name ?? 'Conversation',
    };
  }

  if (!(await userIsActiveConversationParticipant(userId, conversationId))) {
    return {
      allowed: false,
      state: 'active',
      title: conversation.name ?? 'Conversation',
    };
  }

  if (!(await passesChatConversationReadPolicy(userId, conversationId))) {
    return {
      allowed: false,
      state: 'active',
      title: conversation.name ?? 'Conversation',
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: conversation.name ?? 'Conversation',
    url: `/chat?conversation=${conversation.id}`,
  };
}

export async function userCanLinkChatConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const result = await resolveChatConversationForVLink(userId, conversationId);
  return result.allowed;
}

export const CHAT_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → chatVlinkAccessService → conversation participant + Policy Engine CHAT_CONVERSATION_READ';
