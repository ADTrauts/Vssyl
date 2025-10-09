'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ChevronRight, 
  Users, 
  Paperclip, 
  Search, 
  MoreVertical,
  Star,
  Pin,
  Archive,
  Trash2,
  X,
  ChevronLeft,
  Hash,
  User,
  Send,
  MessageSquare,
  FileText,
  Calendar,
  Crown,
  Shield
} from 'lucide-react';
import { ChatPanelState, Conversation, Message, Thread, ConversationParticipant } from 'shared/types/chat';
import { getConversation, getMessages, createMessage } from '../../api/chat';
import { Avatar, Badge, Button } from 'shared/components';
import { useChat } from '../../contexts/ChatContext';
import { useModuleFeatures } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import MessageRetentionPanel from '../../components/chat/enterprise/MessageRetentionPanel';
import ContentModerationPanel from '../../components/chat/enterprise/ContentModerationPanel';
import EncryptionPanel from '../../components/chat/enterprise/EncryptionPanel';

interface ChatRightPanelProps {
  panelState: ChatPanelState;
  onToggleCollapse: () => void;
  onThreadSelect?: (threadId: string | null) => void;
}

export default function ChatRightPanel({ panelState, onToggleCollapse, onThreadSelect }: ChatRightPanelProps) {
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType } = useDashboard();
  const { loadThreads } = useChat();
  
  // Enterprise feature gating
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  const { hasBusiness: hasEnterprise } = useModuleFeatures('chat', businessId);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'participants' | 'files' | 'threads' | 'enterprise'>('participants');
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (!session?.accessToken || !panelState.activeConversationId) return;

      try {
        setLoading(true);
        const response = await getConversation(panelState.activeConversationId, session.accessToken);
        if (response.success) {
          setConversation(response.data);
        } else {
          setError('Failed to fetch conversation');
        }
      } catch (err) {
        setError('Failed to fetch conversation');
        console.error('Error fetching conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [session?.accessToken, panelState.activeConversationId]);

  // Fetch messages for files and threads
  useEffect(() => {
    const fetchMessages = async () => {
      if (!session?.accessToken || !panelState.activeConversationId) return;

      try {
        const response = await getMessages(
          panelState.activeConversationId, 
          session.accessToken
        );
        if (response.success) {
          setMessages(response.data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [session?.accessToken, panelState.activeConversationId]);

  // Fetch thread messages if thread is active
  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (!session?.accessToken || !panelState.activeConversationId || !panelState.activeThreadId) {
        setThreadMessages([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getMessages(panelState.activeConversationId, session.accessToken, { threadId: panelState.activeThreadId });
        if (response.success) {
          setThreadMessages(response.data);
        } else {
          setError('Failed to fetch thread messages.');
        }
      } catch (err) {
        setError('An error occurred while fetching thread messages.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreadMessages();
  }, [session?.accessToken, panelState.activeConversationId, panelState.activeThreadId]);

  // Fetch threads for the active conversation
  useEffect(() => {
    if (!panelState.activeConversationId) {
      setThreads([]);
      return;
    }
    
    let isMounted = true;
    
    setLoadingThreads(true);
    setThreadsError(null);
    
    loadThreads(panelState.activeConversationId)
      .then((fetchedThreads) => {
        if (isMounted) {
          setThreads(fetchedThreads);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load threads:', err);
          setThreadsError('Failed to load threads');
          setThreads([]); // Set empty array to prevent retry loop
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingThreads(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [panelState.activeConversationId, loadThreads]);

  // Helper function to generate avatar URL for a user
  const getUserAvatar = (name: string) => {
    if (!name) return '';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=40&background=random`;
  };

  const getConversationName = () => {
    if (!conversation) return 'Conversation Details';
    
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(p => p.userId !== session?.user?.email);
      return otherParticipant?.user?.name || otherParticipant?.user?.email || 'Direct Message';
    }
    
    return `${conversation.type.charAt(0) + conversation.type.slice(1).toLowerCase()} Chat`;
  };

  const getUniqueFiles = () => {
    const fileMap = new Map();
    messages.forEach(message => {
      if (message.fileReferences) {
        message.fileReferences.forEach(fileRef => {
          if (!fileMap.has(fileRef.file.id)) {
            fileMap.set(fileRef.file.id, {
              ...fileRef.file,
              messageCount: 1,
              lastReferenced: message.createdAt
            });
          } else {
            const existing = fileMap.get(fileRef.file.id);
            existing.messageCount++;
            if (new Date(message.createdAt) > new Date(existing.lastReferenced)) {
              existing.lastReferenced = message.createdAt;
            }
          }
        });
      }
    });
    return Array.from(fileMap.values()).sort((a, b) => 
      new Date(b.lastReferenced).getTime() - new Date(a.lastReferenced).getTime()
    );
  };

  const getThreads = () => {
    const threadMap = new Map();
    messages.forEach(message => {
      if (message.threadId) {
        if (!threadMap.has(message.threadId)) {
          threadMap.set(message.threadId, {
            id: message.threadId,
            messages: [message],
            lastActivity: message.createdAt
          });
        } else {
          const thread = threadMap.get(message.threadId);
          thread.messages.push(message);
          if (new Date(message.createdAt) > new Date(thread.lastActivity)) {
            thread.lastActivity = message.createdAt;
          }
        }
      }
    });
    return Array.from(threadMap.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.accessToken || !panelState.activeConversationId || !panelState.activeThreadId) return;
    
    try {
      const response = await createMessage(
        panelState.activeConversationId,
        {
          conversationId: panelState.activeConversationId,
          content: newMessage,
          threadId: panelState.activeThreadId,
        },
        session.accessToken
      );

      if (response.success) {
        setThreadMessages(prev => [...prev, response.data]);
        setNewMessage('');
      } else {
        setError('Failed to send reply.');
      }
    } catch (err) {
      setError('An error occurred while sending the reply.');
      console.error(err);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle thread navigation
  const handleThreadClick = (threadId: string) => {
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'ADMIN': return <Shield className="w-3 h-3 text-blue-500" />;
      case 'MODERATOR': return <Shield className="w-3 h-3 text-green-500" />;
      default: return null;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return '📦';
    return '📎';
  };

  // If no conversation is selected, show placeholder
  if (!panelState.activeConversationId) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
        <Hash size={48} className="mb-4" />
        <h3 className="text-lg font-semibold">Conversation Details</h3>
        <p className="text-sm text-center">Select a conversation to see its details.</p>
      </div>
    );
  }

  // If panel is collapsed, show minimal content
  if (!panelState.rightPanelExpanded) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        {/* Collapsed Header */}
        <div className="p-2 border-b border-gray-200 flex items-center justify-center">
          <button onClick={onToggleCollapse} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Collapsed Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-2">
          <div className="text-center">
            <Users size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-xs text-gray-500 truncate w-full">
              {getConversationName()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If a thread is active, show thread view
  if (panelState.activeThreadId) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onThreadSelect?.(null)}
              className="p-1 rounded-full hover:bg-gray-100"
              title="Back to conversation"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h3 className="font-semibold text-lg">Thread</h3>
              <p className="text-sm text-gray-500">Replies</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <p>Loading thread...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && threadMessages.length === 0 && <p>This thread has no replies yet.</p>}
          
          {threadMessages.map(message => (
            <div key={message.id} className="flex items-start gap-3">
              <Avatar
                src={getUserAvatar(message.sender?.name || '')}
                alt={message.sender?.name || 'User'}
                size={32}
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm">{message.sender?.name || message.sender?.email}</span>
                  <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-800">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Reply..."
              className="w-full pl-3 pr-10 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show conversation details view
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{getConversationName()}</h3>
          <p className="text-sm text-gray-500">
            {conversation?.type === 'DIRECT' ? 'Direct message' : `${conversation?.participants?.length || 0} members`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'participants'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Participants
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'files'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Paperclip className="w-4 h-4 inline mr-2" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('threads')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'threads'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Threads
        </button>
        {/* Enterprise tab - Only visible for enterprise users */}
        {hasEnterprise && (
          <button
            onClick={() => setActiveTab('enterprise')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'enterprise'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Enterprise
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center">
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-500">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <div className="p-4 space-y-3">
                {conversation?.participants?.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={getUserAvatar(participant.user?.name || '')}
                        alt={participant.user?.name || 'User'}
                        size={32}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {participant.user?.name || participant.user?.email}
                          </span>
                          {getRoleIcon(participant.role)}
                        </div>
                        <p className="text-xs text-gray-500">{participant.user?.email}</p>
                      </div>
                    </div>
                    <Badge color={participant.isActive ? 'green' : 'gray'}>
                      {participant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="p-4 space-y-3">
                {getUniqueFiles().length === 0 ? (
                  <p className="text-center text-gray-500">No files shared in this conversation</p>
                ) : (
                  getUniqueFiles().map((file) => (
                    <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {formatDate(file.lastReferenced)}
                        </p>
                      </div>
                      <Badge color="blue">{file.messageCount}</Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Threads Tab */}
            {activeTab === 'threads' && (
              <div className="p-4 space-y-3">
                {loadingThreads ? (
                  <p className="text-center text-gray-500">Loading threads...</p>
                ) : threadsError ? (
                  <p className="text-center text-red-500">{threadsError}</p>
                ) : threads.length === 0 ? (
                  <p className="text-center text-gray-500">No threads in this conversation</p>
                ) : (
                  threads.map((thread) => (
                    <div
                      key={thread.id}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => onThreadSelect?.(thread.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {thread.name || `Thread ${thread.id.slice(0, 8)}`}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {thread.lastMessageAt ? formatDate(thread.lastMessageAt) : formatDate(thread.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {thread.participants?.length || 0} participants
                      </p>
                      {thread.messages && thread.messages.length > 0 && (
                        <p className="text-sm text-gray-800 truncate">
                          {thread.messages[thread.messages.length - 1]?.content || 'No content'}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Enterprise Tab - Only visible for enterprise users */}
            {activeTab === 'enterprise' && hasEnterprise && (
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span>Enterprise Features</span>
                  </h3>
                  
                  {/* Enterprise Panels */}
                  <div className="space-y-4">
                    {/* Message Retention */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <details className="group">
                        <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
                          <span className="font-medium text-sm">Message Retention</span>
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="p-3 bg-white">
                          <MessageRetentionPanel />
                        </div>
                      </details>
                    </div>
                    
                    {/* Content Moderation */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <details className="group">
                        <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
                          <span className="font-medium text-sm">Content Moderation</span>
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="p-3 bg-white">
                          <ContentModerationPanel />
                        </div>
                      </details>
                    </div>
                    
                    {/* Encryption */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <details className="group">
                        <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
                          <span className="font-medium text-sm">Encryption Settings</span>
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="p-3 bg-white">
                          <EncryptionPanel />
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 