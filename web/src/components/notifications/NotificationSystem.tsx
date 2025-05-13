import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';
import { Bell, X } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const NotificationSystem = () => {
  const { user } = useAuth();
  const { subscribeToUser } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's notifications
    subscribeToUser(user.id);

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      } catch (error) {
        logger.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user, subscribeToUser]);

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const notification: Notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      logger.error('Error processing notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="notification-system">
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button onClick={() => setIsOpen(false)}>
              <X />
            </button>
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <p>{notification.message}</p>
                  <div className="notification-footer">
                    <span>
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                    {!notification.read && (
                      <button onClick={() => markAsRead(notification.id)}>
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No notifications</p>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-actions">
              <button onClick={markAllAsRead}>Mark all as read</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 