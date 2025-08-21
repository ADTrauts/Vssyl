import React from 'react';
import { UserCircleIcon, DocumentIcon, FolderIcon, PencilIcon, TrashIcon, UserPlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

type Activity = {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'share' | 'download';
  user: {
    id: string;
    name: string;
    email: string;
  };
  file: {
    id: string;
    name: string;
    type: string;
  };
  timestamp: string;
  details?: {
    sharedWith?: string;
    permission?: 'view' | 'edit';
  };
};

type ActivityListProps = {
  activities: Activity[];
  loading?: boolean;
};

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'create':
      return DocumentIcon;
    case 'edit':
      return PencilIcon;
    case 'delete':
      return TrashIcon;
    case 'share':
      return UserPlusIcon;
    case 'download':
      return ArrowDownTrayIcon;
    default:
      return DocumentIcon;
  }
};

const getActivityText = (activity: Activity) => {
  const { type, user, file, details } = activity;
  const itemName = file.name;

  switch (type) {
    case 'create':
      return `created file "${itemName}"`;
    case 'edit':
      return `edited file "${itemName}"`;
    case 'delete':
      return `deleted file "${itemName}"`;
    case 'share':
      return `shared file "${itemName}" with ${details?.sharedWith} (${details?.permission} access)`;
    case 'download':
      return `downloaded file "${itemName}"`;
    default:
      return `performed action on file "${itemName}"`;
  }
};

export const ActivityList: React.FC<ActivityListProps> = ({ activities, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.type);
        const activityText = getActivityText(activity);
        const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        });

        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{activity.user.name}</span>
                <span className="text-gray-500">{activityText}</span>
              </div>
              <div className="text-sm text-gray-500">{date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 