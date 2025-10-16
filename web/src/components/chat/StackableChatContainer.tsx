'use client';

import React, { useState, useEffect } from 'react';
import { Conversation, Message } from 'shared/types/chat';
import { useChat } from '../../contexts/ChatContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

interface ChatWindowState {
  activeChat: Conversation | null;
  minimizedChats: Conversation[];
  isSidebarOpen: boolean;
  sidebarWidth: 'thin' | 'expanded';
  searchQuery: string;
  activeTab: 'focused' | 'other';
}

const StackableChatContainer: React.FC = () => {
  const { data: session, status } = useSession();
  
  // Use shared ChatContext for data
  const {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isConnected,
    isLoading,
    setActiveConversation: setActiveConversationInContext,
    sendMessage: sendMessageViaContext,
    addReaction,
    removeReaction,
  } = useChat();

  // Local state for chat window management
  const [chatState, setChatState] = useState<ChatWindowState>({
    activeChat: null,
    minimizedChats: [],
    isSidebarOpen: true,
    sidebarWidth: 'expanded',
    searchQuery: '',
    activeTab: 'focused'
  });

  // Don't render if user is not authenticated
  if (status === 'loading' || status === 'unauthenticated' || !session) {
    return null;
  }

  // Open a chat (main window)
  const openChat = (conversation: Conversation) => {
    setChatState(prev => {
      const newState = { ...prev };
      
      // If there's an active chat, minimize it
      if (prev.activeChat && prev.activeChat.id !== conversation.id) {
        newState.minimizedChats = [prev.activeChat, ...prev.minimizedChats];
      }
      
      // Set new active chat
      newState.activeChat = conversation;
      
      return newState;
    });

    // Update the global ChatContext
    setActiveConversationInContext(conversation);
  };

  // Minimize the active chat
  const minimizeChat = () => {
    if (!chatState.activeChat) return;
    
    setChatState(prev => ({
      ...prev,
      activeChat: null,
      minimizedChats: [prev.activeChat!, ...prev.minimizedChats]
    }));

    // Clear active conversation in context
    setActiveConversationInContext(null);
  };

  // Restore a chat from minimized stack
  const restoreChat = (conversation: Conversation) => {
    setChatState(prev => {
      // Remove from minimized stack
      const updatedMinimized = prev.minimizedChats.filter(c => c.id !== conversation.id);
      
      // If there's an active chat, minimize it
      const newMinimized = prev.activeChat 
        ? [prev.activeChat, ...updatedMinimized]
        : updatedMinimized;
      
      return {
        ...prev,
        activeChat: conversation,
        minimizedChats: newMinimized
      };
    });

    // Update the global ChatContext
    setActiveConversationInContext(conversation);
  };

  // Close a chat completely
  const closeChat = (conversation: Conversation) => {
    setChatState(prev => ({
      ...prev,
      activeChat: prev.activeChat?.id === conversation.id ? null : prev.activeChat,
      minimizedChats: prev.minimizedChats.filter(c => c.id !== conversation.id)
    }));

    // If this was the active chat, clear it in context
    if (chatState.activeChat?.id === conversation.id) {
      setActiveConversationInContext(null);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!chatState.activeChat) return;

    try {
      await sendMessageViaContext(content);
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    try {
      // TODO: Implement message deletion
      console.log('Deleting message:', messageId);
      toast('Message deletion coming soon', { icon: 'ℹ️' });
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Handle reactions
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await removeReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      toast.error('Failed to remove reaction');
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    // This would be handled by the ChatWindow component
    console.log('Replying to message:', message.id);
  };

  // Filter conversations by tab (focused vs other)
  const getFilteredConversations = () => {
    let filtered = conversations;

    // Filter by search query
    if (chatState.searchQuery) {
      filtered = filtered.filter(conversation => {
        const conversationName = conversation.name || 
          (conversation.type === 'DIRECT' && conversation.participants.length === 2
            ? conversation.participants.find(p => p.user.id !== conversation.id)?.user.name ||
              conversation.participants.find(p => p.user.id !== conversation.id)?.user.email ||
              'Unknown User'
            : `Group Chat (${conversation.participants.length} members)`);
        
        return conversationName.toLowerCase().includes(chatState.searchQuery.toLowerCase()) ||
          conversation.participants?.some(p => 
            p.user?.name?.toLowerCase().includes(chatState.searchQuery.toLowerCase()) ||
            p.user?.email?.toLowerCase().includes(chatState.searchQuery.toLowerCase())
          );
      });
    }

    // For now, all conversations are "focused"
    // TODO: Implement proper focused/other logic based on user preferences
    return filtered;
  };

  // Calculate position for minimized chat bubbles
  const getMinimizedChatPosition = (index: number) => ({
    x: 20 + (index * 10),
    y: 20 + (index * 10)
  });

  const filteredConversations = getFilteredConversations();

  return (
    <>
      {/* Sidebar */}
      <ChatSidebar
        conversations={filteredConversations}
        activeChat={chatState.activeChat}
        onChatSelect={openChat}
        onToggleSidebar={() => setChatState(prev => ({
          ...prev,
          sidebarWidth: prev.sidebarWidth === 'thin' ? 'expanded' : 'thin'
        }))}
        width={chatState.sidebarWidth}
        searchQuery={chatState.searchQuery}
        onSearchChange={(query) => setChatState(prev => ({ ...prev, searchQuery: query }))}
        activeTab={chatState.activeTab}
        onTabChange={(tab) => setChatState(prev => ({ ...prev, activeTab: tab }))}
      />

      {/* Active Chat Window */}
      {chatState.activeChat && (
        <ChatWindow
          conversation={chatState.activeChat}
          isMinimized={false}
          onMinimize={minimizeChat}
          onRestore={() => {}} // Not needed for active chat
          onClose={() => closeChat(chatState.activeChat!)}
          messages={messages}
          onSendMessage={handleSendMessage}
          onReplyToMessage={handleReplyToMessage}
          onDeleteMessage={handleDeleteMessage}
          onAddReaction={handleAddReaction}
          onRemoveReaction={handleRemoveReaction}
          isLoading={isLoading}
        />
      )}

      {/* Minimized Chat Bubbles */}
      {chatState.minimizedChats.map((conversation, index) => (
        <ChatWindow
          key={conversation.id}
          conversation={conversation}
          isMinimized={true}
          onMinimize={() => {}} // Not needed for minimized
          onRestore={() => restoreChat(conversation)}
          onClose={() => closeChat(conversation)}
          position={getMinimizedChatPosition(index)}
          messages={[]} // Don't load messages for minimized chats
          onSendMessage={() => {}} // Not applicable for minimized
          onReplyToMessage={() => {}} // Not applicable for minimized
          onDeleteMessage={() => {}} // Not applicable for minimized
          onAddReaction={() => {}} // Not applicable for minimized
          onRemoveReaction={() => {}} // Not applicable for minimized
        />
      ))}
    </>
  );
};

export default StackableChatContainer;
