'use client';

import React from 'react';
import { Conversation } from 'shared/types/chat';
import { Avatar, Badge } from 'shared/components';
import { Search, MessageSquare, Filter, ChevronLeft } from 'lucide-react';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeChat: Conversation | null;
  onChatSelect: (conversation: Conversation) => void;
  onToggleSidebar: () => void;
  width: 'thin' | 'expanded';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'focused' | 'other';
  onTabChange: (tab: 'focused' | 'other') => void;
  isDocked?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

interface ChatSidebarItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  isThinMode?: boolean;
}

const ChatSidebarItem: React.FC<ChatSidebarItemProps> = ({
  conversation,
  isActive,
  onClick,
  isThinMode = false
}) => {
  const getOtherParticipant = (conv: Conversation) => {
    if (conv.type === 'DIRECT' && conv.participants.length === 2) {
      return conv.participants.find(p => p.user.id !== conversation.id)?.user;
    }
    return null;
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.type === 'DIRECT' && conv.participants.length === 2) {
      const otherParticipant = conv.participants.find(p => p.user.id !== conv.id);
      return otherParticipant?.user.name || otherParticipant?.user.email || 'Unknown User';
    }
    return `Group Chat (${conv.participants.length} members)`;
  };

  const getLastMessage = (conv: Conversation) => {
    return conv.messages?.[0] || null;
  };

  const hasUnreadMessages = (conv: Conversation) => {
    return conv.messages?.some(msg => 
      msg.senderId !== conv.id && 
      !msg.readReceipts?.some(receipt => receipt.userId === conv.id)
    ) || false;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const otherParticipant = getOtherParticipant(conversation);
  const conversationName = getConversationName(conversation);
  const lastMessage = getLastMessage(conversation);
  const hasUnread = hasUnreadMessages(conversation);

  if (isThinMode) {
    return (
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-full relative transition-all duration-200 ${
          isActive ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
        }`}
        title={conversationName}
      >
        <Avatar 
          src={(otherParticipant as any)?.avatar || undefined} 
          nameOrEmail={conversationName}
          size={48}
          className="w-full h-full"
        />
        {hasUnread && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {conversation.messages?.filter(msg => 
              msg.senderId !== conversation.id && 
              !msg.readReceipts?.some(receipt => receipt.userId === conversation.id)
            ).length || 1}
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg transition-all duration-200 text-left ${
        isActive 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar 
            src={(otherParticipant as any)?.avatar || undefined} 
            nameOrEmail={conversationName}
            size={40}
          />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {conversation.messages?.filter(msg => 
                msg.senderId !== conversation.id && 
                !msg.readReceipts?.some(receipt => receipt.userId === conversation.id)
              ).length || 1}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium truncate ${
              isActive ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {conversationName}
            </h3>
            {lastMessage && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
          
          {lastMessage && (
            <p className={`text-sm truncate mt-1 ${
              hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}>
              {lastMessage.content.length > 50 
                ? `${lastMessage.content.substring(0, 50)}...`
                : lastMessage.content
              }
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeChat,
  onChatSelect,
  onToggleSidebar,
  width,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  isDocked = false,
  isExpanded = false,
  onToggleExpanded
}) => {
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const conversationName = conversation.name || 
      (conversation.type === 'DIRECT' && conversation.participants.length === 2
        ? conversation.participants.find(p => p.user.id !== conversation.id)?.user.name ||
          conversation.participants.find(p => p.user.id !== conversation.id)?.user.email ||
          'Unknown User'
        : `Group Chat (${conversation.participants.length} members)`);
    
    return conversationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.participants?.some(p => 
        p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  });

  // LinkedIn-style docked chat
  if (isDocked) {
    // Minimized docked button
    if (!isExpanded) {
      return (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={onToggleExpanded}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-3 px-4 py-3"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Messaging</span>
            {conversations.some(conv => 
              conv.messages?.some(msg => 
                msg.senderId !== conv.id && 
                !msg.readReceipts?.some(receipt => receipt.userId === conv.id)
              )
            ) && (
              <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {conversations.reduce((total, conv) => 
                  total + (conv.messages?.filter(msg => 
                    msg.senderId !== conv.id && 
                    !msg.readReceipts?.some(receipt => receipt.userId === conv.id)
                  ).length || 0), 0
                )}
              </div>
            )}
          </button>
        </div>
      );
    }

    // Expanded docked panel
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl transition-all duration-300 max-h-96">
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messaging</h2>
            <button
              onClick={onToggleExpanded}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Minimize"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 rotate-90" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => onTabChange('focused')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'focused'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Focused
            </button>
            <button
              onClick={() => onTabChange('other')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'other'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Other
            </button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map(conv => (
                  <ChatSidebarItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeChat?.id === conv.id}
                    onClick={() => onChatSelect(conv)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (width === 'thin') {
    return (
      <div className="fixed right-0 top-16 bg-white border-l border-gray-200 z-30 w-16 transition-all duration-300" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="p-2 space-y-2">
          <button
            onClick={onToggleSidebar}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </button>
          
          {filteredConversations.map(conv => (
            <ChatSidebarItem
              key={conv.id}
              conversation={conv}
              isActive={activeChat?.id === conv.id}
              onClick={() => onChatSelect(conv)}
              isThinMode={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 h-full bg-white border-l border-gray-200 z-30 w-80 transition-all duration-300">
      <div className="p-4 h-full flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messaging</h2>
          <button
            onClick={onToggleSidebar}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => onTabChange('focused')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'focused'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Focused
          </button>
          <button
            onClick={() => onTabChange('other')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'other'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Other
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map(conv => (
                <ChatSidebarItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeChat?.id === conv.id}
                  onClick={() => onChatSelect(conv)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;