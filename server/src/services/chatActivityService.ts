import { emitModuleActivityEvent } from './moduleActivityService';

export async function recordMessageSent(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  dashboardId?: string;
  metadata?: {
    threadId?: string | null;
    replyToId?: string | null;
  };
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'message',
    targetType: 'message',
    targetId: params.messageId,
    parentType: 'conversation',
    parentId: params.conversationId,
    dashboardId: params.dashboardId,
    metadata: params.metadata,
  });
}

export async function recordReaction(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
  emoji: string;
  action: 'added' | 'removed';
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: params.action === 'added' ? 'react' : 'unreact',
    targetType: 'message',
    targetId: params.messageId,
    parentType: 'conversation',
    parentId: params.conversationId,
    metadata: { emoji: params.emoji },
  });
}

export async function recordRead(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'read',
    targetType: 'message',
    targetId: params.messageId,
    parentType: 'conversation',
    parentId: params.conversationId,
  });
}

export async function recordConversationCreated(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
  type: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'conversation_created',
    targetType: 'conversation',
    targetId: params.conversationId,
    dashboardId: params.dashboardId ?? undefined,
    metadata: { type: params.type },
  });
}

export async function recordThreadCreated(params: {
  actorUserId: string;
  threadId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'thread_created',
    targetType: 'thread',
    targetId: params.threadId,
    parentType: 'conversation',
    parentId: params.conversationId,
  });
}

export async function recordConversationTrashed(params: {
  actorUserId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'conversation_trashed',
    targetType: 'conversation',
    targetId: params.conversationId,
  });
}

export async function recordConversationRestored(params: {
  actorUserId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'conversation_restored',
    targetType: 'conversation',
    targetId: params.conversationId,
  });
}

export async function recordConversationPermanentlyDeleted(params: {
  actorUserId: string;
  conversationId: string;
  dashboardId?: string | null;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'conversation_deleted',
    targetType: 'conversation',
    targetId: params.conversationId,
    dashboardId: params.dashboardId ?? undefined,
  });
}

export async function recordMessageTrashed(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'message_trashed',
    targetType: 'message',
    targetId: params.messageId,
    parentType: 'conversation',
    parentId: params.conversationId,
  });
}

export async function recordMessageRestored(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'message_restored',
    targetType: 'message',
    targetId: params.messageId,
    parentType: 'conversation',
    parentId: params.conversationId,
  });
}

export async function recordMessagePermanentlyDeleted(params: {
  actorUserId: string;
  messageId: string;
  conversationId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'chat',
    action: 'message_deleted',
    targetType: 'message',
    targetId: params.messageId,
    parentType: 'conversation',
    parentId: params.conversationId,
  });
}
