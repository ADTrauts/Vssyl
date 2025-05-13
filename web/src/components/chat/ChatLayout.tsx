'use client';

import React, { ReactNode } from 'react';
import { PanelContainer } from './core/PanelContainer';
import { ConversationPanel } from './panels/ConversationPanel';
import { MessagePanel } from './panels/MessagePanel';
import { ThreadPanel } from './panels/ThreadPanel';
import { useChat } from '@/hooks/useChat';

interface ChatLayoutProps {
  children: ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const { activeConversation, activeThread, threads, activeThreadId, setActiveThread, messages, addMessage } = useChat();

  const handleSendMessage = (content: string) => {
    if (activeConversation) {
      addMessage(activeConversation.id, {
        content,
        role: 'user',
      });
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <PanelContainer>
        <div className="md:block">
          <ConversationPanel />
        </div>
        {activeConversation ? (
          <MessagePanel
            conversationId={activeConversation.id}
            title={activeConversation.title}
            messages={messages}
            onSend={handleSendMessage}
          >
            {children}
          </MessagePanel>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
        {activeThread && (
          <div className="hidden md:block">
            <ThreadPanel
              threads={threads}
              activeThreadId={activeThreadId}
              onThreadSelect={setActiveThread}
            />
          </div>
        )}
      </PanelContainer>
    </div>
  );
}; 