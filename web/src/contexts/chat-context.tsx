'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { Message, Thread, ExtendedChatState, ChatEvent, Conversation, MessageStatusType, ChatFile, ChatContextType, ChatAction } from '@/types/chat';
import { OnlineStatusType } from '@/components/chat/OnlineStatus';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';
import { useFileManager } from '@/lib/file-manager';

interface ReadReceipt {
  name: string;
  avatar: string;
  timestamp: string;
}

const initialState: ExtendedChatState = {
  messages: [],
  threads: {},
  activeThreadId: null,
  isTyping: false,
  typingUsers: new Set(),
  userStatuses: new Map(),
  error: null,
  hasMoreMessages: true,
  currentPage: 1,
  pageSize: 50,
  activeConversation: null,
  conversations: [],
  messageQueue: [],
  failedMessages: new Set(),
  uploadProgress: {},
  readReceipts: {},
};

function chatReducer(state: ExtendedChatState, action: ChatAction): ExtendedChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ADD_MESSAGES':
      return {
        ...state,
        messages: [...action.payload.messages, ...state.messages],
        hasMoreMessages: action.payload.hasMore,
        currentPage: state.currentPage + 1,
      };
    case 'SET_THREADS':
      return { ...state, threads: action.payload };
    case 'SET_THREAD':
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.payload.threadId]: action.payload.thread,
        },
      };
    case 'SET_ACTIVE_THREAD':
      return { ...state, activeThreadId: action.payload };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'ADD_TYPING_USER': {
      const newTypingUsers = new Set([...Array.from(state.typingUsers), action.payload]);
      return { ...state, typingUsers: newTypingUsers };
    }
    case 'REMOVE_TYPING_USER': {
      const updatedTypingUsers = new Set(Array.from(state.typingUsers).filter(id => id !== action.payload));
      return { ...state, typingUsers: updatedTypingUsers };
    }
    case 'SET_USER_STATUS':
      const newUserStatuses = new Map(state.userStatuses);
      newUserStatuses.set(action.payload.userId, action.payload.status);
      return { ...state, userStatuses: newUserStatuses };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: state.conversations.find((c) => c.id === action.payload) || null,
      };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.payload.id
            ? { ...conversation, title: action.payload.title }
            : conversation
        ),
        activeConversation: state.conversations.find((c) => c.id === action.payload.id) || null,
      };
    case 'EDIT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.id
            ? { ...message, content: action.payload.content, editedAt: new Date().toISOString() }
            : message
        ),
      };
    case 'SET_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.fileId]: action.payload.progress,
        },
      };
    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.payload.messageId
            ? { ...message, status: action.payload.status }
            : message
        ),
      };
    default:
      return state;
  }
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeWorkspace: workspace } = useWorkspace();
  const { toast } = useToast();
  const socket = useSocket();
  const fileManager = useFileManager();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: { conversationId: string; content: string; sender: any }) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: Date.now().toString(), // Temporary ID until server confirms
          content: data.content,
          conversationId: data.conversationId,
          sender: data.sender,
          createdAt: new Date().toISOString(),
          status: 'received'
        }
      });
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.isTyping) {
        dispatch({ type: 'ADD_TYPING_USER', payload: data.userId });
      } else {
        dispatch({ type: 'REMOVE_TYPING_USER', payload: data.userId });
      }
    };

    const handlePresence = (data: { userId: string; status: OnlineStatusType }) => {
      dispatch({ type: 'SET_USER_STATUS', payload: { userId: data.userId, status: data.status } });
    };

    const handleError = (error: { message: string }) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:presence', handlePresence);
    socket.on('chat:error', handleError);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:presence', handlePresence);
      socket.off('chat:error', handleError);
    };
  }, [socket, toast]);

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!socket || !state.activeConversation?.id) return;

    const messageId = Date.now().toString();
    const message: Message = {
      id: messageId,
      content,
      conversationId: state.activeConversation.id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      sender: {
        id: 'current-user', // Will be replaced by server
        name: 'Current User', // Will be replaced by server
      }
    };

    // Add to local state immediately
    dispatch({ type: 'ADD_MESSAGE', payload: message });

    try {
      // Send to server
      socket.emit('chat:message', {
        conversationId: state.activeConversation.id,
        content
      });

      // Update status to sent
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { messageId, status: 'sent' }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { messageId, status: 'failed' }
      });
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [socket, state.activeConversation, toast]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!socket || !state.activeConversation?.id) return;

    const conversationId = state.activeConversation.id;
    const timeoutKey = `typing:${conversationId}`;

    if (typingTimeoutRef.current[timeoutKey]) {
      clearTimeout(typingTimeoutRef.current[timeoutKey]);
    }

    socket.emit('chat:typing', {
      conversationId,
      isTyping
    });

    if (isTyping) {
      typingTimeoutRef.current[timeoutKey] = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, [socket, state.activeConversation]);

  const editMessage = async (messageId: string, content: string) => {
    if (!workspace) return;
    try {
      // Optimistic update
      dispatch({ type: 'EDIT_MESSAGE', payload: { id: messageId, content } });

      const response = await fetch(
        `/api/workspaces/${workspace.id}/conversations/${state.activeConversation?.id}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to edit message. Please try again.',
        variant: 'destructive',
      });
      // TODO: Revert optimistic update
    }
  };

  const createThread = async (messageId: string, content: string) => {
    try {
      // Replace with actual API call
      const thread: Thread = {
        id: Math.random().toString(),
        messageId,
        parentMessageId: messageId,
        messages: [],
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_THREAD', payload: { threadId: thread.id, thread } });
      dispatch({ type: 'SET_ACTIVE_THREAD', payload: thread.id });

      return thread;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create thread',
      });
      throw error;
    }
  };

  const loadMoreMessages = useCallback(async () => {
    if (!workspace || !state.hasMoreMessages || !state.activeConversation?.id) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/conversations/${state.activeConversation.id}/messages?` +
          new URLSearchParams({
            cursor: state.messages[0]?.id,
            limit: state.pageSize.toString(),
          })
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      
      dispatch({
        type: 'ADD_MESSAGES',
        payload: {
          messages: data.data.messages,
          hasMore: !!data.data.nextCursor,
        },
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more messages. Please try again.',
        variant: 'destructive',
      });
    }
  }, [state.hasMoreMessages, state.activeConversation?.id, state.messages, state.pageSize, workspace?.id]);

  const handleFileUpload = async (files: File[]): Promise<void> => {
    try {
      for (const file of files) {
        const chatFile = await fileManager.uploadFile(file);
        
        // Update upload progress
        dispatch({
          type: 'SET_UPLOAD_PROGRESS',
          payload: { fileId: chatFile.id, progress: chatFile.progress || 0 },
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const value: ChatContextType = {
    state,
    dispatch,
    sendMessage,
    setTyping,
    editMessage,
    createThread,
    loadMoreMessages,
    handleFileUpload,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 