'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Filter, 
  Clock, 
  MessageSquare, 
  Folder, 
  Users, 
  Building, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button, Badge, Alert } from 'shared/components';
import { AdvancedNotificationService, NotificationGroup, SmartFilter } from '../lib/advancedNotificationService';

interface NotificationGroupListProps {
  className?: string;
}

export default function NotificationGroupList({ className = '' }: NotificationGroupListProps) {
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [filters, setFilters] = useState<{
    highPriority: SmartFilter;
    unread: SmartFilter;
    recent: SmartFilter;
    byType: SmartFilter[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<{
    type?: string;
    priority?: 'high' | 'medium' | 'low';
    read?: boolean;
  }>({});

  const advancedService = AdvancedNotificationService.getInstance();

  useEffect(() => {
    loadGroupsAndFilters();
  }, [activeFilters]);

  const loadGroupsAndFilters = async () => {
    setLoading(true);
    setError(null);

    try {
      const [groupsData, filtersData] = await Promise.all([
        advancedService.getGroupedNotifications(activeFilters),
        advancedService.getSmartFilters()
      ]);

      setGroups(groupsData);
      setFilters(filtersData);
    } catch (error) {
      console.error('Error loading notification groups:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (groupId: string) => {
    try {
      const success = await advancedService.markGroupAsRead(groupId);
      if (success) {
        // Update local state
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, isRead: true }
            : group
        ));
      }
    } catch (error) {
      console.error('Error marking group as read:', error);
    }
  };

  const handleFilterClick = (filter: SmartFilter) => {
    if (filter.type) {
      setActiveFilters(prev => ({
        ...prev,
        type: prev.type === filter.type ? undefined : filter.type
      }));
    } else if (filter.label === 'High Priority') {
      setActiveFilters(prev => ({
        ...prev,
        priority: prev.priority === 'high' ? undefined : 'high'
      }));
    } else if (filter.label === 'Unread') {
      setActiveFilters(prev => ({
        ...prev,
        read: prev.read === false ? undefined : false
      }));
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
      case 'mentions':
        return <MessageSquare className="w-4 h-4" />;
      case 'drive':
        return <Folder className="w-4 h-4" />;
      case 'business':
      case 'invitations':
        return <Building className="w-4 h-4" />;
      case 'system':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600">
            {groups.length} notification groups
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadGroupsAndFilters}
          className="flex items-center space-x-2"
        >
          <Clock className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Smart Filters */}
      {filters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Quick Filters</h3>
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* High Priority Filter */}
            <Button
              variant={activeFilters.priority === 'high' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFilterClick(filters.highPriority)}
              className="flex items-center space-x-1"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{filters.highPriority.label}</span>
              <Badge color="red" size="sm">{filters.highPriority.count}</Badge>
            </Button>

            {/* Unread Filter */}
            <Button
              variant={activeFilters.read === false ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFilterClick(filters.unread)}
              className="flex items-center space-x-1"
            >
              <Eye className="w-3 h-3" />
              <span>{filters.unread.label}</span>
              <Badge color="blue" size="sm">{filters.unread.count}</Badge>
            </Button>

            {/* Type Filters */}
            {filters.byType.map((filter) => (
              <Button
                key={filter.type}
                variant={activeFilters.type === filter.type ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleFilterClick(filter)}
                className="flex items-center space-x-1"
              >
                {getTypeIcon(filter.type!)}
                <span>{filter.label}</span>
                <Badge color="gray" size="sm">{filter.count}</Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Notification Groups */}
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {getActiveFiltersCount() > 0 
                ? 'Try adjusting your filters'
                : 'You\'re all caught up!'
              }
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={`p-4 rounded-lg border transition-colors ${
                group.isRead 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {getTypeIcon(group.type)}
                    <span className="font-medium text-gray-900">
                      {advancedService.formatGroupTitle(group)}
                    </span>
                    <Badge 
                      color={group.priority === 'high' ? 'red' : group.priority === 'medium' ? 'yellow' : 'gray'}
                      size="sm"
                    >
                      {group.priority}
                    </Badge>
                    {!group.isRead && (
                      <Badge color="blue" size="sm">New</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {group.latestNotification.body || group.latestNotification.title}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{advancedService.getTimeAgo(group.updatedAt)}</span>
                    {group.count > 1 && (
                      <span>{group.count} notifications</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!group.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(group.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 