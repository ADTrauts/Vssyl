'use client';

import { EventEmitter } from 'events';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface ConnectionManagerConfig {
  url: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
}

const DEFAULT_CONFIG: ConnectionManagerConfig = {
  url: '',
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 seconds
  heartbeatTimeout: 5000, // 5 seconds
};

export class ConnectionManager extends EventEmitter {
  private config: ConnectionManagerConfig;
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private lastPongTime: number = 0;

  constructor(config: Partial<ConnectionManagerConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!this.config.url) {
      throw new Error('WebSocket URL is required');
    }
  }

  connect() {
    if (this.state === 'connected' || this.state === 'connecting') return;

    this.setState('connecting');
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    };

    this.ws.onclose = () => {
      this.handleDisconnect();
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
      this.handleDisconnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          this.handlePong();
        } else {
          this.emit('message', data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.emit('state_change', state);
  }

  private handleDisconnect() {
    this.cleanup();
    this.setState('disconnected');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts');
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.state !== 'connected') return;

      this.send({ type: 'ping' });
      this.heartbeatTimeout = setTimeout(() => {
        if (Date.now() - this.lastPongTime > this.config.heartbeatTimeout) {
          this.handleDisconnect();
        }
      }, this.config.heartbeatTimeout);
    }, this.config.heartbeatInterval);
  }

  private handlePong() {
    this.lastPongTime = Date.now();
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  send(data: any): boolean {
    if (this.state !== 'connected' || !this.ws) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
    this.setState('disconnected');
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws = null;
    }
  }

  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }
} 