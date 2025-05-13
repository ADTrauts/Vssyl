import type { OnlineStatusType } from '@/components/chat/OnlineStatus';

export type MessageType = 'text' | 'file' | 'image' | 'system';
export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  editedAt?: string;
  status: MessageStatusType;
  threadId?: string;
  files?: ChatFile[];
}

export interface ChatFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  progress?: number;
}

export interface Thread {
  id: string;
  messageId: string;
  parentMessageId: string;
  messages: Message[];
  participants: { id: string; name: string; avatarUrl?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  messages: Message[];
  threads: Record<string, Thread>;
  activeThreadId: string | null;
  isTyping: boolean;
  typingUsers: Set<string>;
  userStatuses: Map<string, OnlineStatusType>;
  error: string | null;
  hasMoreMessages: boolean;
  currentPage: number;
  pageSize: number;
}

export interface ExtendedChatState extends ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messageQueue: Message[];
  failedMessages: Set<string>;
  uploadProgress: Record<string, number>;
  readReceipts: Record<string, { userId: string; timestamp: string }[]>;
}

export interface ChatContextType {
  state: ExtendedChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  createThread: (messageId: string, content: string) => Promise<Thread>;
  loadMoreMessages: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  handleFileUpload: (files: File[]) => Promise<void>;
}

export type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_MESSAGES'; payload: { messages: Message[]; hasMore: boolean } }
  | { type: 'SET_THREADS'; payload: Record<string, Thread> }
  | { type: 'SET_THREAD'; payload: { threadId: string; thread: Thread } }
  | { type: 'SET_ACTIVE_THREAD'; payload: string | null }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_TYPING_USER'; payload: string }
  | { type: 'REMOVE_TYPING_USER'; payload: string }
  | { type: 'SET_USER_STATUS'; payload: { userId: string; status: OnlineStatusType } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; title: string } }
  | { type: 'EDIT_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: { fileId: string; progress: number } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatusType } };

export type ChatEvent =
  | { type: 'message'; payload: Message }
  | { type: 'typing'; payload: { userId: string; isTyping: boolean } }
  | { type: 'status'; payload: { userId: string; status: OnlineStatusType } }
  | { type: 'reaction'; payload: { messageId: string; userId: string; emoji: string } }
  | { type: 'read'; payload: { messageId: string; userId: string } };

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
} 