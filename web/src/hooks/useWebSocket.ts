import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

export type WebSocketMessageType = 
  | 'authenticate'
  | 'subscribe'
  | 'unsubscribe'
  | 'message'
  | 'error'
  | 'system';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  data: T;
  timestamp: number;
}

interface WebSocketOptions {
  url?: string;
  onMessage?: <T>(message: WebSocketMessage<T>) => void;
  onError?: (error: Error) => void;
  onClose?: (event: CloseEvent) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  useSocketIO?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface WebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  socket: WebSocket | Socket | null;
  sendMessage: <T>(message: WebSocketMessage<T>) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export const useWebSocket = ({
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  onMessage,
  onError,
  onClose,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  useSocketIO = false,
  reconnectAttempts: providedReconnectAttempts,
  reconnectDelay: providedReconnectDelay,
  onConnect,
  onDisconnect,
}: WebSocketOptions = {}): WebSocketReturn => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRooms = useRef<Set<string>>(new Set());
  const maxReconnectAttemptsRef = useRef(maxReconnectAttempts);
  const reconnectDelayRef = useRef(providedReconnectDelay || 3000);

  // Socket.IO event handlers
  const handleSocketIOConnect = useCallback(() => {
    console.log('Socket.IO connected');
    setIsConnected(true);
    setReconnectAttempts(0);
    onConnect?.();
  }, [onConnect]);

  const handleSocketIODisconnect = useCallback((reason: string) => {
    console.log('Socket.IO disconnected:', reason);
    setIsConnected(false);
    onDisconnect?.();
    
    if (reason === 'io server disconnect' && socket) {
      // Server initiated disconnect, try to reconnect
      (socket as Socket).connect();
    }
  }, [socket, onDisconnect]);

  const handleSocketIOConnectError = useCallback((error: Error) => {
    console.error('Socket.IO connection error:', error);
    onError?.(error);
    
    if (reconnectAttempts < maxReconnectAttemptsRef.current) {
      setReconnectAttempts((prev) => prev + 1);
      toast.error(`Connection lost. Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttemptsRef.current})...`);
    } else {
      toast.error('Failed to connect to server. Please refresh the page.');
    }
  }, [reconnectAttempts, onError]);

  const handleSocketIOError = useCallback((error: Error) => {
    console.error('Socket.IO error:', error);
    onError?.(error);
    toast.error('WebSocket error occurred');
  }, [onError]);

  const handleSocketIOMessage = useCallback((data: unknown) => {
    try {
      const message: WebSocketMessage = typeof data === 'string' ? JSON.parse(data) : data;
      if (!isValidWebSocketMessage(message)) {
        throw new Error('Invalid message format');
      }
      setLastMessage(message);
      onMessage?.(message);
    } catch (error) {
      console.error('Error parsing Socket.IO message:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to parse message'));
    }
  }, [onMessage, onError]);

  // WebSocket event handlers
  const handleWebSocketOpen = useCallback(() => {
    console.log('WebSocket connected');
    setIsConnected(true);
    setReconnectAttempts(0);
    // Authenticate with the server
    if (socket && user) {
      const authMessage: WebSocketMessage<{ userId: string }> = {
        type: 'authenticate',
        data: { userId: user.id },
        timestamp: Date.now()
      };
      (socket as WebSocket).send(JSON.stringify(authMessage));
    }
  }, [socket, user]);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (!isValidWebSocketMessage(message)) {
        throw new Error('Invalid message format');
      }
      setLastMessage(message);
      onMessage?.(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to parse message'));
    }
  }, [onMessage, onError]);

  const handleWebSocketError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    onError?.(error instanceof Error ? error : new Error('WebSocket error occurred'));
    toast.error('WebSocket error occurred');
  }, [onError]);

  const handleWebSocketClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    setIsConnected(false);
    onClose?.(event);

    // Attempt to reconnect if not closed cleanly
    if (!event.wasClean && reconnectAttempts < maxReconnectAttemptsRef.current) {
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts((prev) => prev + 1);
        connect();
      }, reconnectInterval);
    }
  }, [reconnectAttempts, reconnectInterval, onClose]);

  const connect = useCallback(() => {
    if (!user) return;

    try {
      let ws: WebSocket | Socket;

      if (useSocketIO) {
        ws = io(url, {
          auth: {
            token: user.id
          },
          reconnection: true,
          reconnectionAttempts: maxReconnectAttemptsRef.current,
          reconnectionDelay: reconnectDelayRef.current,
          timeout: 10000,
        });

        ws.on('connect', handleSocketIOConnect);
        ws.on('disconnect', handleSocketIODisconnect);
        ws.on('connect_error', handleSocketIOConnectError);
        ws.on('error', handleSocketIOError);
        ws.on('message', handleSocketIOMessage);
      } else {
        ws = new WebSocket(url);

        ws.onopen = handleWebSocketOpen;
        ws.onmessage = handleWebSocketMessage;
        ws.onerror = handleWebSocketError;
        ws.onclose = handleWebSocketClose;
      }

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to create WebSocket connection'));
    }
  }, [
    url,
    user,
    useSocketIO,
    handleSocketIOConnect,
    handleSocketIODisconnect,
    handleSocketIOConnectError,
    handleSocketIOError,
    handleSocketIOMessage,
    handleWebSocketOpen,
    handleWebSocketMessage,
    handleWebSocketError,
    handleWebSocketClose,
    onError
  ]);

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        try {
          if (useSocketIO) {
            (socket as Socket).disconnect();
          } else {
            (socket as WebSocket).close();
          }
        } catch (error) {
          console.error('Error during socket cleanup:', error);
          onError?.(error instanceof Error ? error : new Error('Error during socket cleanup'));
        }
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, socket, useSocketIO, onError]);

  const sendMessage = useCallback(
    <T>(message: WebSocketMessage<T>) => {
      if (!socket || !isConnected) {
        console.warn('WebSocket is not connected');
        return;
      }

      if (!isValidWebSocketMessage(message)) {
        console.error('Invalid message format');
        return;
      }

      try {
        if (useSocketIO) {
          (socket as Socket).emit('message', message);
        } else {
          (socket as WebSocket).send(JSON.stringify(message));
        }
      } catch (error) {
        console.error('Error sending message:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to send message'));
      }
    },
    [socket, isConnected, useSocketIO, onError]
  );

  const subscribe = useCallback(
    (channel: string) => {
      if (!socket || !isConnected) {
        console.warn('WebSocket is not connected');
        return;
      }

      try {
        if (useSocketIO) {
          (socket as Socket).emit('join', channel);
        } else {
          const message: WebSocketMessage<{ channel: string }> = {
            type: 'subscribe',
            data: { channel },
            timestamp: Date.now()
          };
          sendMessage(message);
        }

        joinedRooms.current.add(channel);
      } catch (error) {
        console.error('Error subscribing to channel:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to subscribe to channel'));
      }
    },
    [socket, isConnected, sendMessage, useSocketIO, onError]
  );

  const unsubscribe = useCallback(
    (channel: string) => {
      if (!socket || !isConnected) {
        console.warn('WebSocket is not connected');
        return;
      }

      try {
        if (useSocketIO) {
          (socket as Socket).emit('leave', channel);
        } else {
          const message: WebSocketMessage<{ channel: string }> = {
            type: 'unsubscribe',
            data: { channel },
            timestamp: Date.now()
          };
          sendMessage(message);
        }

        joinedRooms.current.delete(channel);
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to unsubscribe from channel'));
      }
    },
    [socket, isConnected, sendMessage, useSocketIO, onError]
  );

  const reconnect = useCallback(() => {
    if (socket) {
      try {
        if (useSocketIO) {
          const socketIO = socket as Socket;
          if (typeof socketIO.connect === 'function') {
            socketIO.connect();
          }
        } else {
          (socket as WebSocket).close();
          connect();
        }
      } catch (error) {
        console.error('Error during reconnection:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to reconnect'));
      }
    }
  }, [socket, useSocketIO, connect, onError]);

  const disconnect = useCallback(() => {
    if (socket) {
      try {
        if (useSocketIO) {
          (socket as Socket).disconnect();
        } else {
          (socket as WebSocket).close();
        }
        setIsConnected(false);
      } catch (error) {
        console.error('Error during disconnection:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to disconnect'));
      }
    }
  }, [socket, useSocketIO, onError]);

  return {
    isConnected,
    lastMessage,
    socket,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnect,
    disconnect
  };
};

function isValidWebSocketMessage(message: unknown): message is WebSocketMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    'data' in message &&
    'timestamp' in message &&
    typeof (message as WebSocketMessage).type === 'string' &&
    typeof (message as WebSocketMessage).timestamp === 'number'
  );
} 