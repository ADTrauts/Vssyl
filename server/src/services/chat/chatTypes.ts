export type ConversationType = 'DIRECT' | 'GROUP' | 'CHANNEL';
export type ThreadType = 'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION';

export interface CreateConversationInput {
  userId: string;
  name?: string;
  type: ConversationType;
  participantIds: string[];
  dashboardId?: string;
}

export interface SendMessageInput {
  userId: string;
  senderName: string;
  conversationId: string;
  content: string;
  threadId?: string | null;
  replyToId?: string | null;
  fileIds?: string[];
}

export interface ToggleReactionInput {
  userId: string;
  actorName: string;
  messageId: string;
  emoji: string;
}

export interface MarkAsReadInput {
  userId: string;
  messageId: string;
}

export interface CreateThreadInput {
  userId: string;
  conversationId: string;
  name?: string;
  type?: ThreadType;
  parentId?: string;
  participantIds?: string[];
}

export interface ToggleReactionResult {
  action: 'added' | 'removed';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma reaction shape passed to clients
  data: Record<string, any> | null;
  conversationId: string;
}
