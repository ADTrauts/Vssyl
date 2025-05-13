import { DateRange } from 'react-day-picker';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'thread' | 'file' | 'folder';
  metadata: {
    author?: string;
    tags?: string[];
    size?: number;
    mimeType?: string;
    messageCount?: number;
    itemCount?: number;
    lastActivity?: Date;
  };
  score?: number;
}

export interface SearchFilter {
  type?: string[];
  dateRange?: DateRange;
  size?: {
    min: number;
    max: number;
  };
  author?: string;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchAnalytics {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: SearchFilter;
  userId: string;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: SearchFilter;
  userId: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: SearchFilter;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface SearchTrend {
  timeRange: string;
  topQueries: Array<{ query: string; count: number }>;
}

export interface UserBehavior {
  averageResultsPerQuery: number;
  commonFilters: Array<{ filter: string; count: number }>;
  timeOfDay: Array<{ hour: number; count: number }>;
}

export interface AnalyticsData {
  popularSearches: Array<{ query: string; count: number }>;
  searchTrends: SearchTrend[];
  userBehavior: UserBehavior;
} 