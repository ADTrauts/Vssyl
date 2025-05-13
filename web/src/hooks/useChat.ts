'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api-client';
import { Message, Conversation } from '@/types/chat';
import { toast } from 'sonner';

interface UseChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  createConversation: (name: string, type: 'personal' | 'enterprise', workspaceId?: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
}

interface MessagesResponse {
  messages: Message[];
  cursor: string | null;
  hasMore: boolean;
}

export function useChat(): UseChatReturn {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Load conversations
  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages();
    } else {
      setMessages([]);
      setCursor(null);
      setHasMore(true);
    }
  }, [activeConversation]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getConversations() as Conversation[];
      setConversations(data);
      setError(null);
    } catch (err) {
      setError('Failed to load conversations');
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeConversation) return;

    try {
      setIsLoading(true);
      const data = await api.getMessages(activeConversation.id, cursor || undefined) as MessagesResponse;
      setMessages(prev => [...prev, ...data.messages]);
      setCursor(data.cursor);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;
    await loadMessages();
  };

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!activeConversation) return;

    try {
      const message = await api.sendMessage(activeConversation.id, content, attachments) as Message;
      setMessages(prev => [message, ...prev]);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const createConversation = async (name: string, type: 'personal' | 'enterprise', workspaceId?: string) => {
    try {
      const conversation = await api.createConversation(name, type, workspaceId) as Conversation;
      setConversations(prev => [conversation, ...prev]);
      setActiveConversation(conversation);
    } catch (err) {
      toast.error('Failed to create conversation');
    }
  };

  return {
    conversations,
    activeConversation,
    messages,
    isLoading,
    error,
    sendMessage,
    createConversation,
    loadMoreMessages,
    setActiveConversation,
  };
} 