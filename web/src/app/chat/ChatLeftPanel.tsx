'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Conversation } from 'shared/types/chat';
import { getConversations, createConversation } from '../../api/chat';
import { Button, Input, Avatar, Badge, Modal } from 'shared/components';
import { Search, Plus, MoreVertical, MessageCircle, Users } from 'lucide-react';
import UserAutocomplete from './UserAutocomplete';
import { ChatUser } from 'shared/types/chat';
import { useDashboard } from '../../contexts/DashboardContext';
import { useChat } from '../../contexts/ChatContext';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { useModuleFeatures } from '../../hooks/useFeatureGating';
import { toast } from 'react-hot-toast';

interface ChatLeftPanelProps {
  panelState: {
    activeConversationId: string | null;
    searchQuery: string;
    activeFilters: string[];
    expandedTeams: string[];
    leftPanelCollapsed: boolean;
  };
  onToggleCollapse: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  onSearchQueryChange: (query: string) => void;
  onFiltersChange: (filters: string[]) => void;
  onTeamToggle: (teamId: string) => void;
}

export default function ChatLeftPanel({ 
  panelState, 
  onToggleCollapse,
  onConversationSelect,
  onSearchQueryChange,
  onFiltersChange,
  onTeamToggle
}: ChatLeftPanelProps) {
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType, currentDashboardId } = useDashboard();
  const { conversations, setActiveConversation, createConversation: createConversationFromContext } = useChat();
  const { trashItem } = useGlobalTrash();
  
  // Enterprise feature gating
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  const { hasBusiness: hasEnterprise } = useModuleFeatures('chat', businessId);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!session?.accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Auto-select first conversation if none is selected
      if (conversations && conversations.length > 0 && !panelState.activeConversationId) {
        const firstConversation = conversations[0];
        onConversationSelect(firstConversation);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, conversations, panelState.activeConversationId, onConversationSelect]);

  // Create new conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      setNewChatError('Please select at least one user');
      return;
    }

    setIsCreatingChat(true);
    setNewChatError(null);

    try {
      const participantIds = selectedUsers.map(user => user.id);
      const conversationType = participantIds.length === 1 ? 'DIRECT' : 'GROUP';
      const conversationName = participantIds.length === 1 
        ? selectedUsers[0].name || selectedUsers[0].email
        : newChatName || undefined;

      const newConversation = await createConversationFromContext(
        conversationType,
        participantIds,
        conversationName
      );

      // Select the new conversation
      onConversationSelect(newConversation);
      setActiveConversation(newConversation);

      // Close modal and clear form
      setShowNewChatModal(false);
      setNewChatName('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setNewChatError('Failed to create conversation');
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!panelState.searchQuery) return true;
    
    const searchLower = panelState.searchQuery.toLowerCase();
    
    // Search in conversation name
    if (conversation.name?.toLowerCase().includes(searchLower)) return true;
    
    // Search in participant names
    if (conversation.participants?.some(participant => 
      participant.user?.name?.toLowerCase().includes(searchLower) ||
      participant.user?.email?.toLowerCase().includes(searchLower)
    )) return true;
    
    // Search in last message content
    if (conversation.messages?.some(message => 
      message.content?.toLowerCase().includes(searchLower)
    )) return true;
    
    return false;
  });

  // Get conversation name
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== session?.user?.email
      );
      return otherParticipant?.user?.name || otherParticipant?.user?.email || 'Direct Message';
    }
    
    return `${conversation.type.charAt(0) + conversation.type.slice(1).toLowerCase()} Chat`;
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== session?.user?.email
      );
      return otherParticipant?.user?.name || otherParticipant?.user?.email;
    }
    
    return conversation.name || 'Group';
  };

  // Get other participant for direct conversations
  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      return conversation.participants.find(
        p => p.userId !== session?.user?.email
      )?.user;
    }
    return null;
  };

  // Get last message
  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return null;
    }
    return conversation.messages[conversation.messages.length - 1];
  };

  // Check if conversation has unread messages
  const hasUnreadMessages = (conversation: Conversation) => {
    if (!conversation.messages) return false;
    
    return conversation.messages.some(message => 
      message.senderId !== session?.user?.id && 
      !message.readReceipts?.some(receipt => receipt.userId === session?.user?.id)
    );
  };

  // Smart date formatting (LinkedIn-style)
  const formatDate = (timestamp: string) => {
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

  // Handle trashing a conversation
  const handleTrashConversation = async (conversation: Conversation) => {
    try {
      await trashItem({
        id: conversation.id,
        name: getConversationName(conversation),
        type: 'conversation',
        moduleId: 'chat',
        moduleName: 'Chat',
        metadata: {
          conversationType: conversation.type,
          participantCount: conversation.participants?.length || 0,
        },
      });
      
      toast.success(`${getConversationName(conversation)} moved to trash`);
    } catch (error) {
      console.error('Failed to trash conversation:', error);
      toast.error('Failed to move conversation to trash');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              aria-label="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              aria-label="Toggle panel"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={panelState.searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFiltersChange([])}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              panelState.activeFilters.length === 0
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFiltersChange(['DIRECT'])}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              panelState.activeFilters.includes('DIRECT')
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => onFiltersChange(['GROUP'])}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              panelState.activeFilters.includes('GROUP')
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
            <p className="text-sm text-gray-500 mb-4">
              {panelState.searchQuery ? 'No conversations match your search.' : 'Start a new conversation to get started.'}
            </p>
            {!panelState.searchQuery && (
              <Button onClick={() => setShowNewChatModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              const lastMessage = getLastMessage(conversation);
              const isActive = conversation.id === panelState.activeConversationId;
              const unread = hasUnreadMessages(conversation);
              
              return (
                <div
                  key={conversation.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      id: conversation.id,
                      name: getConversationName(conversation),
                      type: 'conversation',
                      moduleId: 'chat',
                      moduleName: 'Chat',
                      metadata: {
                        conversationType: conversation.type,
                        participantCount: conversation.participants?.length || 0,
                      },
                    }));
                  }}
                  onDragEnd={(e) => {
                    // Check if dropped on global trash bin
                    if (e.dataTransfer.dropEffect === 'move') {
                      handleTrashConversation(conversation);
                    }
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <button
                    onClick={() => onConversationSelect(conversation)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* User Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar 
                          src={undefined} // User type doesn't have image property
                          nameOrEmail={otherUser?.name || otherUser?.email || getConversationName(conversation)}
                          size={48}
                          className="w-12 h-12"
                        />
                        {/* Online status indicator */}
                        {otherUser && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium truncate ${
                            unread ? 'text-gray-900 font-semibold' : 'text-gray-900'
                          }`}>
                            {getConversationName(conversation)}
                          </span>
                          {lastMessage && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatDate(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${
                            unread ? 'text-gray-900 font-medium' : 'text-gray-600'
                          }`}>
                            {lastMessage?.content || 'No messages yet'}
                          </p>
                          {unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        
                        {conversation.type === 'GROUP' && (
                          <div className="flex items-center mt-1">
                            <Users className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              {conversation.participants?.length || 0} members
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
             <Modal
         open={showNewChatModal}
         onClose={() => setShowNewChatModal(false)}
         title="New Conversation"
         size="medium"
       >
        <div className="space-y-4">
          {/* Conversation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="conversationType"
                  value="DIRECT"
                  defaultChecked={selectedUsers.length <= 1}
                  className="mr-2"
                />
                <span className="text-sm">Direct Message</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="conversationType"
                  value="GROUP"
                  defaultChecked={selectedUsers.length > 1}
                  className="mr-2"
                />
                <span className="text-sm">Group Chat</span>
              </label>
            </div>
          </div>

          {/* Group Name (for group chats) */}
          {selectedUsers.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <Input
                type="text"
                placeholder="Enter group name..."
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
              />
            </div>
          )}

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Users
            </label>
            <UserAutocomplete
              value={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="Search users by name or email..."
              showConnectionActions={true}
              dashboardId={currentDashboardId || undefined}
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Users ({selectedUsers.length})
              </label>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        nameOrEmail={user.name || user.email}
                        size={24}
                      />
                      <span className="text-sm">{user.name || user.email}</span>
                    </div>
                    <button
                      onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Plus className="w-4 h-4 transform rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {newChatError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {newChatError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowNewChatModal(false)}
              disabled={isCreatingChat}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={selectedUsers.length === 0 || isCreatingChat}
            >
              {isCreatingChat ? 'Creating...' : 'Create Conversation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 