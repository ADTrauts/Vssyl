import React, { useEffect, useRef } from 'react';
import { Message } from '@/components/chat/Message';
import { useChatContext } from '@/contexts/chat-context';
import { useInView } from 'react-intersection-observer';

export const MessageList: React.FC = () => {
  const { messages, hasMoreMessages, loadMoreMessages } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadMoreRef, inView] = useInView({
    threshold: 0,
    rootMargin: '100px 0px 0px 0px',
  });

  useEffect(() => {
    if (inView && hasMoreMessages) {
      loadMoreMessages();
    }
  }, [inView, hasMoreMessages, loadMoreMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {hasMoreMessages && (
        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary" />
        </div>
      )}
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}; 