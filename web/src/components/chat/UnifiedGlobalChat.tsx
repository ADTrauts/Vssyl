'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Conversation, Message, Thread } from 'shared/types/chat';
import { Button, Avatar, Badge, Spinner, ContextMenu, ContextMenuItem, ConfirmModal } from 'shared/components';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { 
  MessageSquare, 
  Send, 
  Smile, 
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
import { useChat } from '../../contexts/ChatContext';
import { toast } from 'react-hot-toast';
import { chatAPI } from '../../api/chat';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  isOwn: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReply: (message: any) => void;
  onDelete: (messageId: string) => void;
  formatTime: (timestamp: string) => string;
  hasEnterprise: boolean;
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const contextMenuItems = useMemo((): ContextMenuItem[] => [
    {
      icon: <Reply className="w-4 h-4" />,
      label: 'Reply',
      onClick: () => onReply(message),
    },
    { divider: true },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: 'Delete',
      destructive: true,
      onClick: () => onDelete(message.id),
    },
  ], [message, onReply, onDelete]);

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
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {message.sender?.name || message.sender?.email}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.createdAt || message.timestamp)}
          </span>
          {hasEnterprise && message.encrypted && (
            <Key className="w-3 h-3 text-green-500" />
          )}
        </div>
        
        <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 max-w-md">
          <p className="text-sm text-gray-900 dark:text-gray-100">{message.content}</p>
        </div>
      </div>

      <ContextMenu
        open={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        anchorPoint={contextMenuPosition}
        items={contextMenuItems}
        menuLabel="Message actions"
      />
    </div>
  );
});

UnifiedGlobalChatMessageItem.displayName = 'UnifiedGlobalChatMessageItem';

export default function UnifiedGlobalChat({ className = '' }: UnifiedGlobalChatProps) {
  const { data: session, status } = useSession();
  const { 
    currentDashboard, 
    currentDashboardId,
    allDashboards,
    dashboards,
    getDashboardType,
    getDashboardDisplayName
  } = useDashboard();
  const router = useRouter();
  
  // Merge raw business list with flattened context list; dedupe by id (allDashboards now includes business)
  const allDashboardsIncludingBusiness = useMemo(() => {
    const businessDashboards = dashboards.business || [];
    const combined = [...allDashboards, ...businessDashboards];
    const seen = new Set<string>();
    return combined.filter(d => {
      if (!d?.id) return false;
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [allDashboards, dashboards.business]);
  
  // Get dashboards with chat enabled, sorted: personal first, then business
  // NOTE: Chat is a core module that's always available - we don't need to check for widgets
  const chatDashboards = useMemo(() => {
    // Chat is always available on all dashboards - it's a core module
    const filtered = allDashboardsIncludingBusiness.filter(d => !!d.id);
    
    // Sort: personal first, then by type (business, educational, household)
    return filtered.sort((a, b) => {
      const typeA = getDashboardType(a);
      const typeB = getDashboardType(b);
      
      // Personal always first
      if (typeA === 'personal' && typeB !== 'personal') return -1;
      if (typeA !== 'personal' && typeB === 'personal') return 1;
      
      // Within same type, maintain original order
      return 0;
    });
  }, [allDashboardsIncludingBusiness, getDashboardType]);
  
  // Get business ID for enterprise feature checking (based on selected dashboard)
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const effectiveDashboardId = selectedDashboardId || currentDashboardId;
  const selectedDashboard = effectiveDashboardId 
    ? chatDashboards.find(d => d.id === effectiveDashboardId) || currentDashboard
    : currentDashboard;
  
  const dashboardType = selectedDashboard ? getDashboardType(selectedDashboard) : 'personal';
  const businessId = dashboardType === 'business' ? (selectedDashboard as any)?.business?.id : undefined;
  
  // Check enterprise features
  const { hasBusiness: hasEnterprise } = useModuleFeatures('chat', businessId);
  
  // Use shared ChatContext for data - THIS IS KEY FOR REAL-TIME SYNC!
  const {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isConnected,
    isLoading,
    setActiveConversation: setActiveConversationInContext,
    sendMessage: sendMessageViaContext,
    replyToMessage,
    setReplyToMessage,
    setDashboardOverride,
    clearDashboardOverride,
    loadMessages,
  } = useChat();
  const { trashItem } = useGlobalTrash();
  
  // UI state (local only)
  const [isMinimized, setIsMinimized] = useState(true);
  const [chatSize, setChatSize] = useState<'small' | 'medium' | 'large'>('small');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardUnreadCounts, setDashboardUnreadCounts] = useState<Record<string, number>>({});
  const unreadPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingMessageIdToTrash, setPendingMessageIdToTrash] = useState<string | null>(null);
  const [isMovingMessageToTrash, setIsMovingMessageToTrash] = useState(false);
  
  // Initialize selected dashboard to first personal dashboard
  useEffect(() => {
    if (chatDashboards.length > 0 && !selectedDashboardId) {
      const firstPersonal = chatDashboards.find(d => getDashboardType(d) === 'personal');
      if (firstPersonal) {
        setSelectedDashboardId(firstPersonal.id);
        setDashboardOverride(firstPersonal.id);
      }
    }
  }, [chatDashboards, selectedDashboardId, getDashboardType, setDashboardOverride]);
  
  // Calculate unread counts per dashboard (stops polling on 403 to avoid log spam after session expiry)
  useEffect(() => {
    const calculateUnreadCounts = async () => {
      if (!session?.accessToken) return;

      const counts: Record<string, number> = {};

      for (const dashboard of chatDashboards) {
        try {
          const response = await chatAPI.getConversations(session.accessToken, dashboard.id);
          const dashboardConversations = Array.isArray(response) ? response : [];

          const unread = dashboardConversations.reduce((count, conv) => {
            const unreadMessages = conv.messages?.filter((msg: any) =>
              msg.senderId !== session.user?.id &&
              !msg.readReceipts?.some((receipt: any) => receipt.userId === session.user?.id)
            ).length || 0;
            return count + unreadMessages;
          }, 0);

          counts[dashboard.id] = unread;
        } catch (error) {
          const status = (error as Error & { status?: number }).status;
          if (status === 403) {
            if (unreadPollIntervalRef.current) {
              clearInterval(unreadPollIntervalRef.current);
              unreadPollIntervalRef.current = null;
            }
            return;
          }
          console.error(`Failed to load conversations for dashboard ${dashboard.id}:`, error);
          counts[dashboard.id] = 0;
        }
      }

      setDashboardUnreadCounts(counts);
    };

    calculateUnreadCounts();
    const interval = setInterval(calculateUnreadCounts, 30000);
    unreadPollIntervalRef.current = interval;

    return () => {
      if (unreadPollIntervalRef.current) {
        clearInterval(unreadPollIntervalRef.current);
        unreadPollIntervalRef.current = null;
      }
    };
  }, [chatDashboards, session?.accessToken, session?.user?.id]);
  
  // Handle dashboard tab click
  const handleDashboardTabClick = (dashboardId: string | null) => {
    if (dashboardId) {
      setDashboardOverride(dashboardId);
      setSelectedDashboardId(dashboardId);
    } else {
      clearDashboardOverride();
      setSelectedDashboardId(null);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwnMessage = (message: any): boolean => {
    return message.senderId === session?.user?.id || message.sender?.id === session?.user?.id;
  };

  const handleSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    if (newSize === 'large') {
      // Redirect to chat page for large size
      router.push('/chat');
    } else {
      setChatSize(newSize);
      setIsMinimized(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      // Use ChatContext sendMessage - this automatically updates both global and main chat!
      await sendMessageViaContext(newMessage.trim());
      setNewMessage('');
      toast.success('Message sent');
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReply = (message: any) => {
    setReplyToMessage(message);
  };

  const requestDeleteMessage = (messageId: string) => {
    setPendingMessageIdToTrash(messageId);
  };

  const executeDeleteMessage = async () => {
    const messageId = pendingMessageIdToTrash;
    if (!messageId) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) {
      toast.error('Message not found');
      setPendingMessageIdToTrash(null);
      return;
    }

    setIsMovingMessageToTrash(true);
    try {
      const name =
        message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content;

      await trashItem({
        id: message.id,
        name,
        type: 'message',
        moduleId: 'chat',
        moduleName: 'Chat',
        metadata: {
          conversationId: message.conversationId,
          senderId: message.senderId,
        },
      });

      if (activeConversation?.id) {
        await loadMessages(activeConversation.id);
      }

      toast.success('Message moved to trash');
      setPendingMessageIdToTrash(null);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to delete message');
      console.error('Failed to delete message:', { message: err.message, stack: err.stack });
      toast.error('Failed to move message to trash');
    } finally {
      setIsMovingMessageToTrash(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConversationSelect = (conversation: any) => {
    // Use ChatContext to set active conversation - syncs with main chat!
    setActiveConversationInContext(conversation);
  };

  // Filter conversations by selected dashboard AND search query
  const filteredConversations = conversations.filter(conv => {
    // Filter by dashboard - conversations belong to the selected dashboard
    // This is handled by ChatContext's effectiveDashboardId, but we can also filter client-side
    // The conversations from ChatContext are already filtered by effectiveDashboardId
    
    // Then filter by search query
    if (searchQuery.trim()) {
      return conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participants?.some((p: Record<string, any>) => 
          p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return true;
  });

  if (status === 'loading') {
    return (
      <div className={`fixed bottom-0 right-12 z-50 ${className}`}>
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-t-lg shadow-xl w-80 h-12 flex items-center justify-center">
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
        isMinimized ? 'w-80 h-12' : 
        chatSize === 'small' ? 'w-80 h-[300px]' :
        chatSize === 'medium' ? 'w-96 h-[400px]' :
        'w-[600px] h-[500px]'
      }`}>
        {/* Header */}
        <div className="flex flex-col border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-lg">
          {/* Top Row: Avatar, Status, Controls */}
          <div className="flex items-center justify-between p-3">
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
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Messaging
                  {hasEnterprise && (
                    <span className="ml-2 text-xs text-purple-600">Enterprise</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
              {/* Size controls */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSizeChange('small')}
                  className={`p-1 ${chatSize === 'small' ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Small"
                >
                  <div className="w-3 h-3 border border-current rounded"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSizeChange('medium')}
                  className={`p-1 ${chatSize === 'medium' ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Medium"
                >
                  <div className="w-4 h-3 border border-current rounded"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSizeChange('large')}
                  className={`p-1 ${chatSize === 'large' ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Large (Go to Chat Page)"
                >
                  <div className="w-5 h-3 border border-current rounded"></div>
                </Button>
              </div>
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
          
          {/* Dashboard Tabs Row */}
          {chatDashboards.length > 0 && (
            <div className="px-3 pb-2 border-t border-gray-100">
              <div 
                className="flex items-center space-x-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {chatDashboards.map((dashboard) => {
                  const isActive = effectiveDashboardId === dashboard.id;
                  const dashboardType = getDashboardType(dashboard);
                  const displayName = getDashboardDisplayName(dashboard);
                  const unreadCount = dashboardUnreadCounts[dashboard.id] || 0;
                  const isBusiness = dashboardType === 'business';
                  
                  return (
                    <button
                      key={dashboard.id}
                      onClick={() => handleDashboardTabClick(dashboard.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={displayName}
                    >
                      <span className="truncate max-w-[100px]">{displayName}</span>
                      {isBusiness && hasEnterprise && (
                        <Shield className="w-3 h-3 flex-shrink-0" />
                      )}
                      {unreadCount > 0 && (
                        <span 
                          className={`text-xs flex-shrink-0 px-1.5 py-0.5 rounded-full font-medium ${
                            isActive 
                              ? 'bg-white/20 text-white border border-white/30' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex h-[calc(100%-100px)]">
            {/* Left Panel - Conversations */}
            <div className="w-64 border-r border-gray-200 dark:border-slate-700 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={`Search conversations...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedDashboard 
                        ? `No conversations in ${getDashboardDisplayName(selectedDashboard)} yet`
                        : 'No conversations yet'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isWorkConversation = !!(conversation as any).businessId;
                    
                    return (
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
                            <div className="flex items-center space-x-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {conversation.name || 'Direct Message'}
                              </p>
                              {/* Enterprise indicators for work conversations */}
                              {isWorkConversation && hasEnterprise && (
                                <div className="flex items-center space-x-0.5" title="Enterprise Chat">
                                  <Shield className="w-3 h-3 text-purple-500" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {conversation.participants?.length || 0} participant{(conversation.participants?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
                          onDelete={requestDeleteMessage}
                          formatTime={formatTime}
                          hasEnterprise={hasEnterprise}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
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
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a conversation</h3>
                    <p className="text-gray-600 dark:text-gray-400">Choose a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingMessageIdToTrash !== null}
        onClose={() => setPendingMessageIdToTrash(null)}
        onConfirm={executeDeleteMessage}
        title="Move to trash?"
        description="Are you sure you want to move this message to trash?"
        variant="destructive"
        confirmLabel="Move to trash"
        loading={isMovingMessageToTrash}
      />
    </div>
  );
}
