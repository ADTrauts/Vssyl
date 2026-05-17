import { Socket } from 'socket.io-client';
import { ChatEvent, TypingEvent, PresenceEvent } from 'shared/types/chat';
import {
  acquireRealtimeConnection,
  getRealtimeSocket,
  releaseRealtimeConnection,
} from './realtimeClient';

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: string;
  edited?: boolean;
  deleted?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
  conversationId: string;
}

export interface ChatSocketEvents {
  message_received: (message: ChatMessage) => void;
  user_typing: (data: TypingEvent) => void;
  message_reaction: (data: { messageId: string; reaction: MessageReaction }) => void;
  message_read: (data: { messageId: string; readReceipt: ReadReceipt }) => void;
  user_presence: (data: PresenceEvent) => void;
  activity_feed_refresh: (data: Record<string, unknown>) => void;
  error: (error: { message: string }) => void;
}

const HOLDER_ID = 'chat-socket';

export class ChatSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventListeners: Map<keyof ChatSocketEvents, Set<ChatSocketEvents[keyof ChatSocketEvents]>> =
    new Map();
  private socketForwardingAttached = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const events: (keyof ChatSocketEvents)[] = [
      'message_received',
      'user_typing',
      'message_reaction',
      'message_read',
      'user_presence',
      'activity_feed_refresh',
      'error',
    ];

    events.forEach((event) => {
      this.eventListeners.set(event, new Set());
    });
  }

  public connect(token: string): Promise<void> {
    return new Promise((resolve) => {
      if (!token) {
        resolve();
        return;
      }

      this.token = token;

      void acquireRealtimeConnection(token, HOLDER_ID)
        .then((sharedSocket) => {
          this.socket = sharedSocket;
          if (!this.socketForwardingAttached) {
            this.setupSocketEventListeners();
            this.socketForwardingAttached = true;
          }
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }

  private setupSocketEventListeners() {
    if (!this.socket) return;

    this.socket.on('message_received', (data) => {
      this.emit('message_received', data);
    });

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('message_reaction', (data) => {
      this.emit('message_reaction', data);
    });

    this.socket.on('message_read', (data) => {
      this.emit('message_read', data);
    });

    this.socket.on('user_presence', (data) => {
      this.emit('user_presence', data);
    });

    this.socket.on('activity:feed:refresh', (data: Record<string, unknown>) => {
      this.emit('activity_feed_refresh', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  public disconnect(): void {
    this.token = null;
    this.socket = null;
    releaseRealtimeConnection(HOLDER_ID);
    if (!getRealtimeSocket()) {
      this.socketForwardingAttached = false;
    }
  }

  public joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  public leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  public sendMessage(message: ChatMessage): void {
    if (this.socket?.connected) {
      this.socket.emit('new_message', message);
    }
  }

  public startTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId, isTyping: true });
    }
  }

  public stopTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId, isTyping: false });
    }
  }

  public addReaction(messageId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message_reaction', { messageId, emoji });
    }
  }

  public markAsRead(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', messageId);
    }
  }

  public updatePresence(status: 'online' | 'away' | 'offline'): void {
    if (this.socket?.connected) {
      this.socket.emit('presence_update', { status, lastSeen: new Date().toISOString() });
    }
  }

  public on<K extends keyof ChatSocketEvents>(event: K, listener: ChatSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  public off<K extends keyof ChatSocketEvents>(event: K, listener: ChatSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /** Forward calendar and other direct socket events (legacy path). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public onRaw(event: string, listener: (...args: any[]) => void): void {
    this.socket?.on(event, listener);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public offRaw(event: string, listener: (...args: any[]) => void): void {
    this.socket?.off(event, listener);
  }

  private emit<K extends keyof ChatSocketEvents>(
    event: K,
    data: Parameters<ChatSocketEvents[K]>[0]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as (data: unknown) => void)(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionState(): string {
    return this.socket?.connected ? 'connected' : 'disconnected';
  }
}

export const chatSocket = new ChatSocketClient();
