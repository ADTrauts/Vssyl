import {
  emitChatConversationCreatedEvent,
  emitChatConversationPermanentlyDeletedEvent,
  emitChatConversationRestoredEvent,
  emitChatConversationTrashedEvent,
  emitChatMessageDeletedEvent,
  emitChatMessagePermanentlyDeletedEvent,
  emitChatMessageReactionAddedEvent,
  emitChatMessageReadEvent,
  emitChatMessageRestoredEvent,
  emitChatMessageSentEvent,
} from '../events/domainEventEmitters';

export function recordChatConversationCreatedDomainEvent(params: {
  actorUserId: string;
  conversationId: string;
  conversationType?: string;
  dashboardId?: string | null;
}): void {
  emitChatConversationCreatedEvent(params);
}

export function recordChatConversationTrashedDomainEvent(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): void {
  emitChatConversationTrashedEvent(params);
}

export function recordChatConversationRestoredDomainEvent(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): void {
  emitChatConversationRestoredEvent(params);
}

export function recordChatConversationPermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): void {
  emitChatConversationPermanentlyDeletedEvent(params);
}

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

export function recordChatMessageDeletedDomainEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): void {
  emitChatMessageDeletedEvent({
    actorUserId: params.actorUserId,
    messageId: params.messageId,
    conversationId: params.conversationId,
    softDelete: true,
  });
}

export function recordChatMessageRestoredDomainEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): void {
  emitChatMessageRestoredEvent(params);
}

export function recordChatMessagePermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): void {
  emitChatMessagePermanentlyDeletedEvent(params);
}

export function recordChatMessageReactionAddedDomainEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  emoji: string;
}): void {
  emitChatMessageReactionAddedEvent(params);
}

export function recordChatMessageReadDomainEvent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): void {
  emitChatMessageReadEvent(params);
}
