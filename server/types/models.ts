import { z } from 'zod';
import { userSchema, messageSchema, threadSchema, categorySchema } from '../validations/schemas';

// Base types
export type BaseModel = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

// User types
export type User = BaseModel & z.infer<typeof userSchema> & {
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  settings: UserSettings;
};

export type UserSettings = {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  language: string;
  timezone: string;
};

// Message types
export type Message = BaseModel & z.infer<typeof messageSchema> & {
  sender: User;
  readBy: string[];
  reactions: MessageReaction[];
  thread?: Thread;
};

export type MessageReaction = {
  emoji: string;
  userId: string;
  createdAt: Date;
};

// Thread types
export type Thread = BaseModel & z.infer<typeof threadSchema> & {
  messages: Message[];
  participants: User[];
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: User;
};

// Category types
export type Category = BaseModel & z.infer<typeof categorySchema> & {
  threads: Thread[];
  moderators: User[];
  rules: CategoryRule[];
  stats: CategoryStats;
};

export type CategoryRule = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryStats = {
  totalThreads: number;
  totalMessages: number;
  activeUsers: number;
  lastActivity: Date;
};

// Search types
export type SearchResult = {
  type: 'thread' | 'message' | 'user' | 'category';
  item: Thread | Message | User | Category;
  score: number;
  highlights: {
    field: string;
    snippet: string;
  }[];
};

// Analytics types
export type AnalyticsData = {
  period: string;
  metrics: {
    [key: string]: number;
  };
};

// Export types
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';
export type ExportOptions = {
  includeMetadata?: boolean;
  dateFormat?: string;
  timezone?: string;
  filters?: Record<string, unknown>;
}; 