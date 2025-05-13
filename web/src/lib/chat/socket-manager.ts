import { Socket } from 'socket.io-client';
import { getSocket } from '../socket';

export interface ChatEvent {
  type: 'typing' | 'message' | 'presence' | 'reaction' | 'read';
  payload: any;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface ReadReceiptEvent {
  conversationId: string;
  userId: string;
  messageId: string;
  timestamp: Date;
}

class ChatSocketManager {
  private socket: Socket;
  private typingTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.socket = getSocket();
    this.typingTimeouts = new Map();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('chat:typing', this.handleTypingEvent);
    this.socket.on('chat:presence', this.handlePresenceEvent);
    this.socket.on('chat:read', this.handleReadReceiptEvent);
    this.socket.on('chat:error', this.handleError);
  }

  // Typing Indicators
  public startTyping(conversationId: string) {
    const timeoutKey = `typing:${conversationId}`;
    
    // Clear existing timeout
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey));
    }

    // Send typing event
    this.socket.emit('chat:typing', {
      conversationId,
      isTyping: true
    });

    // Set new timeout
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);

    this.typingTimeouts.set(timeoutKey, timeout);
  }

  public stopTyping(conversationId: string) {
    const timeoutKey = `typing:${conversationId}`;
    
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey));
      this.typingTimeouts.delete(timeoutKey);
    }

    this.socket.emit('chat:typing', {
      conversationId,
      isTyping: false
    });
  }

  // Presence
  public updatePresence(status: 'online' | 'offline' | 'away') {
    this.socket.emit('chat:presence', { status });
  }

  // Read Receipts
  public markAsRead(conversationId: string, messageId: string) {
    this.socket.emit('chat:read', {
      conversationId,
      messageId,
      timestamp: new Date()
    });
  }

  // Event Handlers
  private handleTypingEvent = (event: TypingEvent) => {
    // Dispatch to chat context or state manager
    window.dispatchEvent(new CustomEvent('chat:typing', { detail: event }));
  };

  private handlePresenceEvent = (event: PresenceEvent) => {
    window.dispatchEvent(new CustomEvent('chat:presence', { detail: event }));
  };

  private handleReadReceiptEvent = (event: ReadReceiptEvent) => {
    window.dispatchEvent(new CustomEvent('chat:read', { detail: event }));
  };

  private handleError = (error: any) => {
    console.error('Chat socket error:', error);
    window.dispatchEvent(new CustomEvent('chat:error', { detail: error }));
  };

  // Cleanup
  public cleanup() {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    
    this.socket.off('chat:typing', this.handleTypingEvent);
    this.socket.off('chat:presence', this.handlePresenceEvent);
    this.socket.off('chat:read', this.handleReadReceiptEvent);
    this.socket.off('chat:error', this.handleError);
  }
}

export const chatSocketManager = new ChatSocketManager(); 