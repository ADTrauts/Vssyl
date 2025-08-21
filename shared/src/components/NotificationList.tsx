"use client";

import React, { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationListProps {
  token: string;
  onRead?: (id: string) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ token, onRead }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load notifications');
        setLoading(false);
      });
  }, [token]);

  const markAsRead = async (id: string) => {
    setMarking(id);
    await fetch(`/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    setMarking(null);
    onRead?.(id);
  };

  if (loading) return <div style={{ padding: 16 }}>Loading notifications...</div>;
  if (error) return <div style={{ color: 'red', padding: 16 }}>{error}</div>;
  if (!notifications.length) return <div style={{ padding: 16 }}>No notifications.</div>;

  return (
    <div style={{ minWidth: 320, maxWidth: 400, padding: 16 }}>
      <h3 style={{ marginBottom: 16 }}>Notifications</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {notifications.map(n => (
          <li key={n.id} style={{
            background: n.read ? '#f4f4f4' : '#e6f7ff',
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 12,
            padding: 12,
            opacity: marking === n.id ? 0.5 : 1,
            cursor: n.read ? 'default' : 'pointer',
            transition: 'background 0.2s',
          }}
            onClick={() => !n.read && !marking && markAsRead(n.id)}
          >
            <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
            {n.body && <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{n.body}</div>}
            <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
            {!n.read && <button style={{ marginTop: 8 }} disabled={!!marking} onClick={e => { e.stopPropagation(); markAsRead(n.id); }}>Mark as read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationList; 