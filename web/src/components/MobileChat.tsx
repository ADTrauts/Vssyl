import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Avatar, Spinner, ContextMenu, ContextMenuItem, ConfirmModal } from 'shared/components';
import {
  Send,
  Smile,
  ArrowLeft,
  Reply,
  Trash2,
  X,
} from 'lucide-react';
import { Conversation, Message } from 'shared/types/chat';
import { chatAPI } from '../api/chat';
import { useGlobalTrash } from '../contexts/GlobalTrashContext';
import { toast } from 'react-hot-toast';

interface MobileChatProps {
  conversation: Conversation | null;
  onBack: () => void;
  className?: string;
}

const COMMON_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface MobileMessageItemProps {
  message: Message;
  isOwn: boolean;
  formatTime: (timestamp: string) => string;
  getUserAvatar: (name: string) => string;
  onReply: (message: Message) => void;
  onDelete: (message: Message) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const MobileMessageItem = React.memo(({
  message,
  isOwn,
  formatTime,
  getUserAvatar,
  onReply,
  onDelete,
  onAddReaction,
}: MobileMessageItemProps) => {
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
    {
      icon: <Smile className="w-4 h-4" />,
      label: 'React',
      submenu: COMMON_REACTION_EMOJIS.map((emoji) => ({
        label: emoji,
        onClick: () => onAddReaction(message.id, emoji),
      })),
    },
    { divider: true },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: 'Delete',
      destructive: true,
      onClick: () => onDelete(message),
    },
  ], [message, onReply, onDelete, onAddReaction]);

  const groupedReactions = useMemo(() => {
    if (!message.reactions?.length) return [];
    const map = new Map<string, number>();
    for (const reaction of message.reactions) {
      map.set(reaction.emoji, (map.get(reaction.emoji) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [message.reactions]);

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      onContextMenu={handleContextMenu}
    >
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <Avatar
              src={getUserAvatar(message.sender?.name || '')}
              alt={message.sender?.name || 'User'}
              size={24}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {message.sender?.name || message.sender?.email}
            </span>
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-gray-100 rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatTime(message.createdAt)}
          </p>
        </div>
        {groupedReactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {groupedReactions.map(({ emoji, count }) => (
              <span
                key={emoji}
                className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full"
              >
                {emoji} {count > 1 ? count : ''}
              </span>
            ))}
          </div>
        )}
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

MobileMessageItem.displayName = 'MobileMessageItem';

export default function MobileChat({ conversation, onBack, className = '' }: MobileChatProps) {
  const { data: session } = useSession();
  const { trashItem } = useGlobalTrash();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [pendingMessageToTrash, setPendingMessageToTrash] = useState<Message | null>(null);
  const [isMovingMessageToTrash, setIsMovingMessageToTrash] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id || !session?.accessToken) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await chatAPI.getMessages(conversation.id, session.accessToken);
      setMessages(response);
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to load messages');
      console.error('Failed to load messages:', { message: err.message, stack: err.stack });
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversation?.id, session?.accessToken]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const connectToChat = async () => {
      try {
        await chatAPI.connect();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Failed to connect');
        console.error('Failed to connect to chat:', { message: err.message, stack: err.stack });
      }
    };

    connectToChat();

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation?.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      }
    };

    const handleMessageTrashed = async (event: Event) => {
      const detail = (event as CustomEvent<{ messageId: string; conversationId?: string }>).detail;
      if (detail?.conversationId === conversation?.id) {
        setMessages((prev) => prev.filter((m) => m.id !== detail.messageId));
      }
    };

    chatAPI.on('message:new', handleNewMessage);
    window.addEventListener('messageTrashed', handleMessageTrashed);

    if (conversation?.id) {
      chatAPI.joinConversation(conversation.id);
    }

    return () => {
      chatAPI.off('message:new', handleNewMessage);
      window.removeEventListener('messageTrashed', handleMessageTrashed);
      if (conversation?.id) {
        chatAPI.leaveConversation(conversation.id);
      }
    };
  }, [conversation?.id, session?.accessToken]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !session?.accessToken) return;

    setIsSending(true);
    try {
      const message = await chatAPI.sendMessage(
        conversation.id,
        newMessage,
        session.accessToken,
        undefined,
        replyToMessage?.id
      );
      setNewMessage('');
      setReplyToMessage(null);
      setMessages((prev) => [...prev, message]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to send message');
      console.error('Failed to send message:', { message: err.message, stack: err.stack });
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender?.email === session?.user?.email;
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;

    if (conv.type === 'DIRECT' && conv.participants?.length > 0) {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== session?.user?.email
      );
      return otherParticipant?.user?.name || otherParticipant?.user?.email || 'Direct Message';
    }

    return `${conv.type.charAt(0) + conv.type.slice(1).toLowerCase()} Chat`;
  };

  const getUserAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  const handleReply = useCallback((message: Message) => {
    setReplyToMessage(message);
    inputRef.current?.focus();
  }, []);

  const requestDeleteMessage = useCallback((message: Message) => {
    setPendingMessageToTrash(message);
  }, []);

  const executeDeleteMessage = useCallback(async () => {
    const message = pendingMessageToTrash;
    if (!message) return;

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

      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      toast.success('Message moved to trash');
      setPendingMessageToTrash(null);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to delete message');
      console.error('Failed to delete message:', { message: err.message, stack: err.stack });
      toast.error('Failed to move message to trash');
    } finally {
      setIsMovingMessageToTrash(false);
    }
  }, [pendingMessageToTrash, trashItem]);

  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!session?.accessToken) return;
    try {
      await chatAPI.addReaction(messageId, emoji, session.accessToken);
      await loadMessages();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to add reaction');
      console.error('Failed to add reaction:', { message: err.message, stack: err.stack });
      toast.error('Failed to add reaction');
    }
  }, [session?.accessToken, loadMessages]);

  if (!session?.accessToken) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please log in to access chat
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center space-x-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 flex-shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar
            src={getUserAvatar(getConversationName(conversation))}
            alt={getConversationName(conversation)}
            size={40}
          />
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {getConversationName(conversation)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.type === 'DIRECT'
                ? 'Direct message'
                : `${conversation.participants?.length || 0} members`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={32} />
          </div>
        ) : (
          messages.map((message) => (
            <MobileMessageItem
              key={message.id}
              message={message}
              isOwn={isOwnMessage(message)}
              formatTime={formatTime}
              getUserAvatar={getUserAvatar}
              onReply={handleReply}
              onDelete={requestDeleteMessage}
              onAddReaction={handleAddReaction}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply banner */}
      {replyToMessage && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Replying to</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {replyToMessage.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyToMessage(null)}
            className="p-1 flex-shrink-0"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              aria-label="Message input"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
            className="p-3 rounded-full"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-800 rounded-lg emoji-picker">
            <div className="grid grid-cols-8 gap-1">
              {['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '😎', '🤗', '👋', '💪', '✨', '🌟', '💯', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setNewMessage((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-2 text-xl hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingMessageToTrash !== null}
        onClose={() => setPendingMessageToTrash(null)}
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
