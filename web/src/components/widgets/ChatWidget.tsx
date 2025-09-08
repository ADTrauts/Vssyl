'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle, 
  Send, 
  MoreHorizontal, 
  Users, 
  User, 
  Plus,
  Search,
  Clock,
  Trash2,
  Eye,
  Reply
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert, Avatar } from 'shared/components';
import { getConversations, getMessages } from '../../api/chat';
import { formatRelativeTime } from '../../utils/format';
import { Conversation, Message, ReadReceipt } from 'shared/types/chat';

interface ChatWidgetProps {
  id: string;
  config?: ChatWidgetConfig;
  onConfigChange?: (config: ChatWidgetConfig) => void;
  onRemove?: () => void;
  dashboardId?: string;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
}

interface ChatWidgetConfig {
  showRecentConversations: boolean;
  maxConversationsToShow: number;
  showUnreadCount: boolean;
  showQuickCompose: boolean;
  showConversationStats: boolean;
  conversationTypes: ('DIRECT' | 'GROUP' | 'CHANNEL')[];
  sortBy: 'recent' | 'unread' | 'name';
}

interface ConversationWithStats extends Conversation {
  unreadCount: number;
  lastMessage?: Message;
  participantCount: number;
}

const defaultConfig: ChatWidgetConfig = {
  showRecentConversations: true,
  maxConversationsToShow: 5,
  showUnreadCount: true,
  showQuickCompose: true,
  showConversationStats: true,
  conversationTypes: ['DIRECT', 'GROUP'],
  sortBy: 'recent'
};

export default function ChatWidget({ 
  id, 
  config = defaultConfig, 
  onConfigChange, 
  onRemove,
  dashboardId,
  dashboardType,
  dashboardName
}: ChatWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationWithStats[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [showQuickCompose, setShowQuickCompose] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Ensure config is never null
  const safeConfig = config || defaultConfig;

  // Context-aware widget content
  const getContextSpecificContent = () => {
    switch (dashboardType) {
      case 'household':
        return {
          title: `${dashboardName} Family Chat`,
          emptyMessage: "No family conversations yet. Start chatting with family members!",
          sections: ['Family Chats', 'Announcements', 'Family Activity'],
          color: '#f59e0b', // Yellow theme
          icon: '🏠'
        };
      case 'business':
        return {
          title: `${dashboardName} Work Chat`,
          emptyMessage: "No work conversations yet. Connect with your team and start collaborating!",
          sections: ['Team Chats', 'Project Discussions', 'Work Updates'],
          color: '#3b82f6', // Blue theme
          icon: '💼'
        };
      case 'educational':
        return {
          title: `${dashboardName} School Chat`,
          emptyMessage: "No school conversations yet. Connect with classmates and teachers!",
          sections: ['Class Discussions', 'Study Groups', 'School Updates'],
          color: '#10b981', // Green theme
          icon: '🎓'
        };
      default:
        return {
          title: 'My Personal Chat',
          emptyMessage: "No personal conversations yet. Start your first chat!",
          sections: ['Recent Chats', 'Personal Messages', 'My Activity'],
          color: '#6366f1', // Purple theme
          icon: '💬'
        };
    }
  };

  // Get context-specific content
  const contextContent = getContextSpecificContent();

  // Load chat data
  useEffect(() => {
    if (!session?.accessToken) return;
    
    const loadChatData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getConversations(session.accessToken!, dashboardId);
        const conversationsData = Array.isArray(response) ? response : response.data || [];

        // Process conversations with stats
        const conversationsWithStats = conversationsData
          .filter(conv => safeConfig.conversationTypes.includes(conv.type))
          .map(conv => {
            const unreadCount = conv.messages?.filter((msg: Message) => 
              msg.senderId !== session.user?.id && 
              !msg.readReceipts?.some((receipt: ReadReceipt) => receipt.userId === session.user?.id)
            ).length || 0;

            const lastMessage = conv.messages && conv.messages.length > 0 
              ? conv.messages[conv.messages.length - 1] 
              : undefined;

            return {
              ...conv,
              unreadCount,
              lastMessage,
              participantCount: conv.participants?.length || 0
            };
          });

        // Sort conversations based on config
        const sortedConversations = conversationsWithStats.sort((a, b) => {
          switch (safeConfig.sortBy) {
            case 'unread':
              return b.unreadCount - a.unreadCount;
            case 'name':
              return (a.name || '').localeCompare(b.name || '');
            case 'recent':
            default:
              return new Date(b.lastMessageAt || b.updatedAt).getTime() - 
                     new Date(a.lastMessageAt || a.updatedAt).getTime();
          }
        });

        setConversations(sortedConversations.slice(0, safeConfig.maxConversationsToShow));
        
        // Calculate total unread count
        const totalUnread = conversationsWithStats.reduce((sum, conv) => sum + conv.unreadCount, 0);
        setTotalUnreadCount(totalUnread);

      } catch (err) {
        setError('Failed to load chat data');
        console.error('Error loading chat data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [session?.accessToken, dashboardId, safeConfig.maxConversationsToShow, safeConfig.conversationTypes, safeConfig.sortBy]);

  // Get conversation name
  const getConversationName = (conversation: ConversationWithStats) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== session?.user?.id
      );
      return otherParticipant?.user?.name || otherParticipant?.user?.email || 'Direct Message';
    }
    
    return `${conversation.type.charAt(0) + conversation.type.slice(1).toLowerCase()} Chat`;
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation: ConversationWithStats) => {
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      const otherParticipant = conversation.participants.find(
        p => p.userId !== session?.user?.id
      );
      return otherParticipant?.user?.name || otherParticipant?.user?.email || 'DM';
    }
    
    return conversation.name || 'Group';
  };

  // Handle quick message send
  const handleQuickSend = async () => {
    if (!quickMessage.trim() || !session?.accessToken) return;

    try {
      setSendingMessage(true);
      // TODO: Implement quick message sending
      // For now, we'll just clear the message
      setQuickMessage('');
      setShowQuickCompose(false);
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" style={{ color: contextContent.color }} />
            <span className="text-lg mr-1">{contextContent.icon}</span>
            <h3 className="font-semibold text-gray-900">{contextContent.title}</h3>
            {safeConfig.showUnreadCount && totalUnreadCount > 0 && (
              <Badge size="sm" color="red">
                {totalUnreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 hover:bg-red-100 rounded text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Spinner size={24} />
          <span className="ml-2 text-gray-600">Loading chat data...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" style={{ color: contextContent.color }} />
            <span className="text-lg mr-1">{contextContent.icon}</span>
            <h3 className="font-semibold text-gray-900">{contextContent.title}</h3>
          </div>
        </div>
        <Alert type="error" title="Error loading chat data">
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" style={{ color: contextContent.color }} />
          <span className="text-lg mr-1">{contextContent.icon}</span>
          <h3 className="font-semibold text-gray-900">{contextContent.title}</h3>
          {safeConfig.showUnreadCount && totalUnreadCount > 0 && (
            <Badge size="sm" color="red">
              {totalUnreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {safeConfig.showQuickCompose && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowQuickCompose(!showQuickCompose)}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Button>
          )}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-100 rounded text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Compose */}
      {showQuickCompose && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Quick Message</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => e.key === 'Enter' && handleQuickSend()}
            />
            <Button
              size="sm"
              disabled={!quickMessage.trim() || sendingMessage}
              onClick={handleQuickSend}
              className="flex items-center space-x-1"
            >
              {sendingMessage ? (
                <Spinner size={16} />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Conversation Stats */}
      {safeConfig.showConversationStats && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Stats</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{conversations.length}</div>
              <div className="text-gray-500">Conversations</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{totalUnreadCount}</div>
              <div className="text-gray-500">Unread</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      {safeConfig.showRecentConversations && conversations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Conversations</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.location.href = '/chat'}
            >
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => window.location.href = `/chat?conversation=${conversation.id}`}
              >
                <div className="flex-shrink-0">
                  <Avatar
                    size={24}
                    nameOrEmail={getConversationAvatar(conversation)}
                    className={conversation.type === 'DIRECT' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getConversationName(conversation)}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge size="sm" color="red">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    {conversation.type === 'GROUP' && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {conversation.participantCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {conversation.lastMessage ? (
                      <>
                        <span className="truncate">
                          {conversation.lastMessage.sender?.name || 'Someone'}: {conversation.lastMessage.content?.slice(0, 30)}
                          {conversation.lastMessage.content && conversation.lastMessage.content.length > 30 && '...'}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}</span>
                      </>
                    ) : (
                      <span>No messages yet</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/chat?conversation=${conversation.id}`;
                    }}
                  >
                    <Eye className="w-3 h-3 text-gray-500" />
                  </button>
                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickMessage(`@${getConversationName(conversation)} `);
                      setShowQuickCompose(true);
                    }}
                  >
                    <Reply className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {conversations.length === 0 && (
        <div className="text-center py-6">
          <MessageCircle className="w-12 h-12 mx-auto mb-2" style={{ color: contextContent.color }} />
          <span className="text-2xl block mb-2">{contextContent.icon}</span>
          <p className="text-sm text-gray-500 mb-3">{contextContent.emptyMessage}</p>
          <Button
            size="sm"
            onClick={() => window.location.href = '/chat'}
          >
            Start Chatting
          </Button>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && onConfigChange && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Widget Settings</h5>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={safeConfig.showRecentConversations}
                onChange={(e) => onConfigChange({
                  ...safeConfig,
                  showRecentConversations: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show recent conversations</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={safeConfig.showUnreadCount}
                onChange={(e) => onConfigChange({
                  ...safeConfig,
                  showUnreadCount: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show unread count</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={safeConfig.showQuickCompose}
                onChange={(e) => onConfigChange({
                  ...safeConfig,
                  showQuickCompose: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show quick compose</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={safeConfig.showConversationStats}
                onChange={(e) => onConfigChange({
                  ...safeConfig,
                  showConversationStats: e.target.checked
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show conversation stats</span>
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Max conversations:</span>
              <select
                value={safeConfig.maxConversationsToShow}
                onChange={(e) => onConfigChange({
                  ...safeConfig,
                  maxConversationsToShow: parseInt(e.target.value)
                })}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={safeConfig.sortBy}
                onChange={(e) => onConfigChange({
                  ...safeConfig,
                  sortBy: e.target.value as 'recent' | 'unread' | 'name'
                })}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="recent">Recent</option>
                <option value="unread">Unread</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 