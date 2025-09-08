import { authenticatedApiCall } from './apiUtils';

// Notification data interfaces
export interface NotificationData {
  id: string;
  type: string;
  title: string;
  body?: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

export interface NotificationGroup {
  id: string;
  type: string;
  title: string;
  count: number;
  latestNotification: NotificationData;
  notifications: NotificationData[];
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDigest {
  period: string;
  totalNotifications: number;
  unreadCount: number;
  groupedCount: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  topGroups: NotificationGroup[];
  summary: string;
}

export interface SmartFilter {
  label: string;
  count: number;
  type?: string;
  description: string;
}

export interface AdvancedNotificationStats {
  total: number;
  unread: number;
  grouped: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface SmartFiltersResponse {
  highPriority: SmartFilter;
  unread: SmartFilter;
  recent: SmartFilter;
  byType: SmartFilter[];
}

export class AdvancedNotificationService {
  private static instance: AdvancedNotificationService;

  private constructor() {}

  public static getInstance(): AdvancedNotificationService {
    if (!AdvancedNotificationService.instance) {
      AdvancedNotificationService.instance = new AdvancedNotificationService();
    }
    return AdvancedNotificationService.instance;
  }

  /**
   * Get grouped notifications
   */
  async getGroupedNotifications(params?: {
    limit?: number;
    type?: string;
    priority?: 'high' | 'medium' | 'low';
    read?: boolean;
  }): Promise<NotificationGroup[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.read !== undefined) queryParams.append('read', params.read.toString());

      const response = await authenticatedApiCall(
        `/api/advanced-notifications/grouped?${queryParams.toString()}`,
        { method: 'GET' }
      ) as { groups: NotificationGroup[] };

      return response.groups;
    } catch (error) {
      console.error('Error getting grouped notifications:', error);
      return [];
    }
  }

  /**
   * Get notification group by ID
   */
  async getNotificationGroup(groupId: string): Promise<NotificationGroup | null> {
    try {
      const response = await authenticatedApiCall(
        `/api/advanced-notifications/grouped/${groupId}`,
        { method: 'GET' }
      ) as { group: NotificationGroup };

      return response.group;
    } catch (error) {
      console.error('Error getting notification group:', error);
      return null;
    }
  }

  /**
   * Mark group as read
   */
  async markGroupAsRead(groupId: string): Promise<boolean> {
    try {
      const response = await authenticatedApiCall(
        `/api/advanced-notifications/grouped/${groupId}/read`,
        { method: 'PUT' }
      ) as { success: boolean };

      return response.success;
    } catch (error) {
      console.error('Error marking group as read:', error);
      return false;
    }
  }

  /**
   * Get advanced notification statistics
   */
  async getAdvancedNotificationStats(): Promise<AdvancedNotificationStats> {
    try {
      const response = await authenticatedApiCall(
        '/api/advanced-notifications/stats/advanced',
        { method: 'GET' }
      ) as { stats: AdvancedNotificationStats };

      return response.stats;
    } catch (error) {
      console.error('Error getting advanced notification stats:', error);
      return {
        total: 0,
        unread: 0,
        grouped: 0,
        byType: {},
        byPriority: {}
      };
    }
  }

  /**
   * Get notification digest
   */
  async getNotificationDigest(period: '24h' | '7d' = '24h'): Promise<NotificationDigest> {
    try {
      const response = await authenticatedApiCall(
        `/api/advanced-notifications/digest?period=${period}`,
        { method: 'GET' }
      ) as { digest: NotificationDigest };

      return response.digest;
    } catch (error) {
      console.error('Error getting notification digest:', error);
      return {
        period,
        totalNotifications: 0,
        unreadCount: 0,
        groupedCount: 0,
        byType: {},
        byPriority: {},
        topGroups: [],
        summary: `No notifications in the last ${period}`
      };
    }
  }

  /**
   * Get smart filters
   */
  async getSmartFilters(): Promise<SmartFiltersResponse> {
    try {
      const response = await authenticatedApiCall(
        '/api/advanced-notifications/filters',
        { method: 'GET' }
      ) as { filters: SmartFiltersResponse };

      return response.filters;
    } catch (error) {
      console.error('Error getting smart filters:', error);
      return {
        highPriority: { label: 'High Priority', count: 0, description: 'Mentions and invitations' },
        unread: { label: 'Unread', count: 0, description: 'Notifications you haven\'t seen' },
        recent: { label: 'Recent (24h)', count: 0, description: 'Notifications from the last 24 hours' },
        byType: []
      };
    }
  }

  /**
   * Get priority color for notification group
   */
  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * Get priority icon for notification group
   */
  getPriorityIcon(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '⚪';
      default:
        return '⚪';
    }
  }

  /**
   * Format group title with count
   */
  formatGroupTitle(group: NotificationGroup): string {
    if (group.count === 1) {
      return group.title;
    }
    return `${group.title} (${group.count})`;
  }

  /**
   * Get time ago for group
   */
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }
} 