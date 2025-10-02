'use client';

import React, { useState } from 'react';
import { Button, Avatar, Badge } from 'shared/components';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Hash,
  Lock,
  Users,
  Settings
} from 'lucide-react';

interface ChatSidebarProps {
  onNewConversation: (type: 'DIRECT' | 'GROUP' | 'CHANNEL', participantIds: string[], name?: string) => void;
  onContextSwitch: (dashboardId: string) => void;
}

function ChatSidebar({ onNewConversation, onContextSwitch }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationMenu, setShowNewConversationMenu] = useState(false);

  // Mock conversations for demonstration
  const conversations = [
    {
      id: '1',
      name: 'general',
      type: 'channel' as const,
      unreadCount: 3,
      lastMessage: 'Great work on the Q4 report!',
      lastMessageTime: '2024-01-15T10:30:00Z',
      isPrivate: false
    },
    {
      id: '2',
      name: 'marketing-team',
      type: 'channel' as const,
      unreadCount: 0,
      lastMessage: 'Campaign launch scheduled for next week',
      lastMessageTime: '2024-01-15T09:15:00Z',
      isPrivate: true
    },
    {
      id: '3',
      name: 'John Doe',
      type: 'direct' as const,
      unreadCount: 1,
      lastMessage: 'Can you review the budget proposal?',
      lastMessageTime: '2024-01-15T08:45:00Z',
      isPrivate: false
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewConversation = (type: 'DIRECT' | 'GROUP' | 'CHANNEL') => {
    if (type === 'DIRECT') {
      // For direct messages, we'd need to show a user picker
      // For now, just create with empty participant list
      onNewConversation(type, [], undefined);
    } else {
      // For groups and channels, prompt for name
      const name = prompt(`Enter ${type.toLowerCase()} name:`);
      if (name) {
        onNewConversation(type, [], name);
      }
    }
    setShowNewConversationMenu(false);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewConversationMenu(!showNewConversationMenu)}
              className="p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            {/* New Conversation Menu */}
            {showNewConversationMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                <button
                  onClick={() => handleNewConversation('DIRECT')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>New Direct Message</span>
                </button>
                <button
                  onClick={() => handleNewConversation('GROUP')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>New Group</span>
                </button>
                <button
                  onClick={() => handleNewConversation('CHANNEL')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Hash className="w-4 h-4" />
                  <span>New Channel</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {conversation.type === 'direct' ? (
                  <Avatar size={32} nameOrEmail={conversation.name} />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    {conversation.isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Hash className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conversation.type === 'direct' ? conversation.name : `#${conversation.name}`}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <Badge color="blue" className="text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {conversation.lastMessage}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conversation.lastMessageTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}

export default ChatSidebar;
