'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Avatar, Badge, Spinner, Input } from 'shared/components';
import { useFeatureGating, useModuleFeatures } from '../../hooks/useFeatureGating';
import { FeatureGate } from '../FeatureGate';
import { io, Socket } from 'socket.io-client';
import { 
  MessageSquare, 
  Send, 
  Search, 
  MoreVertical, 
  Phone,
  Video,
  File,
  Smile,
  Paperclip,
  Users,
  Hash,
  Lock,
  Shield,
  Eye,
  Archive,
  Settings,
  Flag,
  Key,
  BarChart3,
  AlertTriangle,
  Plus,
  X,
  CheckCircle,
  Reply,
  MessageSquare as Thread,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../../api/drive';
import { chatAPI, markAsRead } from '../../api/chat';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';

// Import enterprise components
import MessageRetentionPanel from './enterprise/MessageRetentionPanel';
import ContentModerationPanel from './enterprise/ContentModerationPanel';
import EncryptionPanel from './enterprise/EncryptionPanel';
import ChatFileUpload from '../../app/chat/ChatFileUpload';

// Quick reaction emojis for common reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileReferences?: Array<{
    id: string;
    fileName: string;
    fileId: string;
  }>;
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  readReceipts?: Array<{
    id: string;
    userId: string;
    readAt: string;
  }>;
  edited?: boolean;
  deleted?: boolean;
  // Enterprise features
  encrypted?: boolean;
  retentionPolicy?: string;
  complianceFlags?: string[];
  moderationStatus?: 'approved' | 'flagged' | 'pending' | 'quarantined';
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'channel' | 'direct' | 'group';
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  members: Array<{
    id: string;
    name: string;
    online: boolean;
    role: string;
  }>;
  isPrivate?: boolean;
  // Enterprise features
  encryptionEnabled?: boolean;
  retentionPolicy?: string;
  moderationEnabled?: boolean;
}

interface ChatThread {
  id: string;
  name: string;
  type: 'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION';
  conversationId: string;
  participants: {
    id: string;
    name?: string;
    email: string;
  }[];
  lastMessageAt?: string;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
}

interface UnifiedChatModuleProps {
  businessId?: string;
  className?: string;
  refreshTrigger?: number;
}

export default function UnifiedChatModule({ businessId, className = '', refreshTrigger }: UnifiedChatModuleProps) {
  const { recordUsage } = useFeatureGating(businessId);
  const { moduleAccess, hasBusiness: hasEnterprise } = useModuleFeatures('chat', businessId);
  const { trashItem } = useGlobalTrash();
  
  // Core state
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ id: string; name: string }[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuickReactionsFor, setShowQuickReactionsFor] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Threading state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [showThreadList, setShowThreadList] = useState(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadType, setNewThreadType] = useState<'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION'>('MESSAGE');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  
  // Enterprise features state
  const [showEnterprisePanel, setShowEnterprisePanel] = useState(false);
  const [activeEnterpriseTab, setActiveEnterpriseTab] = useState<'retention' | 'moderation' | 'encryption' | 'analytics' | 'compliance'>('retention');
  const [encryptionStatus, setEncryptionStatus] = useState<'enabled' | 'disabled'>('enabled');
  const [moderationAlerts, setModerationAlerts] = useState(0);
  const [retentionWarnings, setRetentionWarnings] = useState(0);
  
  // Additional enterprise features
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showMessageThreading, setShowMessageThreading] = useState(false);
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [complianceReports, setComplianceReports] = useState<any[]>([]);
  const [messageAnalytics, setMessageAnalytics] = useState<any>(null);
  
  // WebSocket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load chat data
  useEffect(() => {
    loadChatData();
  }, [businessId, refreshTrigger]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(null);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Mark messages as read when they're viewed
  useEffect(() => {
    if (messages.length > 0 && selectedChannel) {
      // Mark all messages in the current channel as read
      messages.forEach(message => {
        if (message.sender.id !== 'current-user') {
          markMessageAsRead(message.id);
        }
      });
    }
  }, [messages, selectedChannel]);

  // Load threads when channel is selected
  useEffect(() => {
    if (selectedChannel) {
      loadThreads(selectedChannel.id);
    }
  }, [selectedChannel]);

  // WebSocket connection
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];

    if (!token) return;

    // Connect to WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat WebSocket');
      setIsConnected(false);
    });

    newSocket.on('message', (data: any) => {
      // Handle new message
      if (data.conversationId === selectedChannel?.id) {
        const newMessage: ChatMessage = {
          id: data.id,
          content: data.content,
          sender: {
            id: data.sender.id,
            name: data.sender.name || data.sender.email,
            avatar: data.sender.avatar,
            role: data.sender.role || 'Member'
          },
          timestamp: data.createdAt,
          type: data.type.toLowerCase(),
          reactions: data.reactions?.map((r: any) => ({
            emoji: r.emoji,
            users: r.users || []
          })),
          edited: data.editedAt ? true : false,
          deleted: data.deletedAt ? true : false,
          // Enterprise features
          encrypted: hasEnterprise && data.encrypted,
          retentionPolicy: hasEnterprise ? data.retentionPolicy : undefined,
          complianceFlags: hasEnterprise ? data.complianceFlags : undefined,
          moderationStatus: hasEnterprise ? data.moderationStatus : undefined
        };

        setMessages(prev => [...prev, newMessage]);
      }

      // Update channel last message
      setChannels(prev => prev.map(channel => 
        channel.id === data.conversationId 
          ? { 
              ...channel, 
              lastMessage: data.content,
              lastMessageTime: data.createdAt,
              unreadCount: channel.id === selectedChannel?.id ? channel.unreadCount : channel.unreadCount + 1
            }
          : channel
      ));
    });

    newSocket.on('user_typing', handleTypingStart);
    newSocket.on('user_stopped_typing', handleTypingStop);

    newSocket.on('presence', (data: any) => {
      // Handle user presence updates
      console.log('User presence:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedChannel?.id, hasEnterprise]);

  // Join conversation room when selected channel changes
  useEffect(() => {
    if (socket && selectedChannel) {
      socket.emit('join_conversation', { conversationId: selectedChannel.id });
    }
  }, [socket, selectedChannel]);

  const loadChatData = async () => {
    setLoading(true);
    try {
      // Get access token from session
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No access token found');
      }

      // Call real API to get conversations
      const response = await fetch('/api/chat/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load conversations');
      }

      // Transform API data to component format
      const apiChannels: ChatChannel[] = data.conversations.map((conv: any) => ({
        id: conv.id,
        name: conv.name || conv.participants.find((p: any) => p.user.id !== conv.createdBy)?.user.name || 'Direct Message',
        type: conv.type.toLowerCase(),
        unreadCount: conv.unreadCount || 0,
        lastMessage: conv.lastMessage?.content || 'No messages yet',
        lastMessageTime: conv.lastMessage?.createdAt || conv.updatedAt,
        members: conv.participants.map((p: any) => ({
          id: p.user.id,
          name: p.user.name || p.user.email,
          online: p.user.isOnline || false,
          role: p.role || 'Member'
        })),
        isPrivate: conv.type === 'DIRECT' || conv.isPrivate,
        // Enterprise features
        encryptionEnabled: hasEnterprise && conv.encryptionEnabled,
        retentionPolicy: hasEnterprise ? conv.retentionPolicy : undefined,
        moderationEnabled: hasEnterprise && conv.moderationEnabled
      }));

      setChannels(apiChannels);
      
      if (apiChannels.length > 0) {
        setSelectedChannel(apiChannels[0]);
        // Load messages for first channel
        loadMessages(apiChannels[0].id);
      }
      
      // Record usage for feature gating
      if (businessId) {
        recordUsage('chat_messaging');
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
      toast.error('Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      // Get access token from session
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No access token found');
      }

      // Call real API to get messages
      const response = await fetch(`/api/chat/conversations/${channelId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load messages');
      }

      // Transform API data to component format
      const apiMessages: ChatMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name || msg.sender.email,
          avatar: msg.sender.avatar,
          role: msg.sender.role || 'Member'
        },
        timestamp: msg.createdAt,
        type: msg.type.toLowerCase(),
        reactions: msg.reactions?.map((r: any) => ({
          emoji: r.emoji,
          users: r.users || []
        })),
        edited: msg.editedAt ? true : false,
        deleted: msg.deletedAt ? true : false,
        // Enterprise features
        encrypted: hasEnterprise && msg.encrypted,
        retentionPolicy: hasEnterprise ? msg.retentionPolicy : undefined,
        complianceFlags: hasEnterprise ? msg.complianceFlags : undefined,
        moderationStatus: hasEnterprise ? msg.moderationStatus : undefined
      }));

      setMessages(apiMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
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

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedChannel) return;

    try {
      setUploading(true);
      // Get access token from session
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No access token found');
      }

      // Upload files first if any
      const uploadedFileIds: string[] = [];
      if (selectedFiles.length > 0) {
        // Files are already uploaded via ChatFileUpload component
        uploadedFileIds.push(...selectedFiles.map(f => f.id));
      }

      // Call real API to send message
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedChannel.id,
          content: newMessage.trim(),
          type: 'TEXT',
          fileIds: uploadedFileIds.length > 0 ? uploadedFileIds : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add the new message to the local state
      const newMessageData: ChatMessage = {
        id: data.message.id,
        content: data.message.content,
        sender: {
          id: data.message.sender.id,
          name: data.message.sender.name || data.message.sender.email,
          avatar: data.message.sender.avatar,
          role: data.message.sender.role || 'Member'
        },
        timestamp: data.message.createdAt,
        type: data.message.type.toLowerCase(),
        // Enterprise features
        encrypted: hasEnterprise && data.message.encrypted,
        retentionPolicy: hasEnterprise ? data.message.retentionPolicy : undefined,
        moderationStatus: hasEnterprise ? data.message.moderationStatus : undefined
      };

      setMessages(prev => [...prev, newMessageData]);
      setNewMessage('');
      setSelectedFiles([]);
      setShowFileUpload(false);
      toast.success('Message sent');

      // Emit message through WebSocket for real-time delivery
      if (socket) {
        socket.emit('message', {
          conversationId: selectedChannel.id,
          content: newMessage.trim(),
          type: 'TEXT'
        });
      }
      
      // Record usage for feature gating
      if (businessId) {
        recordUsage('chat_messaging');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
  };

  const handleFileSelect = async (fileId: string, fileName: string) => {
    setSelectedFiles(prev => [...prev, { id: fileId, name: fileName }]);
    setShowFileUpload(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is handled by the ChatFileUpload component now
    // Keep this for compatibility but it won't be used
  };

  const removeSelectedFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Threading functions
  const loadThreads = async (conversationId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/chat/conversations/${conversationId}/threads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/chat/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreadMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
    }
  };

  const createThread = async (conversationId: string, name: string, type: string, participantIds: string[] = []) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/chat/conversations/${conversationId}/threads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          participantIds
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(prev => [...prev, data.thread]);
        setShowNewThreadModal(false);
        setNewThreadName('');
        toast.success('Thread created successfully');
        return data.thread;
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    }
  };

  const createThreadFromMessage = async (message: ChatMessage) => {
    if (!selectedChannel) return;

    const threadName = `Re: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`;
    const participantIds = [message.sender.id]; // Start with original message sender

    const thread = await createThread(selectedChannel.id, threadName, 'MESSAGE', participantIds);
    if (thread) {
      setReplyingToMessage(null);
      setActiveThread(thread);
      loadThreadMessages(thread.id);
    }
  };

  const handleThreadSelect = (thread: ChatThread) => {
    setActiveThread(thread);
    loadThreadMessages(thread.id);
  };

  const handleBackToConversation = () => {
    setActiveThread(null);
    setThreadMessages([]);
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingToMessage(message);
  };

  const handleSendThreadMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !activeThread) return;

    try {
      setUploading(true);
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) return;

      // Upload files first if any
      let fileIds: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // File is already uploaded, just use the ID
          fileIds.push(file.id);
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: activeThread.conversationId,
          threadId: activeThread.id,
          content: newMessage,
          type: 'TEXT',
          fileIds
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setThreadMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setSelectedFiles([]);
        
        // Emit via WebSocket
        if (socket) {
          socket.emit('message', {
            conversationId: activeThread.conversationId,
            threadId: activeThread.id,
            content: newMessage,
            type: 'TEXT',
            fileIds
          });
        }
      }
    } catch (error) {
      console.error('Error sending thread message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  // Reaction handlers
  const getGroupedReactions = (message: ChatMessage) => {
    if (!message.reactions) return [];
    
    const grouped = message.reactions.reduce((acc, reaction) => {
      const existing = acc.find(g => g.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        if (reaction.users.includes('current-user')) {
          existing.hasReacted = true;
        }
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          hasReacted: reaction.users.includes('current-user')
        });
      }
      return acc;
    }, [] as Array<{ emoji: string; count: number; hasReacted: boolean }>);
    
    return grouped.sort((a, b) => b.count - a.count);
  };

  const hasUserReacted = (message: ChatMessage, emoji: string) => {
    return message.reactions?.some(r => r.emoji === emoji && r.users.includes('current-user')) || false;
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        toast.error('No access token found');
        return;
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      if (hasUserReacted(message, emoji)) {
        await chatAPI.removeReaction(messageId, emoji, token);
      } else {
        await chatAPI.addReaction(messageId, emoji, token);
      }

      // Update local state
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const existingReaction = m.reactions?.find(r => r.emoji === emoji);
          if (existingReaction) {
            if (hasUserReacted(m, emoji)) {
              // Remove user from reaction
              return {
                ...m,
                reactions: m.reactions?.map(r => 
                  r.emoji === emoji 
                    ? { ...r, users: r.users.filter(u => u !== 'current-user') }
                    : r
                ).filter(r => r.users.length > 0)
              };
            } else {
              // Add user to reaction
              return {
                ...m,
                reactions: m.reactions?.map(r => 
                  r.emoji === emoji 
                    ? { ...r, users: [...r.users, 'current-user'] }
                    : r
                )
              };
            }
          } else {
            // Add new reaction
            return {
              ...m,
              reactions: [...(m.reactions || []), { emoji, users: ['current-user'] }]
            };
          }
        }
        return m;
      }));
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleQuickReaction = async (messageId: string, emoji: string) => {
    await handleReaction(messageId, emoji);
    setShowQuickReactionsFor(null);
  };

  // Edit/Delete handlers
  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        toast.error('No access token found');
        return;
      }

      await chatAPI.updateMessage(messageId, editContent, token);

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, content: editContent, edited: true }
          : m
      ));

      setEditingMessage(null);
      setEditContent('');
      toast.success('Message updated');
    } catch (error) {
      console.error('Failed to update message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = async (message: ChatMessage) => {
    try {
      // Move message to trash
      await trashItem({
        id: message.id,
        name: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
        type: 'message',
        moduleId: 'chat',
        moduleName: 'Chat',
        metadata: {
          conversationId: message.sender.id,
          senderId: message.sender.id,
        }
      });
      
      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== message.id));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(messageId);
  };

  // Read receipt handlers
  const markMessageAsRead = async (messageId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) return;

      await markAsRead(messageId, token);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const getMessageStatus = (message: ChatMessage) => {
    // Only show status for own messages
    if (message.sender.id !== 'current-user') return null;
    
    if (message.readReceipts && message.readReceipts.length > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-gray-400" />;
  };

  // Typing handlers
  const handleTypingStart = (data: { conversationId: string; userId: string; userName: string }) => {
    if (data.conversationId === selectedChannel?.id && data.userId !== 'current-user') {
      const userName = data.userName || data.userId;
      setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
    }
  };

  const handleTypingStop = (data: { conversationId: string; userId: string }) => {
    if (data.conversationId === selectedChannel?.id && data.userId !== 'current-user') {
      setTypingUsers(prev => prev.filter(user => user !== data.userId));
    }
  };

  const handleTypingChange = () => {
    if (!selectedChannel || !socket) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing
    socket.emit('typing_start', { 
      conversationId: selectedChannel.id, 
      isTyping: true 
    });

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('typing_stop', { 
          conversationId: selectedChannel.id, 
          isTyping: false 
        });
      }
    }, 3000);
  };

  const handleChannelSelect = (channel: ChatChannel) => {
    setSelectedChannel(channel);
    loadMessages(channel.id);
    // Mark channel as read
    setChannels(prev => prev.map(c => 
      c.id === channel.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-white rounded-lg border ${className}`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {hasEnterprise && (
              <div className="flex items-center space-x-2">
                <Badge color="blue" className="text-xs">
                  Enterprise
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="p-2"
                  title="Advanced Search"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComplianceDashboard(!showComplianceDashboard)}
                  className="p-2"
                  title="Compliance Dashboard"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEnterprisePanel(!showEnterprisePanel)}
                  className="p-2"
                  title="Enterprise Settings"
                >
                  <Shield className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChannel?.id === channel.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
              onClick={() => handleChannelSelect(channel)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {channel.type === 'direct' ? (
                    <Avatar size={32} nameOrEmail={channel.name} />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      {channel.isPrivate ? (
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
                      {channel.type === 'direct' ? channel.name : `#${channel.name}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      {hasEnterprise && channel.encryptionEnabled && (
                        <Key className="w-3 h-3 text-green-500" />
                      )}
                      {channel.unreadCount > 0 && (
                        <Badge color="blue" className="text-xs">
                          {channel.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {channel.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(channel.lastMessageTime)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Threads Section */}
        {selectedChannel && threads.length > 0 && (
          <div className="border-t border-gray-200">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Thread className="w-4 h-4" />
                  <span>Threads</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewThreadModal(true)}
                  className="p-1"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      activeThread?.id === thread.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {thread.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge color="blue" className="text-xs">
                          {thread.type}
                        </Badge>
                        {thread.unreadCount > 0 && (
                          <Badge color="red" className="text-xs">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedChannel.type === 'direct' ? (
                  <Avatar size={32} nameOrEmail={selectedChannel.name} />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    {selectedChannel.isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Hash className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                )}
                <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedChannel.type === 'direct' ? selectedChannel.name : `#${selectedChannel.name}`}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedChannel.members.length} member{selectedChannel.members.length !== 1 ? 's' : ''}
                {hasEnterprise && selectedChannel.encryptionEnabled && (
                  <span className="ml-2 text-green-600 text-xs">🔒 Encrypted</span>
                )}
                <span className={`ml-2 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? '● Online' : '● Offline'}
                </span>
              </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4" />
                </Button>
                {hasEnterprise && (
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Messages or Thread View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeThread ? (
                // Thread View
                <>
                  {/* Thread Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToConversation}
                        className="p-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <Thread className="w-5 h-5" />
                          <span>{activeThread.name}</span>
                        </h3>
                        <p className="text-sm text-gray-500">
                          {activeThread.participants.length} participant{activeThread.participants.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge color="blue" className="text-xs">
                        {activeThread.type}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Users className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Thread Messages */}
                  {threadMessages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(threadMessages[index - 1]?.timestamp);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center mb-4">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start space-x-3">
                          <Avatar size={32} nameOrEmail={message.sender.name} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {message.sender.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(message.timestamp)}
                              </span>
                              {message.edited && (
                                <span className="text-xs text-gray-400">(edited)</span>
                              )}
                              {getMessageStatus(message)}
                            </div>
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">
                              {message.content}
                            </div>
                            {message.fileReferences && message.fileReferences.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.fileReferences.map((file) => (
                                  <div key={file.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                    <File className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{file.fileName}</span>
                                    <Button variant="ghost" size="sm" className="p-1">
                                      <File className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.reactions.map((reaction, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleReaction(message.id, reaction.emoji)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${
                                      hasUserReacted(message, reaction.emoji)
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span>{reaction.users.length}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                // Conversation View
                messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);
                  
                  return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center mb-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <Avatar size={32} nameOrEmail={message.sender.name} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.sender.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.edited && (
                            <span className="text-xs text-gray-400">(edited)</span>
                          )}
                          {getMessageStatus(message)}
                          {hasEnterprise && message.encrypted && (
                            <Key className="w-3 h-3 text-green-500" />
                          )}
                          {hasEnterprise && message.moderationStatus && (
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              message.moderationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              message.moderationStatus === 'flagged' ? 'bg-red-100 text-red-800' :
                              message.moderationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {message.moderationStatus}
                            </span>
                          )}
                        </div>
                        <div 
                          className="bg-gray-50 rounded-lg p-3 max-w-md relative group"
                          onContextMenu={(e) => handleContextMenu(e, message.id)}
                        >
                          {editingMessage === message.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleSaveEdit(message.id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-900">{message.content}</p>
                          )}
                          
                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getGroupedReactions(message).map((reaction, index) => (
                                <button
                                  key={`${reaction.emoji}-${index}`}
                                  onClick={() => reaction.hasReacted 
                                    ? handleReaction(message.id, reaction.emoji)
                                    : handleQuickReaction(message.id, reaction.emoji)
                                  }
                                  className={`px-2 py-1 rounded-full text-xs transition-colors ${
                                    reaction.hasReacted
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <span className="mr-1">{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick Reactions */}
                          {showQuickReactionsFor === message.id && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                              <div className="flex space-x-1">
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleQuickReaction(message.id, emoji)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <span className="text-lg">{emoji}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                            <button
                              onClick={() => setShowQuickReactionsFor(showQuickReactionsFor === message.id ? null : message.id)}
                              className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-opacity-100"
                              aria-label="Add reaction"
                            >
                              <Smile className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReplyToMessage(message)}
                              className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-opacity-100"
                              aria-label="Reply to message"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
              <div ref={messagesEndRef} />

            {/* Context Menu */}
            {showContextMenu && (
              <div 
                className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32"
                style={{ 
                  left: contextMenuPosition.x, 
                  top: contextMenuPosition.y 
                }}
              >
                <button
                  onClick={() => {
                    const message = messages.find(m => m.id === showContextMenu);
                    if (message) {
                      handleEditMessage(message);
                    }
                    setShowContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    const message = messages.find(m => m.id === showContextMenu);
                    if (message) {
                      handleDeleteMessage(message);
                    }
                    setShowContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                >
                  <X className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {typingUsers.length === 1 
                      ? `${typingUsers[0]} is typing...`
                      : `${typingUsers.length} people are typing...`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Attachments ({selectedFiles.length})</span>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeSelectedFile(file.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload Panel */}
              {showFileUpload && (
                <div className="mb-3">
                  <ChatFileUpload
                    onFileSelect={handleFileSelect}
                    disabled={uploading}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleFileUpload}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTypingChange();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={activeThread ? handleSendThreadMessage : handleSendMessage} 
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploading}
                >
                  {uploading ? <Spinner size={16} /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a channel</h3>
              <p className="text-gray-600">Choose a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Panel */}
      {hasEnterprise && showEnterprisePanel && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Enterprise Features</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEnterprisePanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeEnterpriseTab === 'retention' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveEnterpriseTab('retention')}
                >
                  Retention
                </Button>
                <Button
                  variant={activeEnterpriseTab === 'moderation' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveEnterpriseTab('moderation')}
                >
                  Moderation
                </Button>
                <Button
                  variant={activeEnterpriseTab === 'encryption' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveEnterpriseTab('encryption')}
                >
                  Encryption
                </Button>
                <Button
                  variant={activeEnterpriseTab === 'analytics' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveEnterpriseTab('analytics')}
                >
                  Analytics
                </Button>
                <Button
                  variant={activeEnterpriseTab === 'compliance' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveEnterpriseTab('compliance')}
                >
                  Compliance
                </Button>
              </div>
            
            {activeEnterpriseTab === 'retention' && (
              <MessageRetentionPanel />
            )}
            {activeEnterpriseTab === 'moderation' && (
              <ContentModerationPanel />
            )}
            {activeEnterpriseTab === 'encryption' && (
              <EncryptionPanel />
            )}
            {activeEnterpriseTab === 'analytics' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Message Analytics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                    <div className="text-sm text-gray-600">Messages Today</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">98.5%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">23</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">5.2s</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Top Conversations</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>#general</span>
                      <span className="text-gray-600">342 messages</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>#marketing</span>
                      <span className="text-gray-600">198 messages</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>#development</span>
                      <span className="text-gray-600">156 messages</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeEnterpriseTab === 'compliance' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Compliance Dashboard</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">GDPR Compliance</span>
                    </div>
                    <Badge color="green">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium">SOX Audit</span>
                    </div>
                    <Badge color="yellow">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">HIPAA Ready</span>
                    </div>
                    <Badge color="blue">Ready</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Recent Audit Events</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Message retention policy updated</span>
                      <span className="text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Encryption keys rotated</span>
                      <span className="text-gray-500">1 day ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance report generated</span>
                      <span className="text-gray-500">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        multiple
      />

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Thread</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thread Name
                </label>
                <input
                  type="text"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter thread name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thread Type
                </label>
                <select
                  value={newThreadType}
                  onChange={(e) => setNewThreadType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MESSAGE">Message Thread</option>
                  <option value="TOPIC">Topic Discussion</option>
                  <option value="PROJECT">Project Thread</option>
                  <option value="DECISION">Decision Thread</option>
                  <option value="DOCUMENTATION">Documentation Thread</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewThreadModal(false);
                  setNewThreadName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedChannel && newThreadName.trim()) {
                    createThread(selectedChannel.id, newThreadName.trim(), newThreadType);
                  }
                }}
                disabled={!newThreadName.trim()}
              >
                Create Thread
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reply to Message Modal */}
      {replyingToMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to Message</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>{replyingToMessage.sender.name}:</strong>
              </p>
              <p className="text-sm text-gray-900">{replyingToMessage.content}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thread Name
                </label>
                <input
                  type="text"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter thread name..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setReplyingToMessage(null);
                  setNewThreadName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (replyingToMessage) {
                    createThreadFromMessage(replyingToMessage);
                  }
                }}
                disabled={!newThreadName.trim()}
              >
                Create Thread
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
