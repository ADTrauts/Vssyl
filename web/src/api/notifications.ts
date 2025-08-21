import { authenticatedApiCall } from '../lib/apiUtils';

export interface Notification {
  id: string;
  type: 'chat' | 'drive' | 'members' | 'business' | 'system' | 'mentions';
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
  deliveredAt?: string;
  deleted: boolean;
  data?: any;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export interface CreateNotificationData {
  type: string;
  title: string;
  body?: string;
  data?: any;
  userId: string;
}

// Get notifications with optional filters
export const getNotifications = async (
  params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<NotificationResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.read !== undefined) queryParams.append('read', params.read.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return authenticatedApiCall(url, {
    method: 'GET'
  });
};

// Get notification statistics
export const getNotificationStats = async (): Promise<NotificationStats> => {
  return authenticatedApiCall('/api/notifications/stats', {
    method: 'GET'
  });
};

// Create a notification
export const createNotification = async (data: CreateNotificationData): Promise<{ notification: Notification }> => {
  return authenticatedApiCall('/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

// Mark notification as read
export const markAsRead = async (id: string): Promise<{ notification: Notification }> => {
  return authenticatedApiCall(`/api/notifications/${id}/read`, {
    method: 'POST'
  });
};

// Mark all notifications as read
export const markAllAsRead = async (type?: string): Promise<{ success: boolean }> => {
  const url = type 
    ? `/api/notifications/mark-all-read?type=${type}`
    : '/api/notifications/mark-all-read';
    
  return authenticatedApiCall(url, {
    method: 'POST'
  });
};

// Delete notification
export const deleteNotification = async (id: string): Promise<{ success: boolean }> => {
  return authenticatedApiCall(`/api/notifications/${id}`, {
    method: 'DELETE'
  });
};

// Delete multiple notifications
export const deleteMultipleNotifications = async (ids: string[]): Promise<{ success: boolean }> => {
  return authenticatedApiCall('/api/notifications/bulk', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });
};

// Create notification for another user (admin only)
export const createNotificationForUser = async (data: CreateNotificationData): Promise<{ notification: Notification }> => {
  return authenticatedApiCall('/api/notifications/for-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}; 