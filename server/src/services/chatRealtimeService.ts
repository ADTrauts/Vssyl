import { getChatSocketService } from './chatSocketService';
import { logger } from '../lib/logger';

export function broadcastNewMessage(
  conversationId: string,
  message: Record<string, unknown>
): void {
  try {
    getChatSocketService().broadcastMessage(conversationId, message);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to broadcast chat message', {
      operation: 'chat_realtime_message',
      conversationId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export function broadcastReaction(
  conversationId: string,
  payload: {
    messageId: string;
    reaction: Record<string, unknown> | null;
    action: 'added' | 'removed';
  }
): void {
  try {
    getChatSocketService().broadcastMessageReaction(conversationId, payload);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to broadcast chat reaction', {
      operation: 'chat_realtime_reaction',
      conversationId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export function broadcastReadReceipt(
  conversationId: string,
  payload: {
    messageId: string;
    readReceipt: Record<string, unknown>;
  }
): void {
  try {
    getChatSocketService().broadcastReadReceipt(conversationId, payload);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to broadcast chat read receipt', {
      operation: 'chat_realtime_read',
      conversationId,
      error: { message: err.message, stack: err.stack },
    });
  }
}
