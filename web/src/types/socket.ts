import type { Thread, ThreadActivity } from './thread';

/**
 * Base interface for all WebSocket messages
 */
export interface WebSocketMessage<T = unknown> {
  /** Type of the message */
  type: string;
  /** Data payload of the message */
  data: T;
  /** Timestamp when the message was sent */
  timestamp: number;
}

/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** URL to user's avatar image */
  avatar?: string;
}

/**
 * Represents a read receipt for a message
 */
export interface ReadReceipt {
  /** ID of the message that was read */
  messageId: string;
  /** ID of the user who read the message */
  userId: string;
  /** Timestamp when the message was read */
  readAt: string;
}

/**
 * Represents a collaborator on a thread
 */
export interface Collaborator {
  /** Unique identifier for the collaborator */
  id: string;
  /** ID of the user who is collaborating */
  userId: string;
  /** Role of the collaborator in the thread */
  role: 'owner' | 'editor' | 'viewer';
  /** Timestamp when the user joined the thread */
  joinedAt: string;
}

/**
 * Represents a version of a thread
 */
export interface Version {
  /** Unique identifier for the version */
  id: string;
  /** ID of the thread this version belongs to */
  threadId: string;
  /** ID of the user who created this version */
  userId: string;
  /** Content of this version */
  content: string;
  /** Timestamp when this version was created */
  createdAt: string;
}

/**
 * Represents a comment on a thread
 */
export interface Comment {
  /** Unique identifier for the comment */
  id: string;
  /** ID of the thread this comment belongs to */
  threadId: string;
  /** ID of the user who created this comment */
  userId: string;
  /** Content of this comment */
  content: string;
  /** Timestamp when this comment was created */
  createdAt: string;
  /** Timestamp when this comment was last updated */
  updatedAt: string;
}

/**
 * Represents an insight about a thread
 */
export interface Insight {
  /** Unique identifier for the insight */
  id: string;
  /** ID of the thread this insight belongs to */
  threadId: string;
  /** ID of the user who created this insight */
  userId: string;
  /** Type of insight */
  type: 'suggestion' | 'question' | 'observation';
  /** Content of this insight */
  content: string;
  /** Timestamp when this insight was created */
  createdAt: string;
}

/**
 * Events that the server can emit to the client
 */
export interface ServerToClientEvents {
  /** Emitted when typing status changes */
  'thread:typing': (data: { userId: string; isTyping: boolean }) => void;
  /** Emitted when a message is read */
  'thread:read': (data: { messageId: string; userId: string }) => void;
  /** Emitted when thread collaborators change */
  'thread:collaborators': (data: { collaborators: Collaborator[] }) => void;
  /** Emitted when thread versions change */
  'thread:versions': (data: { versions: Version[] }) => void;
  /** Emitted when thread comments change */
  'thread:comments': (data: { comments: Comment[] }) => void;
  /** Emitted when thread insights change */
  'thread:insights': (data: { insights: Insight[] }) => void;
  /** Emitted when thread is updated */
  'thread:update': (thread: Thread) => void;
  /** Emitted when thread activity occurs */
  'thread:activity': (activity: ThreadActivity) => void;
}

/**
 * Events that the client can emit to the server
 */
export interface ClientToServerEvents {
  /** Emitted when joining a thread */
  'thread:join': (threadId: string) => void;
  /** Emitted when leaving a thread */
  'thread:leave': (threadId: string) => void;
  /** Emitted when typing status changes */
  'thread:typing': (data: { threadId: string; isTyping: boolean }) => void;
  /** Emitted when a message is read */
  'thread:read': (data: { threadId: string; messageId: string }) => void;
  /** Emitted when adding a collaborator */
  'thread:collaborator:add': (data: { threadId: string; userId: string; role: Collaborator['role'] }) => void;
  /** Emitted when removing a collaborator */
  'thread:collaborator:remove': (data: { threadId: string; userId: string }) => void;
  /** Emitted when creating a new version */
  'thread:version:create': (data: { threadId: string; content: string }) => void;
  /** Emitted when creating a new comment */
  'thread:comment:create': (data: { threadId: string; content: string }) => void;
  /** Emitted when updating a comment */
  'thread:comment:update': (data: { threadId: string; commentId: string; content: string }) => void;
  /** Emitted when deleting a comment */
  'thread:comment:delete': (data: { threadId: string; commentId: string }) => void;
  /** Emitted when creating a new insight */
  'thread:insight:create': (data: { threadId: string; type: Insight['type']; content: string }) => void;
  /** Emitted when updating a thread */
  'thread:update': (data: { threadId: string; updates: Partial<Thread> }) => void;
} 