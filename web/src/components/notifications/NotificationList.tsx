import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { Modal } from '../ui/modal';

interface NotificationListProps {
  className?: string;
}

export const NotificationList = ({ className }: NotificationListProps) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'high' | 'medium' | 'low'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.priority === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'var(--error-color)';
      case 'high':
        return 'var(--warning-color)';
      case 'medium':
        return 'var(--info-color)';
      case 'low':
        return 'var(--success-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '⚠️';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  if (isLoading) {
    return <div className="notification-list loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="notification-list error">{error}</div>;
  }

  return (
    <div className={`notification-list ${className || ''}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="notification-button"
      >
        <Bell className="icon" />
        {unreadCount.total > 0 && (
          <span className="badge">{unreadCount.total}</span>
        )}
      </Button>

      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
      >
        <div className="notification-filters">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          <Button
            variant={filter === 'urgent' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('urgent')}
          >
            Urgent
          </Button>
          <Button
            variant={filter === 'high' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('high')}
          >
            High
          </Button>
          <Button
            variant={filter === 'medium' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('medium')}
          >
            Medium
          </Button>
          <Button
            variant={filter === 'low' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('low')}
          >
            Low
          </Button>
        </div>

        <div className="notification-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount.total === 0}
          >
            <Check className="icon" />
            Mark all as read
          </Button>
        </div>

        <div className="notification-items">
          {filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              No notifications to display
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${notification.isRead ? 'read' : ''}`}
              >
                <div className="notification-header">
                  <span
                    className="priority-indicator"
                    style={{ color: getPriorityColor(notification.priority) }}
                  >
                    {getPriorityIcon(notification.priority)}
                  </span>
                  <span className="notification-title">{notification.title}</span>
                  <span className="notification-time">
                    {formatDistanceToNow(new Date(notification.createdAt))} ago
                  </span>
                </div>

                <div className="notification-content">
                  <p>{notification.message}</p>
                </div>

                <div className="notification-actions">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="icon" />
                      Mark as read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="icon" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}; 