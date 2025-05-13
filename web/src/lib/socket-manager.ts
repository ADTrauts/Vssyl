'use client';

import { ConnectionManager } from './connection-manager';
import { MessageQueue } from './message-queue';
import { Message, ChatEvent } from '@/types/chat';

export interface SocketManagerConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

type EventMap = {
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  reconnecting: (data: { attempt: number; maxAttempts: number }) => void;
  reconnect_failed: () => void;
};

type EventHandler<T> = (data: T) => void;

export class EventEmitter {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();

  on<K extends keyof EventMap>(event: K, handler: EventHandler<Parameters<EventMap[K]>[0]>): this {
    const eventKey = String(event);
    if (!this.handlers.has(eventKey)) {
      this.handlers.set(eventKey, new Set());
    }
    this.handlers.get(eventKey)?.add(handler as EventHandler<unknown>);
    return this;
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<Parameters<EventMap[K]>[0]>): this {
    const eventKey = String(event);
    this.handlers.get(eventKey)?.delete(handler as EventHandler<unknown>);
    return this;
  }

  emit<K extends keyof EventMap>(event: K, data: Parameters<EventMap[K]>[0]): this {
    const eventKey = String(event);
    this.handlers.get(eventKey)?.forEach(handler => {
      try {
        (handler as EventHandler<Parameters<EventMap[K]>[0]>)(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventKey}:`, error);
      }
    });
    return this;
  }
}

export interface SocketManager {
  connect(): void;
  disconnect(): void;
  send(event: string, data: unknown): void;
  on<K extends keyof EventMap>(event: K, handler: EventHandler<Parameters<EventMap[K]>[0]>): this;
  off<K extends keyof EventMap>(event: K, handler: EventHandler<Parameters<EventMap[K]>[0]>): this;
}

export class SocketManagerImpl extends EventEmitter implements SocketManager {
  private static instance: SocketManagerImpl | null = null;
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 1000;

  private constructor() {
    super();
  }

  public static getInstance(): SocketManagerImpl {
    if (!SocketManagerImpl.instance) {
      SocketManagerImpl.instance = new SocketManagerImpl();
    }
    return SocketManagerImpl.instance;
  }

  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected', undefined);
    };

    this.socket.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        this.emit(type, data);
      } catch (error) {
        this.emit('error', error instanceof Error ? error : new Error('Failed to parse WebSocket message'));
      }
    };

    this.socket.onclose = () => {
      this.emit('disconnected', undefined);
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      this.emit('error', error instanceof Error ? error : new Error('WebSocket error'));
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  public send(event: string, data: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: event, data }));
    } else {
      this.emit('error', new Error('WebSocket is not connected'));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed', undefined);
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    });

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }
}

export const createSocketManager = (): SocketManager => {
  return SocketManagerImpl.getInstance();
}; 