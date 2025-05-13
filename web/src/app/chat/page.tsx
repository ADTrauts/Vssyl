'use client';

import { useChatContext } from '@/contexts/chat-context';
import { useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Message } from '@/components/chat/messages/Message';
import { MessageInput } from '@/components/chat/MessageInput';
import { ConversationList } from '@/components/chat/ConversationList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { state, sendMessage, setTyping } = useChatContext();
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!socket || !state.activeConversation?.id) return;

    const conversationId = state.activeConversation.id;
    socket.emit('chat:join', conversationId);

    return () => {
      socket.emit('chat:leave', conversationId);
    };
  }, [socket, state.activeConversation?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    await sendMessage(content);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (!state.activeConversation?.id) {
    return (
      <div className="flex h-full">
        <div className="w-1/4 border-r">
          <ConversationList />
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  const conversationId = state.activeConversation.id;

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r">
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {state.messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              conversationId={conversationId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t">
          <MessageInput
            onSend={handleSendMessage}
            onTyping={setTyping}
            conversationId={conversationId}
          />
        </div>
      </div>
    </div>
  );
} 