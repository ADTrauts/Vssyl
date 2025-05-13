import { useChat } from '@/contexts/chat-context';
import { TypingIndicator } from './TypingIndicator';

export function ChatTypingIndicator() {
  const { typingUsers } = useChat();
  const typingUserCount = typingUsers.size;

  if (typingUserCount === 0) return null;

  let message = '';
  const userArray = Array.from(typingUsers);

  if (typingUserCount === 1) {
    message = `${userArray[0]} is typing`;
  } else if (typingUserCount === 2) {
    message = `${userArray[0]} and ${userArray[1]} are typing`;
  } else {
    message = `${userArray[0]} and ${typingUserCount - 1} others are typing`;
  }

  return (
    <div className="px-4 py-2">
      <TypingIndicator />
      <span className="text-xs text-muted-foreground ml-2">{message}</span>
    </div>
  );
} 