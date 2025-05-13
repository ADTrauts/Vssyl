// Socket.io hook for real-time communication
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

/**
 * Authentication configuration for socket connection
 */
interface SocketAuth {
  /** Authentication token */
  token: string;
}

/**
 * Socket connection options
 */
interface SocketOptions {
  /** Maximum number of reconnection attempts */
  reconnectionAttempts?: number;
  /** Delay between reconnection attempts in milliseconds */
  reconnectionDelay?: number;
  /** Maximum delay between reconnection attempts in milliseconds */
  reconnectionDelayMax?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Callback for handling errors */
  onError?: (error: Error) => void;
}

/**
 * Socket configuration
 */
interface SocketConfig {
  /** WebSocket server URL */
  url: string;
  /** Authentication configuration */
  auth: SocketAuth;
  /** Socket connection options */
  options?: Partial<SocketOptions> | null;
}

// Default socket configuration values
const DEFAULT_RECONNECTION_ATTEMPTS = 5;
const DEFAULT_RECONNECTION_DELAY = 1000;
const DEFAULT_RECONNECTION_DELAY_MAX = 5000;
const DEFAULT_TIMEOUT = 20000;

/**
 * Hook for managing socket.io connection
 * @param config Socket configuration
 * @returns Socket instance and connection state
 */
export const useSocket = ({
  url,
  auth,
  options,
}: SocketConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!url || !auth.token) {
      const error = new Error('Socket URL and token are required');
      console.error(error.message);
      setError(error);
      options?.onError?.(error);
      return;
    }

    try {
      // Create socket instance with type-safe configuration
      const socket = io(url, {
        auth: {
          token: auth.token,
        },
        reconnectionAttempts: options?.reconnectionAttempts ?? DEFAULT_RECONNECTION_ATTEMPTS,
        reconnectionDelay: options?.reconnectionDelay ?? DEFAULT_RECONNECTION_DELAY,
        reconnectionDelayMax: options?.reconnectionDelayMax ?? DEFAULT_RECONNECTION_DELAY_MAX,
        timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      });

      // Set up event handlers
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
      });

      socket.on('connect_error', (err: Error) => {
        const error = new Error(`Socket connection error: ${err.message}`);
        console.error('Socket connection error:', error);
        setError(error);
        options?.onError?.(error);
      });

      socket.on('disconnect', (reason: Socket.DisconnectReason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      // Set up reconnection event handlers
      socket.io.on('reconnect', (attemptNumber: number) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setError(null);
      });

      socket.io.on('reconnect_attempt', (attemptNumber: number) => {
        console.log('Socket reconnection attempt:', attemptNumber);
      });

      socket.io.on('reconnect_error', (err: Error) => {
        const error = new Error(`Socket reconnection error: ${err.message}`);
        console.error('Socket reconnection error:', error);
        setError(error);
        options?.onError?.(error);
      });

      socket.io.on('reconnect_failed', () => {
        const error = new Error('Socket reconnection failed after all attempts');
        console.error(error.message);
        setError(error);
        options?.onError?.(error);
      });

      // Store socket instance
      socketRef.current = socket;

      // Cleanup function
      return () => {
        try {
          if (socketRef.current) {
            // Remove all event listeners
            socketRef.current.removeAllListeners();
            socketRef.current.io.removeAllListeners();
            
            // Disconnect socket
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Error during socket cleanup');
          console.error('Error during socket cleanup:', error);
          setError(error);
          options?.onError?.(error);
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize socket');
      console.error('Error initializing socket:', error);
      setError(error);
      options?.onError?.(error);
    }
  }, [url, auth.token, options]);

  // Get socket instance with error handling
  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      const error = new Error('Socket is not initialized');
      console.warn(error.message);
      setError(error);
      options?.onError?.(error);
    }
    return socketRef.current;
  }, [options]);

  return {
    socket: getSocket(),
    isConnected,
    error,
  };
}; 