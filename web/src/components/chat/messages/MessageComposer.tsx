import { useState, useRef, KeyboardEvent } from 'react';
import { Smile, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileUploadButton } from './FileUploadButton';
import { EMOJI_CATEGORIES } from '@/components/shared/emojiData';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MessageComposerProps {
  onSend: (content: string, files?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MessageComposer = ({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  className,
}: MessageComposerProps) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [activeCategory, setActiveCategory] = useState('reactions');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content.trim() && files.length === 0) return;
    onSend(content, files);
    setContent('');
    setFiles([]);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + emoji + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = (file: File) => {
    setFiles((prev) => [...prev, file]);
  };

  return (
    <div className={cn('flex flex-col gap-2 border-t bg-background p-4', className)}>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-accent p-2 text-sm"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[60px] w-full resize-none"
            rows={1}
          />
        </div>
        <div className="flex gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid grid-cols-6">
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="px-3 py-1.5"
                    >
                      {EMOJI_CATEGORIES[category][0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <TabsContent
                    key={category}
                    value={category}
                    className="h-[200px] overflow-y-auto"
                  >
                    <div className="grid grid-cols-8 gap-1 p-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded hover:bg-accent"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </PopoverContent>
          </Popover>
          <FileUploadButton onFileSelect={handleFileSelect}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Paperclip className="h-5 w-5" />
            </Button>
          </FileUploadButton>
          <Button
            onClick={handleSend}
            disabled={disabled || (!content.trim() && files.length === 0)}
            size="icon"
            className="h-9 w-9"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 