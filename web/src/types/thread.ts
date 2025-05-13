import { Message } from './chat';

export type ThreadStyle = 'SIDE_PANEL' | 'INLINE';
export type ThreadNotificationPreference = 'all' | 'mentions' | 'none';

export interface ThreadConfig {
  style: ThreadStyle;
  settings: {
    autoExpand: boolean;
    previewLines: number;
    notificationPreference: ThreadNotificationPreference;
  }
}

export interface Thread {
  id: string;
  parentMessageId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  participants: string[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    status?: 'open' | 'closed' | 'archived';
    priority?: 'low' | 'medium' | 'high';
  };
  isFollowing?: boolean;
}

export interface ThreadMessage {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
  reactions?: { [emoji: string]: string[] };
  attachments?: ThreadAttachment[];
}

export interface ThreadAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
}

export type UserType = 'ENTERPRISE' | 'STANDARD';

export interface ThreadContextType {
  activeThread: Thread | null;
  setActiveThread: (thread: Thread | null) => void;
  createThread: (parentMessageId: string, initialMessage: string) => Promise<Thread>;
  addMessageToThread: (threadId: string, message: Message) => Promise<void>;
  updateThread: (threadId: string, updates: Partial<Thread>) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;
  archiveThread: (threadId: string) => Promise<void>;
  getThreadMessages: (threadId: string) => Promise<Message[]>;
  getThreadParticipants: (threadId: string) => Promise<string[]>;
  userType: UserType;
}

export type ThreadType = 
  | 'message' 
  | 'topic' 
  | 'project' 
  | 'decision' 
  | 'documentation';

export interface BaseThread {
  id: string;
  type: ThreadType;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  participants: string[];
  isPinned: boolean;
  status: 'active' | 'archived' | 'deleted';
}

export interface MessageThread extends BaseThread {
  type: 'message';
  parentMessageId: string;
  conversationId: string;
  messages: string[];
}

export interface TopicThread extends BaseThread {
  type: 'topic';
  categoryId?: string;
  channelId?: string;
  tags: string[];
  resources: string[];
}

export interface ProjectThread extends BaseThread {
  type: 'project';
  startDate: Date;
  endDate?: Date;
  milestones: {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  progress: number;
}

export interface DecisionThread extends BaseThread {
  type: 'decision';
  options: {
    id: string;
    text: string;
    votes: string[];
  }[];
  deadline?: Date;
  status: 'open' | 'closed';
  result?: string;
}

export interface DocumentationThread extends BaseThread {
  type: 'documentation';
  content: string;
  version: number;
  history: {
    version: number;
    content: string;
    updatedBy: string;
    updatedAt: Date;
  }[];
}

export type Thread = 
  | MessageThread 
  | TopicThread 
  | ProjectThread 
  | DecisionThread 
  | DocumentationThread;

export interface ThreadParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'offline' | 'away';
}

export interface ThreadActivity {
  id: string;
  threadId: string;
  type: 'message' | 'vote' | 'milestone' | 'document' | 'status';
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface ThreadTemplate {
  id: string;
  name: string;
  description: string;
  type: ThreadType;
  defaultConfig: Partial<ThreadConfig>;
  defaultMetadata: Partial<Thread['metadata']>;
  isSystem: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadFilter {
  type?: ThreadType[];
  status?: ('active' | 'archived' | 'deleted')[];
  participants?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
}

export interface ThreadSearchResult {
  thread: Thread;
  relevance: number;
  highlights: {
    field: string;
    value: string;
    matches: { start: number; end: number }[];
  }[];
}

export interface ThreadStats {
  totalThreads: number;
  activeThreads: number;
  archivedThreads: number;
  averageResolutionTime: number;
  participantEngagement: {
    userId: string;
    messageCount: number;
    reactionCount: number;
    lastActivity: Date;
  }[];
  threadTypes: {
    type: ThreadType;
    count: number;
  }[];
} 