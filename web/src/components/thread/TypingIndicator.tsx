import { useEffect, useState } from 'react';
import { useWebSocket, type WebSocketMessage } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/auth-context';
import { errorLogger } from '@/lib/error-logger';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  threadId: string;
  className?: string;
}

interface TypingUser {
  id: string;
  name: string;
  avatar: string | undefined;
}

interface TypingEventData {
  threadId: string;
  userId: string;
  isTyping: boolean;
}

function isTypingEventData(data: unknown): data is TypingEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'threadId' in data &&
    'userId' in data &&
    'isTyping' in data &&
    typeof (data as TypingEventData).threadId === 'string' &&
    typeof (data as TypingEventData).userId === 'string' &&
    typeof (data as TypingEventData).isTyping === 'boolean'
  );
}

export const TypingIndicator = ({ threadId, className }: TypingIndicatorProps) => {
  const { user } = useAuth();
  const { socket, sendMessage } = useWebSocket({
    onMessage: (message: WebSocketMessage) => {
      if (message.type === 'message' && isTypingEventData(message.data)) {
        const data = message.data;
        if (data.threadId === threadId) {
          setTypingUsers(prev => {
            const newTypingUsers = [...prev];
            const userIndex = newTypingUsers.findIndex(u => u.id === data.userId);

            if (data.isTyping) {
              // Add user if not already typing
              if (userIndex === -1 && data.userId !== user?.id) {
                const typingUser: TypingUser = {
                  id: data.userId,
                  name: 'User', // This would be replaced with actual user data
                  avatar: undefined
                };
                newTypingUsers.push(typingUser);
              }
            } else {
              // Remove user if they stopped typing
              if (userIndex !== -1) {
                newTypingUsers.splice(userIndex, 1);
              }
            }

            return newTypingUsers;
          });
        }
      }
    }
  });
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket || !user) return;

    // Subscribe to thread
    const message: WebSocketMessage<{ threadId: string }> = {
      type: 'subscribe',
      data: { threadId },
      timestamp: Date.now()
    };
    sendMessage(message);

    return () => {
      // Unsubscribe from thread
      const message: WebSocketMessage<{ threadId: string }> = {
        type: 'unsubscribe',
        data: { threadId },
        timestamp: Date.now()
      };
      sendMessage(message);
    };
  }, [socket, user, threadId, sendMessage]);

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground', className)}>
      <div className="flex items-center gap-2">
        {typingUsers.map(typingUser => (
          <div key={typingUser.id} className="flex items-center gap-1">
            {typingUser.avatar ? (
              <img
                src={typingUser.avatar}
                alt={typingUser.name}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{typingUser.name}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="animate-bounce delay-0">•</span>
        <span className="animate-bounce delay-150">•</span>
        <span className="animate-bounce delay-300">•</span>
      </div>
    </div>
  );
}; 