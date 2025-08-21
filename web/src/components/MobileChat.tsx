import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Avatar, Badge, Spinner } from 'shared/components';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Smile, 
  ArrowLeft, 
  MoreVertical,
  Search,
  Phone,
  Video,
  Info
} from 'lucide-react';
import { Conversation, Message } from 'shared/types/chat';
import { chatAPI } from '../api/chat';

interface MobileChatProps {
  conversation: Conversation | null;
  onBack: () => void;
  className?: string;
}

export default function MobileChat({ conversation, onBack, className = '' }: MobileChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages
  useEffect(() => {
    if (!conversation?.id || !session?.accessToken) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await chatAPI.getMessages(conversation.id, session.accessToken);
        setMessages(response);
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation?.id, session?.accessToken]);

  // WebSocket connection
  useEffect(() => {
    if (!session?.accessToken) return;

    const connectToChat = async () => {
      try {
        await chatAPI.connect();
      } catch (error) {
        console.error('Failed to connect to chat:', error);
      }
    };

    connectToChat();

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation?.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      }
    };

    chatAPI.on('message:new', handleNewMessage);

    if (conversation?.id) {
      chatAPI.joinConversation(conversation.id);
    }

    return () => {
      chatAPI.off('message:new', handleNewMessage);
      if (conversation?.id) {
        chatAPI.leaveConversation(conversation.id);
      }
    };
  }, [conversation?.id, session?.accessToken]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !session?.accessToken) return;

    setIsSending(true);
    try {
      const message = await chatAPI.sendMessage(
        conversation.id,
        newMessage,
        session.accessToken
      );
      setNewMessage('');
      setMessages(prev => [...prev, message]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if message is from current user
  const isOwnMessage = (message: Message) => {
    return message.sender?.email === session?.user?.email;
  };

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

  // Get user avatar
  const getUserAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  if (!session?.accessToken) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          Please log in to access chat
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar
            src={getUserAvatar(getConversationName(conversation))}
            alt={getConversationName(conversation)}
            size={40}
          />
          <div>
            <h2 className="font-semibold text-gray-900">{getConversationName(conversation)}</h2>
            <p className="text-sm text-gray-500">
              {conversation.type === 'DIRECT' ? 'Direct message' : `${conversation.participants?.length || 0} members`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Video className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={() => setShowOptions(!showOptions)}
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Options Menu */}
      {showOptions && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="space-y-2">
            <button className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-100">
              <Search className="w-5 h-5 text-gray-600" />
              <span>Search messages</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-100">
              <Info className="w-5 h-5 text-gray-600" />
              <span>Conversation info</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={32} />
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = isOwnMessage(message);
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Avatar
                        src={getUserAvatar(message.sender?.name || '')}
                        alt={message.sender?.name || 'User'}
                        size={24}
                      />
                      <span className="text-xs text-gray-500">
                        {message.sender?.name || message.sender?.email}
                      </span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isOwn 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
            className="p-3 rounded-full"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-8 gap-1">
              {['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '😎', '🤗', '👋', '💪', '✨', '🌟', '💯', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-2 text-xl hover:bg-gray-200 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 