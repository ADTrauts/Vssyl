import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;
let isInitializing = false;
let connectionPromise: Promise<Socket | null> | null = null;

export function getSocket(): Promise<Socket | null> {
  if (!socket && !isInitializing) {
    isInitializing = true;
    connectionPromise = new Promise((resolve) => {
      socket = io(API_BASE_URL, {
        transports: ['websocket'],
        autoConnect: true,
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('🟢 Socket connected:', socket?.id);
        isInitializing = false;
        resolve(socket);
      });

      socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected');
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        isInitializing = false;
        resolve(socket);
      });
    });
  }

  return connectionPromise || Promise.resolve(socket);
}

// Create the singleton instance
getSocket();
export default socket; 