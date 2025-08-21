import { io, Socket } from 'socket.io-client';
import { ChatEvent, TypingEvent, PresenceEvent } from 'shared/types/chat';

export interface ChatSocketEvents {
  message_received: (message: any) => void;
  user_typing: (data: TypingEvent) => void;
  message_reaction: (data: { messageId: string; reaction: any }) => void;
  message_read: (data: { messageId: string; readReceipt: any }) => void;
  user_presence: (data: PresenceEvent) => void;
  error: (error: { message: string }) => void;
}

export class ChatSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventListeners: Map<keyof ChatSocketEvents, Set<ChatSocketEvents[keyof ChatSocketEvents]>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Initialize event listener sets
    const events: (keyof ChatSocketEvents)[] = [
      'message_received',
      'user_typing',
      'message_reaction',
      'message_read',
      'user_presence',
      'error'
    ];

    events.forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (!token) {
        // No token provided for WebSocket connection - non-critical, silent fail
        resolve(); // Resolve without connecting
        return;
      }

      this.token = token;
      const serverUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

      try {
        this.socket = io(serverUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          // Chat WebSocket connected
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Chat WebSocket connection error:', error);
          // Don't reject - just log the error and resolve
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          // Chat WebSocket disconnected
          if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            this.socket?.connect();
          }
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          // Chat WebSocket reconnection attempt
          this.reconnectAttempts = attemptNumber;
        });

        this.socket.on('reconnect_failed', () => {
          console.error('Chat WebSocket reconnection failed');
        });

        // Set up event listeners
        this.setupSocketEventListeners();
      } catch (error) {
        console.error('Failed to initialize WebSocket connection:', error);
        resolve(); // Resolve without connecting
      }
    });
  }

  private setupSocketEventListeners() {
    if (!this.socket) return;

    // Listen for all chat events
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

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
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

  public sendMessage(message: any): void {
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

  // Event listener management
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

  private emit<K extends keyof ChatSocketEvents>(event: K, data: Parameters<ChatSocketEvents[K]>[0]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(data);
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

// Create a singleton instance
export const chatSocket = new ChatSocketClient(); 