'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
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
  Shield
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useGlobalTrash, TrashedItem } from '../contexts/GlobalTrashContext';
import { useTrashDrop } from '../utils/trashUtils';
import ClassificationBadge from './ClassificationBadge';
import { getDataClassifications } from '../api/retention';
import type { DataClassification } from '../api/retention';
import ClassificationModal from './ClassificationModal';

interface GlobalChatProps {
  className?: string;
}

interface ChatContext {
  conversationId: string;
  moduleId: string;
  metadata?: Record<string, unknown>;
}

// GlobalChat Message Item Component
const GlobalChatMessageItem = React.memo(({ 
  message, 
  isOwn, 
  onReply, 
  onDelete,
  formatTime,
  replyToMessage,
  getReactionCount,
  hasUserReacted,
  handleAddReaction,
  handleRemoveReaction,
  trashItem,
  activeConversation,
  chatContext,
  accessToken
}: {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onDelete: (message: Message) => void;
  formatTime: (timestamp: string) => string;
  replyToMessage: Message | null;
  getReactionCount: (message: Message, emoji: string) => number;
  hasUserReacted: (message: Message, emoji: string) => boolean;
  handleAddReaction: (messageId: string, emoji: string) => Promise<void>;
  handleRemoveReaction: (messageId: string, emoji: string) => Promise<void>;
  trashItem: (item: TrashedItem) => Promise<void>;
  activeConversation: Conversation | null;
  chatContext: ChatContext;
  accessToken: string;
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [classification, setClassification] = useState<DataClassification | null>(null);
  const [loadingClassification, setLoadingClassification] = useState(false);
  const [showClassificationModal, setShowClassificationModal] = useState(false);

  // Load classification for this message
  useEffect(() => {
    const loadClassification = async () => {
      if (!accessToken) return;
      
      try {
        setLoadingClassification(true);
        const response = await getDataClassifications(accessToken, {
          resourceType: 'message'
        });
        // Find classification for this specific message
        const messageClassification = response.data.classifications.find(c => c.resourceId === message.id);
        if (messageClassification) {
          setClassification(messageClassification);
        }
      } catch (err) {
        console.error('Error loading message classification:', err);
      } finally {
        setLoadingClassification(false);
      }
    };

    loadClassification();
  }, [message.id, accessToken]);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Handle drag to trash
  const handleDragStart = (e: React.DragEvent) => {
    const trashItemData = {
      id: message.id,
      name: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
      type: 'message' as const,
      moduleId: 'chat',
      moduleName: 'Chat',
      metadata: {
        conversationId: message.conversationId,
        senderId: message.senderId,
      }
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(trashItemData));
    e.dataTransfer.setData('text/plain', message.content);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset any drag state if needed
    // The actual drop handling is done by the GlobalTrashBin component
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
    >
      <div className={`max-w-[80%] px-2 py-1.5 rounded-lg text-sm relative ${
        isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100'
      }`}>
        {/* Reply indicator */}
        {replyToMessage?.id === message.id && (
          <div className="text-xs opacity-70 mb-1 border-l-2 border-blue-400 pl-2 bg-blue-50 rounded">
            <span className="font-medium">Replying to:</span> {replyToMessage.content.substring(0, 50)}...
          </div>
        )}
        
        <p>{message.content}</p>
        
        {/* Classification Badge */}
        {classification && (
          <div className="mt-2">
            <ClassificationBadge
              sensitivity={classification.sensitivity}
              expiresAt={classification.expiresAt}
              showExpiration={true}
              size="sm"
            />
          </div>
        )}
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
              const count = getReactionCount(message, emoji);
              const hasReacted = hasUserReacted(message, emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => hasReacted 
                    ? handleRemoveReaction(message.id, emoji)
                    : handleAddReaction(message.id, emoji)
                  }
                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                    hasReacted 
                      ? 'bg-blue-200 text-blue-800' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {emoji} {count}
                </button>
              );
            })}
          </div>
        )}
        
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTime(message.createdAt)}
        </p>

        {/* Message actions (hover) */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onReply(message)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              title="Reply"
            >
              <Reply className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(message)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded text-red-300 hover:text-red-100"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            onClick={() => {
              onReply(message);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
          <button
            onClick={() => {
              setShowClassificationModal(true);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>Classify</span>
          </button>
          <button
            onClick={() => {
              onDelete(message);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Classification Modal */}
      <ClassificationModal
        isOpen={showClassificationModal}
        onClose={() => setShowClassificationModal(false)}
        resourceType="message"
        resourceId={message.id}
        content={message.content}
        currentClassification={classification || undefined}
        onClassify={(newClassification) => {
          setClassification(newClassification);
          setShowClassificationModal(false);
        }}
      />
    </div>
  );
});

GlobalChatMessageItem.displayName = 'GlobalChatMessageItem';

export default function GlobalChat({ className = '' }: GlobalChatProps) {
  const { data: session, status } = useSession();
  
  // Always call useChat hook unconditionally
  const chatContext = useChat();
  const { trashItem } = useGlobalTrash();
  
  // Remove isOpen, always show the bar
  // const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Minimized by default
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Thread state management
  const [activeTab, setActiveTab] = useState<'messages' | 'threads'>('messages');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  
  // Destructure chat context unconditionally
  const {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isConnected,
    isLoading,
    error,
    setActiveConversation,
    sendMessage,
    addReaction,
    removeReaction,
    replyToMessage,
    setReplyToMessage,
    loadThreads: loadThreadsFromContext,
    loadThreadMessages: loadThreadMessagesFromContext,
    createThread: createThreadFromContext
  } = chatContext;

  // Listen for message trashing events
  useEffect(() => {
    const handleMessageTrashed = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { messageId, conversationId } = customEvent.detail;
      
      // If the trashed message was from the current conversation, reload messages
      if (activeConversation?.id === conversationId) {
        await chatContext.loadMessages(conversationId);
      }
    };

    window.addEventListener('messageTrashed', handleMessageTrashed);
    
    return () => {
      window.removeEventListener('messageTrashed', handleMessageTrashed);
    };
  }, [activeConversation?.id, chatContext]);

  // Load threads for active conversation
  const loadThreads = async () => {
    if (!activeConversation?.id) return;
    
    try {
      setIsLoadingThreads(true);
      console.log('Loading threads for conversation:', activeConversation.id);
      const threadsData = await loadThreadsFromContext(activeConversation.id);
      console.log('Loaded threads:', threadsData);
      setThreads(threadsData);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // Load messages for active thread
  const loadThreadMessages = async (threadId: string) => {
    if (!activeConversation?.id) return;
    
    try {
      console.log('Loading messages for thread:', threadId);
      const threadMessagesData = await loadThreadMessagesFromContext(activeConversation.id, threadId);
      console.log('Loaded thread messages:', threadMessagesData);
      setThreadMessages(threadMessagesData);
    } catch (error) {
      console.error('Failed to load thread messages:', error);
    }
  };

  // Load threads when conversation changes
  useEffect(() => {
    if (activeConversation?.id && session) {
      loadThreads();
      setActiveThreadId(null);
      setThreadMessages([]);
    }
  }, [activeConversation?.id, session]);

  // Load thread messages when active thread changes
  useEffect(() => {
    if (activeThreadId && session) {
      loadThreadMessages(activeThreadId);
    } else {
      setThreadMessages([]);
    }
  }, [activeThreadId, activeConversation?.id, session]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && session) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, threadMessages, session]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (activeConversation && messagesEndRef.current && session) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeConversation?.id, session]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Don't render if user is not authenticated
  if (status === 'loading' || status === 'unauthenticated' || !session) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatTime(timestamp);
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === session?.user?.id;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'DIRECT' && conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(p => p.user.id !== session?.user?.id);
      return otherParticipant?.user.name || otherParticipant?.user.email || 'Unknown User';
    }
    return `Group Chat (${conversation.participants.length} members)`;
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'DIRECT' && conversation.participants.length === 2) {
      return conversation.participants.find(p => p.user.id !== session?.user?.id)?.user;
    }
    return null;
  };

  const getLastMessage = (conversation: Conversation) => {
    return conversation.messages?.[0] || null;
  };

  const hasUnreadMessages = (conversation: Conversation) => {
    return conversation.messages?.some(msg => 
      msg.senderId !== session?.user?.id && 
      !msg.readReceipts?.some(receipt => receipt.userId === session?.user?.id)
    ) || false;
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    const name = getConversationName(conversation).toLowerCase();
    const lastMessage = getLastMessage(conversation)?.content?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
  });

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await removeReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const hasUserReacted = (message: Message, emoji: string) => {
    return message.reactions?.some(r => r.emoji === emoji && r.userId === session?.user?.id) || false;
  };

  const getReactionCount = (message: Message, emoji: string) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleDeleteMessage = async (message: Message) => {
    try {
      // Move message to trash
      await trashItem({
        id: message.id,
        name: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
        type: 'message',
        moduleId: 'chat',
        moduleName: 'Chat',
        metadata: {
          conversationId: message.conversationId,
          senderId: message.senderId,
        }
      });
      
      // Reload messages to reflect the deletion
      if (activeConversation?.id) {
        await chatContext.loadMessages(activeConversation.id);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Handle send message
  const handleSendMessage = async (threadId?: string) => {
    if (!newMessage.trim()) return;
    try {
      // Determine replyToId and threadId based on context
      let replyToId: string | undefined = undefined;
      let messageThreadId: string | undefined = undefined;
      
      if (replyToMessage) {
        // If replying to a message, use the message's ID as replyToId
        replyToId = replyToMessage.id;
        // The backend will automatically create a thread if needed
        messageThreadId = replyToMessage.threadId;
      } else if (threadId) {
        // If sending to a specific thread, use the threadId
        messageThreadId = threadId;
      }
      
      await sendMessage(newMessage, [], replyToId, messageThreadId);
      setNewMessage('');
      setReplyToMessage(null);
      
      // Refresh threads list after sending message
      await loadThreads();
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeThreadId) {
        handleSendMessage(activeThreadId);
      } else {
        handleSendMessage();
      }
    }
  };

  // Get current messages to display (either conversation messages or thread messages)
  const getCurrentMessages = () => {
    if (activeThreadId) {
      return threadMessages;
    }
    return messages;
  };

  // Get current conversation name
  const getCurrentConversationName = () => {
    if (!activeConversation) return '';
    
    if (activeThreadId) {
      const thread = threads.find(t => t.id === activeThreadId);
      return thread?.name || `Thread ${activeThreadId.slice(0, 8)}`;
    }
    
    return getConversationName(activeConversation);
  };

  // LinkedIn-style conversation item component
  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const otherUser = getOtherParticipant(conversation);
    const lastMessage = getLastMessage(conversation);
    const isActive = activeConversation?.id === conversation.id;
    const unread = hasUnreadMessages(conversation);

    const handleConversationClick = () => {
      setActiveConversation(conversation);
      // Auto-expand when selecting a conversation
      if (!isExpanded) {
        setIsExpanded(true);
      }
    };

    return (
      <button
        onClick={handleConversationClick}
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
          </div>
        </div>
      </button>
    );
  };

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
              </h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* Ellipsis menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // Add functionality for settings
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // Add functionality for notifications
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // Instead of setIsOpen(false), just minimize
                      setIsMinimized(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Minimize Chat
                  </button>
                </div>
              )}
            </div>
            {/* Expand/pop-out icon */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={isExpanded ? "Collapse chat" : "Expand chat"}
            >
              <ExternalLink className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
            </button>
            {/* Collapse/minimize icon */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <ChevronUp className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {!isMinimized && (
          <div className="flex h-[calc(100%-60px)]">
            {/* Conversation List Panel */}
            <div className={`${isExpanded ? 'w-[280px] border-r border-gray-200' : 'w-full'}`}>
              {/* Search Bar */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="overflow-y-auto h-[calc(100%-70px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  <>
                    {filteredConversations.map((conversation) => (
                      <ConversationItem key={conversation.id} conversation={conversation} />
                    ))}
                    {/* Show instruction when conversation is selected but not expanded */}
                    {activeConversation && !isExpanded && (
                      <div className="p-4 text-center text-gray-500 border-t border-gray-100">
                        <ExternalLink className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Click the expand button to open chat</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chat Window Panel - Only show when expanded */}
            {isExpanded && (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                {activeConversation && (
                  <div className="flex items-center p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        src={undefined} // User type doesn't have image property
                        nameOrEmail={getOtherParticipant(activeConversation)?.name || getConversationName(activeConversation)}
                        size={32}
                        className="w-8 h-8"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getConversationName(activeConversation)}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isConnected ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs for Messages and Threads */}
                {activeConversation && (
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => { 
                        setActiveTab('messages'); 
                        setActiveThreadId(null); 
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium ${
                        activeTab === 'messages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Messages
                    </button>
                    <button
                      onClick={() => setActiveTab('threads')}
                      className={`flex-1 px-4 py-2 text-sm font-medium ${
                        activeTab === 'threads' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Threads
                    </button>
                  </div>
                )}

                {/* Messages View - when conversation is active and tab is messages */}
                {activeConversation && activeTab === 'messages' && (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Spinner size={24} />
                        </div>
                      ) : (
                        getCurrentMessages().map((message) => (
                          <GlobalChatMessageItem
                            key={message.id}
                            message={message}
                            isOwn={isOwnMessage(message)}
                            onReply={handleReply}
                            onDelete={handleDeleteMessage}
                            formatTime={formatTime}
                            replyToMessage={replyToMessage}
                            getReactionCount={getReactionCount}
                            hasUserReacted={hasUserReacted}
                            handleAddReaction={handleAddReaction}
                            handleRemoveReaction={handleRemoveReaction}
                            trashItem={trashItem}
                            activeConversation={activeConversation}
                            chatContext={chatContext}
                            accessToken={session?.accessToken || ''}
                          />
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={replyToMessage ? `Replying to: ${replyToMessage.content.substring(0, 30)}...` : "Type a message..."}
                          className="flex-1 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          onClick={() => handleSendMessage()}
                          disabled={!newMessage.trim()}
                          size="sm"
                        >
                          Send
                        </Button>
                        {replyToMessage && (
                          <Button
                            onClick={() => setReplyToMessage(null)}
                            variant="secondary"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Threads View - when conversation is active and tab is threads */}
                {activeConversation && activeTab === 'threads' && !activeThreadId && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoadingThreads ? (
                      <div className="flex items-center justify-center h-full">
                        <Spinner size={24} />
                      </div>
                    ) : threads.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        <Hash className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No threads yet</p>
                        <p className="text-xs mt-1">Reply to a message to create a thread</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3">
                          <Button
                            onClick={async () => {
                              try {
                                const threadName = prompt('Enter thread name:');
                                if (threadName) {
                                  await createThreadFromContext(activeConversation.id, threadName, 'MESSAGE');
                                  await loadThreads();
                                }
                              } catch (error) {
                                console.error('Failed to create thread:', error);
                              }
                            }}
                            size="sm"
                            className="w-full"
                          >
                            Create New Thread
                          </Button>
                        </div>
                        {threads.map(thread => (
                          <div
                            key={thread.id}
                            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setActiveThreadId(thread.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {thread.name || `Thread ${thread.id.slice(0, 8)}`}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {thread.lastMessageAt ? formatTime(thread.lastMessageAt) : formatTime(thread.createdAt)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {thread.messages?.length || 0} messages • {thread.participants?.length || 0} participants
                            </div>
                            {thread.messages && thread.messages.length > 0 && (
                              <div className="text-sm text-gray-800 truncate">
                                <span className="text-gray-600">Last: </span>
                                {thread.messages[0]?.content || 'No content'}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Individual Thread View */}
                {activeConversation && activeTab === 'threads' && activeThreadId && (
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <button
                        className="text-blue-500 text-sm mb-2 flex items-center space-x-1"
                        onClick={() => setActiveThreadId(null)}
                      >
                        <X className="w-3 h-3" />
                        <span>Back to Threads</span>
                      </button>
                      <div className="font-medium text-gray-900">
                        {threads.find(t => t.id === activeThreadId)?.name || `Thread ${activeThreadId.slice(0, 8)}`}
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {threadMessages.map(message => (
                        <div key={message.id} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold">{message.sender?.name || message.senderId}</div>
                            <div className="text-xs text-gray-500">{formatTime(message.createdAt)}</div>
                          </div>
                          <div>{message.content}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Reply to thread..."
                          className="flex-1 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          onClick={() => handleSendMessage(activeThreadId)}
                          disabled={!newMessage.trim()}
                          size="sm"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State - when no conversation is selected */}
                {!activeConversation && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium mb-1">Select a conversation</p>
                      <p className="text-sm">Choose a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}