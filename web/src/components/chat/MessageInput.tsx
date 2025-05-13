'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatFile } from '@/types/chat';
import { FileShareButton } from './FileShareButton';
import type { File } from '@/types/api';
import debounce from 'lodash/debounce';

interface MessageInputProps {
  conversationId: string;
  threadId?: string;
  placeholder?: string;
  onSend: (content: string, files?: File[]) => void;
  onTyping: (isTyping: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  threadId,
  placeholder = 'Type a message...',
  onSend,
  onTyping,
  className = '',
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounce typing events
  const debouncedTyping = useCallback(
    debounce((isTyping: boolean) => {
      onTyping(isTyping);
    }, 300),
    [onTyping]
  );

  const handleTyping = useCallback(() => {
    debouncedTyping(true);
    // Reset typing status after 1 second of no input
    setTimeout(() => debouncedTyping(false), 1000);
  }, [debouncedTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    handleTyping();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;

    onSend(content.trim(), selectedFiles);
    setContent('');
    setSelectedFiles([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (files: ChatFile[]) => {
    // Convert ChatFile to File type
    const convertedFiles: File[] = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setSelectedFiles((prev) => [...prev, ...convertedFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
        <FileShareButton
          onFileSelect={handleFileSelect}
          disabled={disabled}
          className="shrink-0"
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          style={{
            minHeight: '24px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || (!content.trim() && selectedFiles.length === 0)}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}; 