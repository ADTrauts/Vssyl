'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityType } from '@/types/activity';
import { useActivity } from '@/contexts/activity-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  MessageSquare,
  Tag,
  Users,
  Plus,
  Archive,
  Trash2,
  Eye,
  ThumbsUp,
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ActivityFeedProps {
  threadId?: string;
  limit?: number;
}

// Inline Activity type for local use
interface Activity {
  type: string;
  data: any;
  timestamp: Date;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'edit':
      return <Edit className="w-4 h-4" />;
    case 'comment':
      return <MessageSquare className="w-4 h-4" />;
    case 'tag_update':
      return <Tag className="w-4 h-4" />;
    case 'participant_change':
      return <Users className="w-4 h-4" />;
    case 'thread_create':
      return <Plus className="w-4 h-4" />;
    case 'thread_archive':
      return <Archive className="w-4 h-4" />;
    case 'thread_delete':
      return <Trash2 className="w-4 h-4" />;
    case 'view':
      return <Eye className="w-4 h-4" />;
    case 'reaction':
      return <ThumbsUp className="w-4 h-4" />;
    default:
      return null;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'edit':
      return 'bg-blue-100 text-blue-800';
    case 'comment':
      return 'bg-green-100 text-green-800';
    case 'tag_update':
      return 'bg-purple-100 text-purple-800';
    case 'participant_change':
      return 'bg-yellow-100 text-yellow-800';
    case 'thread_create':
      return 'bg-emerald-100 text-emerald-800';
    case 'thread_archive':
      return 'bg-orange-100 text-orange-800';
    case 'thread_delete':
      return 'bg-red-100 text-red-800';
    case 'view':
      return 'bg-gray-100 text-gray-800';
    case 'reaction':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  threadId,
  limit = 10,
}) => {
  const {
    activities: contextActivities,
    filterActivities,
    realtimeActivities,
  } = useActivity();
  const { subscribeToThread, unsubscribeFromThread, subscribeToUser, unsubscribeFromUser } = useWebSocket();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeUsers = realtimeActivities
    .filter(activity => !threadId || activity.threadId === threadId)
    .reduce((acc, activity) => {
      if (activity.userCount) {
        acc[activity.type] = (acc[activity.type] || 0) + activity.userCount;
      }
      return acc;
    }, {} as Record<ActivityType, number>);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const renderActivity = (activity: Activity) => {
    const { type, data, timestamp } = activity;

    switch (type) {
      case 'thread:activity':
        return (
          <div key={timestamp.toString()} className="activity-item">
            <p className="activity-message">
              New activity in thread: {data.threadTitle}
            </p>
            <span className="activity-time">
              {formatDistanceToNow(new Date(timestamp))} ago
            </span>
          </div>
        );
      case 'user:activity':
        return (
          <div key={timestamp.toString()} className="activity-item">
            <p className="activity-message">
              {data.userName} {data.action}
            </p>
            <span className="activity-time">
              {formatDistanceToNow(new Date(timestamp))} ago
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(activeUsers).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Current Activity</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeUsers).map(([type, count]) => (
              <Badge
                key={type}
                className={getActivityColor(type as ActivityType)}
              >
                {getActivityIcon(type as ActivityType)}
                <span className="ml-1">
                  {count} user{count !== 1 ? 's' : ''} {type.replace('_', ' ')}
                </span>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.map(renderActivity)
        ) : (
          <p>No recent activities</p>
        )}
      </div>
    </div>
  );
}; 