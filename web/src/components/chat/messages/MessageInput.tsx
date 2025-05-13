'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SmileIcon, PaperclipIcon, SendIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { EMOJI_CATEGORIES, type EmojiCategory } from '@/components/shared/emojiData';
import { cn } from '@/lib/utils';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { useMessageQueue } from '@/hooks/useMessageQueue';
import { useConnection } from '@/hooks/useConnection';
import { useFileManager } from '@/lib/file-manager';
import { Alert } from '@/components/ui/alert';
import { FilePreview } from '../FilePreview';
import type { ChatFile } from '@/types/chat';
import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  conversationId: string;
  threadId?: string;
  placeholder?: string;
  onSend?: () => void;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  threadId,
  placeholder = 'Type a message...',
  onSend,
  className,
}) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<ChatFile[]>([]);
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('Reactions');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected: isOnline } = useConnection({
    url: process.env.NEXT_PUBLIC_WS_URL || '',
  });
  const { toast } = useToast();
  const { sendMessage } = useMessageQueue({
    onMessageSent: (messageId) => {
      // Message sent successfully - could be used for optimistic updates
      console.debug(`Message ${messageId} sent successfully`);
    },
    onMessageFailed: (messageId, error) => {
      toast(error instanceof Error ? error.message : 'Failed to send message', {
        style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
      });
    },
  });

  const {
    uploadFile,
  } = useFileManager({
    onUploadComplete: (file) => {
      setFiles((prev) => [...prev, file]);
    },
    onUploadError: (error) => {
      toast(error instanceof Error ? error.message : 'File upload failed', {
        style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
      });
    },
  });

  const {
    startTyping,
    stopTyping,
  } = useChatRealtime({
    conversationId,
    onTypingChange: (isTyping) => {
      // Typing status updated - could be used to show typing indicators
      console.debug(`Typing status changed: ${isTyping}`);
    }
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    startTyping();
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  }, [startTyping, stopTyping]);

  // Cleanup typing timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!content.trim() && files.length === 0) return;

    stopTyping();

    try {
      const messagePromises: Promise<void>[] = [];

      // Send file messages
      if (files.length > 0) {
        const fileMessages = files.map(file => {
          const messageId = crypto.randomUUID();
          return sendMessage({
            id: messageId,
            content: '',
            type: 'file',
            conversationId,
            threadId: threadId ?? '',
            file,
          });
        });
        messagePromises.push(...fileMessages);
      }

      // Send text message if there's content
      if (content.trim()) {
        const messageId = crypto.randomUUID();
        messagePromises.push(
          sendMessage({
            id: messageId,
            content: content.trim(),
            type: 'text',
            conversationId,
            threadId: threadId ?? '',
          })
        );
      }

      // Wait for all messages to be sent
      await Promise.all(messagePromises);
      
      setFiles([]);
      setContent('');
      onSend?.();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to send message(s)', {
        style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
      });
    }
  }, [content, files, conversationId, threadId, sendMessage, stopTyping, onSend, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    handleTyping();
  }, [handleTyping, handleSend]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(newContent);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  }, [content]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    setIsUploading(true);
    const uploadPromises: Promise<ChatFile>[] = [];
    const errors: Error[] = [];

    try {
      const files = Array.from(selectedFiles);
      
      // Validate files before uploading
      for (const file of files) {
        try {
          const chatFile = await uploadFile(file);
          uploadPromises.push(Promise.resolve(chatFile));
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error('Failed to upload file'));
        }
      }

      // Wait for all successful uploads
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...uploadedFiles]);

      // Show error toast if any uploads failed
      if (errors.length > 0) {
        const errorMessage = errors.length === 1 
          ? errors[0].message 
          : `${errors.length} files failed to upload`;
        toast(errorMessage, {
          style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
        });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Error uploading files', {
        style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [uploadFile, toast]);

  return (
    <div className={cn('border-t p-4', className)}>
      {!isOnline && (
        <Alert variant="destructive" className="mb-4">
          <span className="ml-2">
            You are currently offline. Messages will be sent when you reconnect.
          </span>
        </Alert>
      )}

      {files.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {files.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              size="sm"
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <PaperclipIcon className="h-5 w-5" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*,application/pdf,text/*"
        />
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] resize-none"
          disabled={isUploading}
        />
        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isUploading}>
              <SmileIcon className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <div className="flex flex-col">
              <div className="flex border-b">
                {(Object.keys(EMOJI_CATEGORIES) as EmojiCategory[]).map((category) => (
                  <button
                    key={category}
                    className={cn(
                      'flex-1 p-2 text-sm',
                      activeCategory === category
                        ? 'border-b-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-1 p-2">
                {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
                  <button
                    key={emoji}
                    className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
                    onClick={() => {
                      handleEmojiSelect(emoji);
                      setIsEmojiPickerOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          onClick={handleSend}
          disabled={(!content.trim() && files.length === 0) || isUploading}
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
      {isUploading && (
        <div className="mt-2">
          <Progress value={undefined} className="h-1" />
          <p className="mt-1 text-xs text-muted-foreground">Uploading files...</p>
        </div>
      )}
    </div>
  );
}; 