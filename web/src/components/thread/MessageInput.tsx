import { useState, useRef, useEffect } from 'react';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  threadId: string;
  onSendMessage: (content: string) => void;
  className?: string;
  disabled?: boolean;
}

export const MessageInput = ({
  threadId,
  onSendMessage,
  className,
  disabled = false
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { startTyping, stopTyping } = useTypingIndicator(threadId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    startTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      stopTyping();
      inputRef.current?.focus();
    }
  };

  // Stop typing when input is empty or disabled
  useEffect(() => {
    if (!message.trim() || disabled) {
      stopTyping();
    }
  }, [message, disabled, stopTyping]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <TypingIndicator threadId={threadId} className="px-0" />
      <div className="flex items-center gap-2 px-4">
        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1"
          aria-label="Message input"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
          size="icon"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}; 