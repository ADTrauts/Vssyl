'use client';

import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { useChatContext } from '@/contexts/chat-context';
import { Button } from '@/components/ui/button';
import { SmileIcon } from 'lucide-react';
import { EMOJI_CATEGORIES } from '@/components/shared/emojiData';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  message: Message;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({ message }) => {
  const { addReaction, removeReaction } = useChatContext();
  const [activeCategory, setActiveCategory] = useState(0);

  const handleReactionClick = (emoji: string) => {
    const hasReacted = message.reactions?.[emoji]?.includes('current-user');
    if (hasReacted) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Object.entries(message.reactions || {}).map(([emoji, users]) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 px-2 text-xs',
            users.includes('current-user') && 'bg-accent'
          )}
          onClick={() => handleReactionClick(emoji)}
        >
          {emoji} {users.length}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <SmileIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex flex-col">
            <div className="flex overflow-x-auto border-b scrollbar-thin scrollbar-thumb-accent scrollbar-track-background">
              {EMOJI_CATEGORIES.map((category, index) => (
                <Button
                  key={category.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'shrink-0 h-8 px-3',
                    activeCategory === index && 'bg-accent'
                  )}
                  onClick={() => setActiveCategory(index)}
                >
                  {category.icon} {category.name}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1 p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-accent scrollbar-track-background">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    handleReactionClick(emoji);
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </div>
            <div className="border-t p-2">
              <p className="text-xs text-muted-foreground text-center">
                Click an emoji to react to the message
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}; 