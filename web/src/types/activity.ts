import { Thread, ThreadType } from './thread';

export type ActivityType = 
  | 'view'
  | 'edit'
  | 'comment'
  | 'status_change'
  | 'tag_update'
  | 'participant_change'
  | 'thread_create'
  | 'thread_archive'
  | 'thread_delete'
  | 'reaction';

export type ActivityStatus = 'pending' | 'completed' | 'failed';

export interface ThreadActivity {
  id: string;
  threadId: string;
  type: ActivityType;
  userId: string;
  timestamp: Date;
  status: ActivityStatus;
  metadata: {
    title?: string;
    description?: string;
    previousValue?: any;
    newValue?: any;
    changes?: Record<string, any>;
  };
}

export interface ActivityUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastActive?: Date;
}

export interface ThreadPresence {
  threadId: string;
  users: ActivityUser[];
  lastUpdated: Date;
}

export interface ActivityFilter {
  threadId?: string;
  userId?: string;
  type?: ActivityType[];
  status?: ActivityStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ActivityStats {
  totalActivities: number;
  activeUsers: number;
  activityByType: Record<ActivityType, number>;
  activityByThread: Record<string, number>;
  userEngagement: {
    userId: string;
    activityCount: number;
    lastActive: Date;
  }[];
}

export interface RealtimeActivity extends ThreadActivity {
  isActive: boolean;
  duration?: number;
  userCount?: number;
} 