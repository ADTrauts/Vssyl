'use client';

import React from 'react';
import { Panel } from '../../core/Panel';
import { PanelHeader } from '../../shared/PanelHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PANEL_SIZES } from '../../core/types';
import { MessagesSquare } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface MessagePanelProps {
  conversationId: string;
  title: string;
  children?: React.ReactNode;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  conversationId,
  title,
  children,
  messages,
  onSend,
  onTyping,
}) => {
  return (
    <Panel
      id={`messages-${conversationId}`}
      position="right"
      defaultWidth={PANEL_SIZES.lg}
      minWidth={PANEL_SIZES.md}
      maxWidth={PANEL_SIZES.xl}
      className="border-l"
    >
      <div className="flex h-full flex-col">
        <PanelHeader
          title={title}
          icon={<MessagesSquare className="h-4 w-4" />}
          showMoreMenu
          onMoreClick={() => console.log('More options clicked')}
        />
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} />
          {children}
        </div>
        <MessageInput 
          conversationId={conversationId}
          onSend={(content, files) => onSend(content)}
          onTyping={onTyping}
          placeholder="Type a message..."
          className="border-t p-4"
        />
      </div>
    </Panel>
  );
}; 