import { EventEmitter } from 'events';

interface AnalyticsWebSocketMessage {
  type: 'connected' | 'thread_analytics' | 'user_analytics' | 'aggregated_metrics' | 'ping' | 'pong' | 'auth_required' | 'auth_success' | 'auth_error';
  data?: any;
}

interface AnalyticsWebSocketClientOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  authToken?: string;
}

export class AnalyticsWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isAuthenticated = false;

  constructor(private options: AnalyticsWebSocketClientOptions = {}) {
    super();
    this.options = {
      url: options.url || 'ws://localhost:3000',
      reconnectInterval: options.reconnectInterval || 5000,
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      authToken: options.authToken
    };
  }

  public connect(): void {
    try {
      this.ws = new WebSocket(this.options.url!);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.emit('connected');
      this.reconnectAttempts = 0;
      this.authenticate();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: AnalyticsWebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.emit('error', new Error('Failed to parse WebSocket message'));
      }
    };

    this.ws.onclose = () => {
      this.emit('disconnected');
      this.stopPingInterval();
      this.isAuthenticated = false;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private authenticate(): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.options.authToken) {
      this.ws.send(JSON.stringify({
        type: 'authenticate',
        data: { token: this.options.authToken }
      }));
    } else {
      this.emit('auth_error', new Error('No authentication token provided'));
    }
  }

  private handleMessage(message: AnalyticsWebSocketMessage): void {
    switch (message.type) {
      case 'auth_required':
        this.authenticate();
        break;
      case 'auth_success':
        this.isAuthenticated = true;
        this.startPingInterval();
        this.emit('authenticated');
        break;
      case 'auth_error':
        this.isAuthenticated = false;
        this.emit('auth_error', message.data);
        break;
      case 'thread_analytics':
        if (this.isAuthenticated) {
          this.emit('thread_analytics', message.data);
        }
        break;
      case 'user_analytics':
        if (this.isAuthenticated) {
          this.emit('user_analytics', message.data);
        }
        break;
      case 'aggregated_metrics':
        if (this.isAuthenticated) {
          this.emit('aggregated_metrics', message.data);
        }
        break;
      case 'ping':
        this.sendPong();
        break;
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Send ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  private sendPong(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'pong' }));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.options.maxReconnectAttempts
    });

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  public subscribeToThread(threadId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        data: { threadId }
      }));
    }
  }

  public subscribeToUser(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        data: { userId }
      }));
    }
  }

  public unsubscribeFromThread(threadId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        data: { threadId }
      }));
    }
  }

  public unsubscribeFromUser(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        data: { userId }
      }));
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 