export interface Conversation {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  participants: ConversationParticipant[];
  messages: Message[];
  threads: Thread[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'GUEST';
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    name?: string;
    email: string;
  };
  content: string;
  type: 'TEXT' | 'FILE' | 'SYSTEM' | 'REACTION';
  fileReferences: FileReference[];
  reactions: MessageReaction[];
  readReceipts: ReadReceipt[];
  threadId?: string;
  replyToId?: string;
  replyTo?: Message;
  replies: Message[];
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface FileReference {
  id: string;
  messageId: string;
  fileId: string;
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  };
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  emoji: string;
  createdAt: string;
}

export interface ReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  readAt: string;
}

export interface Thread {
  id: string;
  conversationId: string;
  name?: string;
  type: 'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION';
  messages: Message[];
  participants: ThreadParticipant[];
  parentId?: string;
  parent?: Thread;
  children: Thread[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ThreadParticipant {
  id: string;
  threadId: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'GUEST';
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
}

// API Request/Response Types

export interface CreateConversationRequest {
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  participantIds: string[];
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  type?: 'TEXT' | 'FILE' | 'SYSTEM' | 'REACTION';
  fileIds?: string[];
  threadId?: string;
  replyToId?: string;
}

export interface CreateThreadRequest {
  conversationId: string;
  name?: string;
  type?: 'MESSAGE' | 'TOPIC' | 'PROJECT' | 'DECISION' | 'DOCUMENTATION';
  parentId?: string;
  participantIds?: string[];
}

export interface AddReactionRequest {
  messageId: string;
  emoji: string;
}

export interface MarkAsReadRequest {
  messageId: string;
}

// WebSocket Event Types

export interface ChatEvent {
  type: 'message' | 'reaction' | 'typing' | 'presence' | 'read_receipt';
  data: Record<string, unknown>;
  conversationId: string;
  timestamp: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

// UI State Types

export interface ChatPanelState {
  globalLeftSidebarExpanded: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  rightPanelExpanded: boolean;
  isMobile: boolean;
  isTablet: boolean;
  activeConversationId: string | null;
  activeThreadId: string | null;
  searchQuery: string;
  activeFilters: string[];
  expandedTeams: string[];
}

export interface ConversationListState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  activeFilters: string[];
  selectedConversationId: string | null;
}

export interface MessageListState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  typingUsers: string[];
  scrollPosition: number;
}

// Enhanced User Types for Chat with Member Management Integration

export interface ChatUser {
  id: string;
  name?: string;
  email: string;
  createdAt: string;
  connectionStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  relationshipId: string | null;
  organization?: {
    id: string;
    name: string;
    type: 'business' | 'institution';
    role: string;
  } | null;
  isColleague: boolean;
  canConnect: boolean;
}

export interface ChatUserSelectionProps {
  value: ChatUser[];
  onChange: (users: ChatUser[]) => void;
  placeholder?: string;
  showConnectionActions?: boolean;
  onConnectRequest?: (userId: string) => Promise<void>;
  dashboardId?: string;
} 