'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Avatar, Badge, Spinner } from 'shared/components';
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
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  edited?: boolean;
  deleted?: boolean;
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    online: boolean;
    role: string;
  }>;
  isPrivate?: boolean;
}

interface ChatModuleProps {
  businessId: string;
  className?: string;
}

export default function ChatModule({ businessId, className = '' }: ChatModuleProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockChannels: ChatChannel[] = [
      {
        id: '1',
        name: 'general',
        type: 'channel',
        unreadCount: 3,
        lastMessage: 'Great work on the Q4 report!',
        lastMessageTime: '2024-01-15T10:30:00Z',
        members: [
          { id: '1', name: 'John Doe', online: true, role: 'Admin' },
          { id: '2', name: 'Jane Smith', online: false, role: 'Manager' },
          { id: '3', name: 'Mike Johnson', online: true, role: 'Employee' }
        ]
      },
      {
        id: '2',
        name: 'marketing-team',
        type: 'channel',
        unreadCount: 0,
        lastMessage: 'Campaign launch scheduled for next week',
        lastMessageTime: '2024-01-15T09:15:00Z',
        members: [
          { id: '2', name: 'Jane Smith', online: false, role: 'Manager' },
          { id: '4', name: 'Sarah Wilson', online: true, role: 'Employee' }
        ]
      },
      {
        id: '3',
        name: 'John Doe',
        type: 'direct',
        unreadCount: 1,
        lastMessage: 'Can you review the budget proposal?',
        lastMessageTime: '2024-01-15T08:45:00Z',
        members: [
          { id: '1', name: 'John Doe', online: true, role: 'Admin' }
        ]
      }
    ];

    setChannels(mockChannels);
    setSelectedChannel(mockChannels[0]);
    setLoading(false);
  }, []);

  // Mock messages for selected channel
  useEffect(() => {
    if (selectedChannel) {
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          content: 'Good morning team! How are we doing today?',
          sender: { id: '1', name: 'John Doe', role: 'Admin' },
          timestamp: '2024-01-15T08:00:00Z',
          type: 'text'
        },
        {
          id: '2',
          content: 'Morning! We\'re making great progress on the Q4 report.',
          sender: { id: '2', name: 'Jane Smith', role: 'Manager' },
          timestamp: '2024-01-15T08:05:00Z',
          type: 'text'
        },
        {
          id: '3',
          content: 'I\'ve finished the financial analysis section.',
          sender: { id: '3', name: 'Mike Johnson', role: 'Employee' },
          timestamp: '2024-01-15T08:10:00Z',
          type: 'text'
        },
        {
          id: '4',
          content: 'Great work on the Q4 report!',
          sender: { id: '1', name: 'John Doe', role: 'Admin' },
          timestamp: '2024-01-15T10:30:00Z',
          type: 'text'
        }
      ];

      setMessages(mockMessages);
    }
  }, [selectedChannel]);

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: { id: 'current-user', name: 'Current User', role: 'Employee' },
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    toast.success('Message sent');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: `📎 ${file.name}`,
        sender: { id: 'current-user', name: 'Current User', role: 'Employee' },
        timestamp: new Date().toISOString(),
        type: 'file'
      };

      setMessages(prev => [...prev, message]);
      toast.success(`File uploaded: ${file.name}`);
    }
  };

  const handleChannelSelect = (channel: ChatChannel) => {
    setSelectedChannel(channel);
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
    <div className={`flex h-[600px] bg-white rounded-lg border ${className}`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="relative mt-3">
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
                    {channel.unreadCount > 0 && (
                      <Badge color="blue" className="text-xs">
                        {channel.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {channel.lastMessage && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {channel.lastMessage}
                    </p>
                  )}
                  {channel.lastMessageTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(channel.lastMessageTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
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
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 max-w-md">
                          <p className="text-sm text-gray-900">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
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
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />
    </div>
  );
}
