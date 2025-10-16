'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Alert, Avatar } from 'shared/components';
import { 
  MessageSquare, 
  Send, 
  Plus,
  Search,
  Users,
  Hash,
  Bell,
  BellOff,
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';

interface BusinessConversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: {
      name: string;
      email: string;
    };
  };
  participants: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
  }>;
  unreadCount: number;
  isMuted: boolean;
}

interface BusinessMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

export default function WorkChatPage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params?.id as string;

  const [conversations, setConversations] = useState<BusinessConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<BusinessMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessConversations();
    }
  }, [businessId, session?.accessToken]);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadBusinessConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to get business conversations
      // const response = await businessAPI.getBusinessConversations(businessId);
      
      // Mock data for now
      const mockConversations: BusinessConversation[] = [
        {
          id: '1',
          name: 'General',
          type: 'channel',
          lastMessage: {
            content: 'Welcome to the general channel!',
            timestamp: '2024-01-15T10:00:00Z',
            sender: {
              name: 'John Doe',
              email: 'john@company.com'
            }
          },
          participants: [
            { id: '1', name: 'John Doe', email: 'john@company.com', isOnline: true },
            { id: '2', name: 'Jane Smith', email: 'jane@company.com', isOnline: false },
            { id: '3', name: 'Mike Johnson', email: 'mike@company.com', isOnline: true }
          ],
          unreadCount: 3,
          isMuted: false
        },
        {
          id: '2',
          name: 'Project Alpha',
          type: 'group',
          lastMessage: {
            content: 'The deadline is next Friday',
            timestamp: '2024-01-14T16:30:00Z',
            sender: {
              name: 'Jane Smith',
              email: 'jane@company.com'
            }
          },
          participants: [
            { id: '2', name: 'Jane Smith', email: 'jane@company.com', isOnline: false },
            { id: '3', name: 'Mike Johnson', email: 'mike@company.com', isOnline: true }
          ],
          unreadCount: 0,
          isMuted: false
        },
        {
          id: '3',
          name: 'Sarah Wilson',
          type: 'direct',
          lastMessage: {
            content: 'Thanks for the update!',
            timestamp: '2024-01-14T14:20:00Z',
            sender: {
              name: 'Sarah Wilson',
              email: 'sarah@company.com'
            }
          },
          participants: [
            { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', isOnline: true }
          ],
          unreadCount: 1,
          isMuted: false
        }
      ];

      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      // TODO: Replace with actual API call to get conversation messages
      // const response = await businessAPI.getConversationMessages(conversationId);
      
      // Mock data for now
      const mockMessages: BusinessMessage[] = [
        {
          id: '1',
          content: 'Welcome to the general channel!',
          timestamp: '2024-01-15T10:00:00Z',
          sender: {
            id: '1',
            name: 'John Doe',
            email: 'john@company.com'
          },
          type: 'text'
        },
        {
          id: '2',
          content: 'Thanks for setting this up!',
          timestamp: '2024-01-15T10:05:00Z',
          sender: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@company.com'
          },
          type: 'text'
        },
        {
          id: '3',
          content: 'Looking forward to collaborating with everyone',
          timestamp: '2024-01-15T10:10:00Z',
          sender: {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike@company.com'
          },
          type: 'text'
        }
      ];

      setMessages(mockMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // TODO: Replace with actual API call to send message
      // await businessAPI.sendMessage(selectedConversation, newMessage);
      
      const message: BusinessMessage = {
        id: Date.now().toString(),
        content: newMessage,
        timestamp: new Date().toISOString(),
        sender: {
          id: session?.user?.id || '1',
          name: session?.user?.name || 'You',
          email: session?.user?.email || 'you@company.com'
        },
        type: 'text'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Chat">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Chat</h1>
            <p className="text-gray-600">Business team communication</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Channel
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {conversation.type === 'channel' ? (
                            <Hash className="w-5 h-5 text-gray-500" />
                          ) : conversation.type === 'group' ? (
                            <Users className="w-5 h-5 text-gray-500" />
                          ) : (
                            <Avatar size={20} nameOrEmail={conversation.name} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{conversation.name}</h3>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage.sender.name}: {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                        {conversation.isMuted && (
                          <BellOff className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {currentConversation.type === 'channel' ? (
                          <Hash className="w-5 h-5 text-gray-500" />
                        ) : currentConversation.type === 'group' ? (
                          <Users className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Avatar size={32} nameOrEmail={currentConversation.name} />
                        )}
                        <div>
                          <h2 className="font-semibold text-gray-900">{currentConversation.name}</h2>
                          <p className="text-sm text-gray-500">
                            {currentConversation.participants.length} member{currentConversation.participants.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Bell className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-3">
                        <Avatar size={32} nameOrEmail={message.sender.name} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{message.sender.name}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>
                      <Button variant="ghost" size="sm">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the sidebar to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
