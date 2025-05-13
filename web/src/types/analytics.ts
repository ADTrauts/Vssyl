export interface ThreadActivity {
  id: string;
  threadId: string;
  userId: string;
  type: 'view' | 'comment' | 'like' | 'share';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ThreadAnalytics {
  id: string;
  threadId: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAnalytics {
  id: string;
  userId: string;
  threadCount: number;
  messageCount: number;
  averageResponseTime: number;
  participationRate: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementMetrics {
  threadId: string;
  views: number;
  comments: number;
  likes: number;
  shares: number;
  uniqueUsers: number;
  averageTimeSpent: number;
}

export interface ActivityTimeline {
  timestamp: Date;
  type: 'view' | 'comment' | 'like' | 'share';
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface ParticipantStats {
  userId: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  lastActiveAt: Date;
}

export interface HeatmapData {
  date: Date;
  hour: number;
  activityCount: number;
  uniqueUsers: number;
}

export interface AnalyticsExport {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  data: ThreadAnalytics[] | UserAnalytics[] | EngagementMetrics[];
  metadata?: Record<string, unknown>;
}

export interface SearchAnalytics {
  id: string;
  userId: string;
  query: string;
  resultCount: number;
  timestamp: Date;
  filters?: Record<string, unknown>;
}

export interface ThreadPresence {
  id: string;
  threadId: string;
  userId: string;
  lastSeenAt: Date;
  status: 'online' | 'offline' | 'away';
} 