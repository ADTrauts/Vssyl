'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { Conversation, Message, Thread } from 'shared/types/chat';
import { Button, Avatar, Badge, Spinner } from 'shared/components';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  MoreHorizontal, 
  Reply, 
  X, 
  Hash,
  ChevronUp,
  ExternalLink,
  Search,
  Trash2,
  Shield,
  Key,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useFeatureGating, useModuleFeatures } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import { toast } from 'react-hot-toast';

interface UnifiedGlobalChatProps {
  className?: string;
}

// Simplified Message Item Component
const UnifiedGlobalChatMessageItem = React.memo(({
  message,
  isOwn,
  onReply,
  onDelete,
  formatTime,
  hasEnterprise
}: {
  message: any;
  isOwn: boolean;
  onReply: (message: any) => void;
  onDelete: (messageId: string) => void;
  formatTime: (timestamp: string) => string;
  hasEnterprise: boolean;
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleDelete = () => {
    onDelete(message.id);
    setShowContextMenu(false);
  };

  const handleReply = () => {
    onReply(message);
    setShowContextMenu(false);
  };

  return (
    <div
      className={`flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg group`}
      onContextMenu={handleContextMenu}
    >
      <Avatar 
        src={message.sender?.avatar} 
        nameOrEmail={message.sender?.name || message.sender?.email}
        size={32}
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {message.sender?.name || message.sender?.email}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt || message.timestamp)}
          </span>
          {hasEnterprise && message.encrypted && (
            <Key className="w-3 h-3 text-green-500" />
          )}
        </div>
        
        <div className="bg-gray-100 rounded-lg p-3 max-w-md">
          <p className="text-sm text-gray-900">{message.content}</p>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div className="absolute right-2 top-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32">
          <button
            onClick={handleReply}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
});

UnifiedGlobalChatMessageItem.displayName = 'UnifiedGlobalChatMessageItem';

export default function UnifiedGlobalChat({ className = '' }: UnifiedGlobalChatProps) {
  const { data: session, status } = useSession();
  const { currentDashboard, getDashboardType } = useDashboard();
  
  // Get business ID for enterprise feature checking
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Check enterprise features
  const { hasBusiness: hasEnterprise } = useModuleFeatures('chat', businessId);
  
  // State management
  const [isMinimized, setIsMinimized] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true); // Set to true by default for now
  const [isLoading, setIsLoading] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with fallback data
  useEffect(() => {
    if (conversations.length === 0) {
      const fallbackConversations = [
        {
          id: '1',
          name: 'General Chat',
          type: 'channel',
          unreadCount: 0,
          lastMessage: 'Welcome to the global chat!',
          lastMessageTime: new Date().toISOString(),
          members: []
        }
      ];
      setConversations(fallbackConversations);
      setActiveConversation(fallbackConversations[0]);
    }
  }, [conversations.length]);

  // Initialize with fallback messages
  useEffect(() => {
    if (activeConversation && messages.length === 0) {
      const fallbackMessages = [
        {
          id: '1',
          content: 'Welcome to the global chat! You can send messages here.',
          sender: {
            id: 'system',
            name: 'System',
            role: 'System'
          },
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      ];
      setMessages(fallbackMessages);
    }
  }, [activeConversation, messages.length]);

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (message: any): boolean => {
    return message.senderId === session?.user?.id || message.sender?.id === session?.user?.id;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      // Get access token from session using NextAuth
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No access token found');
      }

      // Call real API to send message
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: newMessage.trim(),
          type: 'TEXT'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add message to local state
      const newMessageData = {
        id: data.message.id,
        content: data.message.content,
        sender: data.message.sender,
        createdAt: data.message.createdAt,
        encrypted: hasEnterprise && data.message.encrypted
      };

      setMessages(prev => [...prev, newMessageData]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReply = (message: any) => {
    setReplyToMessage(message);
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Handle message deletion logic here
    console.log('Deleting message:', messageId);
  };

  const handleConversationSelect = (conversation: any) => {
    setActiveConversation(conversation);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants?.some((p: any) => 
      p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (status === 'loading') {
    return (
      <div className={`fixed bottom-0 right-12 z-50 ${className}`}>
        <div className="bg-white border border-gray-200 rounded-t-lg shadow-xl w-80 h-12 flex items-center justify-center">
          <Spinner size={20} />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={`fixed bottom-0 right-12 z-50 ${className}`}>
      <div className={`bg-white border border-gray-200 rounded-t-lg shadow-xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-12' : isExpanded ? 'w-[600px] h-[600px]' : 'w-80 h-[500px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar 
                src={session?.user?.image || undefined} 
                nameOrEmail={session?.user?.name || session?.user?.email || 'User'}
                size={32}
                className="w-8 h-8"
              />
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Messaging
                {hasEnterprise && (
                  <span className="ml-2 text-xs text-purple-600">Enterprise</span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge color="blue" className="text-xs">
                {unreadCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex h-[calc(100%-60px)]">
            {/* Left Panel - Conversations */}
            <div className="w-64 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-200">
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

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        size={32} 
                        nameOrEmail={conversation.name || conversation.participants[0]?.user.name || 'Chat'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.name || 'Direct Message'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conversation.participants?.length || 0} participant{(conversation.participants?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Messages */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Spinner size={24} />
                      </div>
                    ) : (
                      messages.map((message) => (
                        <UnifiedGlobalChatMessageItem
                          key={message.id}
                          message={message}
                          isOwn={isOwnMessage(message)}
                          onReply={handleReply}
                          onDelete={handleDeleteMessage}
                          formatTime={formatTime}
                          hasEnterprise={hasEnterprise}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                          rows={1}
                        />
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
