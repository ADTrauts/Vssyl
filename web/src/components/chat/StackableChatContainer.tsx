'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Conversation, Message } from 'shared/types/chat';
import { useChat } from '../../contexts/ChatContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from 'shared/components';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { chatAPI } from '../../api/chat';

interface ChatWindowState {
  activeChat: Conversation | null;
  minimizedChats: Conversation[];
  isSidebarOpen: boolean;
  sidebarWidth: 'thin' | 'expanded';
  searchQuery: string;
  selectedDashboardId: string | null;
  isDocked: boolean;
  isDockedExpanded: boolean;
}

const StackableChatContainer: React.FC = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const { 
    currentDashboardId,
    allDashboards,
    dashboards,
    getDashboardType,
    getDashboardDisplayName,
    isModuleActiveOnDashboard
  } = useDashboard();
  
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
    // We just need to filter out any invalid dashboards
    const filtered = allDashboardsIncludingBusiness.filter(d => {
      // All dashboards have chat available - it's a core module
      return !!d.id;
    });
    
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
    setDashboardOverride,
    clearDashboardOverride,
    loadMessages,
  } = useChat();
  const { trashItem } = useGlobalTrash();

  // Local state for chat window management
  const [chatState, setChatState] = useState<ChatWindowState>({
    activeChat: null,
    minimizedChats: [],
    isSidebarOpen: true,
    sidebarWidth: 'expanded',
    searchQuery: '',
    selectedDashboardId: null,
    isDocked: true, // Use docked mode by default
    isDockedExpanded: false
  });
  
  const [dashboardUnreadCounts, setDashboardUnreadCounts] = useState<Record<string, number>>({});
  const unreadPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pendingMessageIdToTrash, setPendingMessageIdToTrash] = useState<string | null>(null);
  const [isMovingMessageToTrash, setIsMovingMessageToTrash] = useState(false);

  // Initialize selected dashboard to first personal dashboard
  useEffect(() => {
    if (chatDashboards.length > 0 && !chatState.selectedDashboardId) {
      const firstPersonal = chatDashboards.find(d => getDashboardType(d) === 'personal');
      if (firstPersonal) {
        setChatState(prev => ({ ...prev, selectedDashboardId: firstPersonal.id }));
        setDashboardOverride(firstPersonal.id);
      }
    }
  }, [chatDashboards, chatState.selectedDashboardId, getDashboardType, setDashboardOverride]);
  
  // Calculate unread counts per dashboard (stops polling on 403 to avoid log spam after session expiry)
  useEffect(() => {
    const calculateUnreadCounts = async () => {
      if (!session?.accessToken || chatDashboards.length === 0) return;

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
      setChatState(prev => ({ ...prev, selectedDashboardId: dashboardId }));
    } else {
      clearDashboardOverride();
      setChatState(prev => ({ ...prev, selectedDashboardId: null }));
    }
  };

  // Don't render if user is not authenticated or on auth pages
  if (status === 'loading' || status === 'unauthenticated' || !session) {
    return null;
  }

  // Don't render on authentication pages
  if (pathname?.startsWith('/auth/') || pathname === '/auth' || pathname === '/login') {
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

  // Toggle docked expanded state
  const toggleDockedExpanded = () => {
    setChatState(prev => ({
      ...prev,
      isDockedExpanded: !prev.isDockedExpanded
    }));
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

      if (chatState.activeChat?.id) {
        await loadMessages(chatState.activeChat.id);
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

  // Filter conversations by selected dashboard and search query
  const getFilteredConversations = () => {
    // Conversations are already filtered by effectiveDashboardId in ChatContext
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

    return filtered;
  };

  // Calculate position for minimized chat bubbles (to the left of messaging panel)
  const getMinimizedChatPosition = (index: number) => ({
    x: 20 + (index * 10),
    y: 20 + (index * 10)
  });

  const filteredConversations = getFilteredConversations();

  return (
    <>
      {/* Docked Chat Sidebar */}
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
        selectedDashboardId={chatState.selectedDashboardId}
        currentDashboardId={currentDashboardId}
        chatDashboards={chatDashboards as unknown as Array<{ id: string; [key: string]: unknown }>}
        dashboardUnreadCounts={dashboardUnreadCounts}
        onDashboardTabClick={handleDashboardTabClick}
        getDashboardType={getDashboardType as unknown as (dashboard: { id: string; [key: string]: unknown }) => string}
        getDashboardDisplayName={getDashboardDisplayName as unknown as (dashboard: { id: string; [key: string]: unknown }) => string}
        isDocked={chatState.isDocked}
        isExpanded={chatState.isDockedExpanded}
        onToggleExpanded={toggleDockedExpanded}
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
          onDeleteMessage={requestDeleteMessage}
          onAddReaction={handleAddReaction}
          onRemoveReaction={handleRemoveReaction}
          isLoading={isLoading}
          sidebarWidth={chatState.sidebarWidth}
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
    </>
  );
};

export default StackableChatContainer;
