import { useEffect, useState } from 'react';
import { SocketManager, SocketManagerConfig, createSocketManager } from '@/lib/socket-manager';
import { OnlineStatusType } from '@/components/chat/OnlineStatus';

export interface SocketEvents {
  message: { type: string; data: any };
  typing: { userId: string; isTyping: boolean };
  'user:status': { userId: string; status: OnlineStatusType };
}

export const useSocketManager = (config: SocketManagerConfig) => {
  const [socket, setSocket] = useState<SocketManager<SocketEvents> | null>(null);

  useEffect(() => {
    const socketManager = createSocketManager<SocketEvents>(config);
    setSocket(socketManager);
    socketManager.connect();

    return () => {
      socketManager.disconnect();
    };
  }, [config.url]);

  return socket;
}; 