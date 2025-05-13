import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableMessageProps {
  message: Message;
  onSave: (content: string) => void;
  onCancel: () => void;
  className?: string;
}

export const EditableMessage: React.FC<EditableMessageProps> = ({
  message,
  onSave,
  onCancel,
  className,
}) => {
  const [content, setContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    // Place cursor at the end
    const length = textareaRef.current?.value.length || 0;
    textareaRef.current?.setSelectionRange(length, length);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (trimmedContent && trimmedContent !== message.content) {
      onSave(trimmedContent);
    } else {
      onCancel();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] resize-none"
        rows={1}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onClick={handleSave}
        >
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <p className="text-xs text-muted-foreground ml-2">
          Press Enter to save, Escape to cancel
        </p>
      </div>
    </div>
  );
}; 