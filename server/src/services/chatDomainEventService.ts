import { emitChatMessageSentEvent } from '../events/domainEventEmitters';

export function recordChatMessageSentDomainEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  threadId?: string | null;
  attachmentCount: number;
}): void {
  emitChatMessageSentEvent({
    actorUserId: params.actorUserId,
    messageId: params.messageId,
    conversationId: params.conversationId,
    threadId: params.threadId ?? null,
    attachmentCount: params.attachmentCount,
  });
}
