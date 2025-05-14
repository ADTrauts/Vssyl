import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../utils/logger';

interface AnalyticsWebSocketClient {
  ws: WebSocket;
  subscriptions: {
    threads: Set<string>;
    users: Set<string>;
    tags: Set<string>;
  };
}

interface AnalyticsWebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'authenticate';
  data: {
    threadId?: string;
    userId?: string;
    tagId?: string;
    token?: string;
  };
}

interface AnalyticsWebSocketResponse {
  type: 'thread_analytics' | 'user_analytics' | 'tag_analytics' | 'error' | 'auth_required' | 'auth_success';
  data: unknown;
}

export class AnalyticsWebSocketService {
  private static instance: AnalyticsWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AnalyticsWebSocketClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsWebSocketService {
    if (!AnalyticsWebSocketService.instance) {
      AnalyticsWebSocketService.instance = new AnalyticsWebSocketService();
    }
    return AnalyticsWebSocketService.instance;
  }

  public async initialize(server: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.wss = new WebSocketServer({ server: server as any });
      this.setupEventListeners();
      this.startPingInterval();
      logger.info('WebSocket server initialized successfully');
    } catch (error) {
      logger.error('Error initializing WebSocket server:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substring(7);
      this.clients.set(clientId, {
        ws,
        subscriptions: {
          threads: new Set(),
          users: new Set(),
          tags: new Set()
        }
      });

      this.handleConnection(clientId, ws);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  private handleConnection(clientId: string, ws: WebSocket): void {
    ws.on('message', (data: Buffer) => {
      try {
        const message: AnalyticsWebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        logger.error('Error handling WebSocket message:', error);
        this.sendMessage(ws, {
          type: 'error',
          data: { message: 'Invalid message format' }
        });
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
    });

    this.sendMessage(ws, {
      type: 'auth_required',
      data: { message: 'Authentication required' }
    });
  }

  private handleMessage(clientId: string, message: AnalyticsWebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, message.data.token);
        break;
      case 'subscribe':
        if (message.data.threadId) {
          client.subscriptions.threads.add(message.data.threadId);
        }
        if (message.data.userId) {
          client.subscriptions.users.add(message.data.userId);
        }
        if (message.data.tagId) {
          client.subscriptions.tags.add(message.data.tagId);
        }
        break;
      case 'unsubscribe':
        if (message.data.threadId) {
          client.subscriptions.threads.delete(message.data.threadId);
        }
        if (message.data.userId) {
          client.subscriptions.users.delete(message.data.userId);
        }
        if (message.data.tagId) {
          client.subscriptions.tags.delete(message.data.tagId);
        }
        break;
    }
  }

  private handleAuthentication(clientId: string, token?: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!token) {
      this.sendMessage(client.ws, {
        type: 'error',
        data: { message: 'Authentication token required' }
      });
      return;
    }

    // TODO: Implement proper token validation
    this.sendMessage(client.ws, {
      type: 'auth_success',
      data: { message: 'Authentication successful' }
    });
  }

  private sendMessage(ws: WebSocket, response: AnalyticsWebSocketResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, 30000); // Ping every 30 seconds
  }

  public broadcastThreadAnalytics(threadId: string, analytics: unknown): void {
    this.clients.forEach((client) => {
      if (client.subscriptions.threads.has(threadId)) {
        this.sendMessage(client.ws, {
          type: 'thread_analytics',
          data: { threadId, analytics }
        });
      }
    });
  }

  public broadcastUserAnalytics(userId: string, analytics: unknown): void {
    this.clients.forEach((client) => {
      if (client.subscriptions.users.has(userId)) {
        this.sendMessage(client.ws, {
          type: 'user_analytics',
          data: { userId, analytics }
        });
      }
    });
  }

  public broadcastTagAnalytics(tagId: string, analytics: unknown): void {
    this.clients.forEach((client) => {
      if (client.subscriptions.tags.has(tagId)) {
        this.sendMessage(client.ws, {
          type: 'tag_analytics',
          data: { tagId, analytics }
        });
      }
    });
  }

  public broadcastThreadDeleted(threadId: string): void {
    this.clients.forEach((client) => {
      if (client.subscriptions.threads.has(threadId)) {
        this.sendMessage(client.ws, {
          type: 'thread_analytics',
          data: { threadId, deleted: true }
        });
      }
    });
  }

  public async cleanup(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss?.close(() => resolve());
      });
      this.wss = null;
    }

    logger.info('WebSocket server cleaned up successfully');
  }
} 