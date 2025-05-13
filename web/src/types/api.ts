import { User as PrismaUser } from '@prisma/client'

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  updatedAt: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbFolder {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface FileUploadRequest {
  file: File;
  folderId?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  file: File;
}

export interface FileUpdateRequest {
  name?: string;
  folderId?: string | null;
  isStarred?: boolean;
  tags?: string[];
}

export interface FolderResponse {
  folder: Folder;
  files: File[];
  subfolders: Folder[];
}

export interface Message {
  id: string;
  content: string;
  type: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  readBy?: User[];
  edited: boolean;
}

export interface Thread {
  id: string;
  title: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  parentMessageId?: string;
  isArchived: boolean;
  isPinned: boolean;
  lastActivityAt: string;
  categoryId?: string;
  creator?: User;
  parentMessage?: Message;
  category?: Category;
}

export interface Conversation {
  id: string;
  name?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  lastMessageId?: string;
  participants?: User[];
  messages?: Message[];
  lastMessage?: Message;
  lastReadBy?: User[];
  workspace?: Workspace;
}

export interface FileReference {
  id: string;
  fileId: string;
  messageId?: string;
  threadId?: string;
  conversationId?: string;
  type: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  file?: File;
  message?: Message;
  thread?: Thread;
  conversation?: Conversation;
}

export type Permission = 'READ' | 'WRITE';

export interface FileAccess {
  id: string;
  fileId: string;
  userId: string;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
} 