'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Megaphone, Clock } from 'lucide-react';
import { WidgetProps, WidgetContainer, WidgetLoading, WidgetError, WidgetEmpty } from './WidgetRegistry';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  expiresAt?: string;
}

export default function AnnouncementsWidget({ businessId, settings, theme }: WidgetProps) {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, [businessId, session?.accessToken]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch announcements from the front page config
      const response = await fetch(`/api/business-front/${businessId}/config`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load announcements');
      }

      const data = await response.json();
      const config = data.config || data;
      
      // Filter active announcements (not expired)
      const now = new Date();
      const activeAnnouncements = (config.companyAnnouncements || []).filter((announcement: Announcement) => {
        if (!announcement.expiresAt) return true;
        return new Date(announcement.expiresAt) > now;
      });

      setAnnouncements(activeAnnouncements);
      setLoading(false);
    } catch (err) {
      setError('Failed to load announcements');
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority as keyof typeof colors];
  };

  if (loading) {
    return (
      <WidgetContainer title="Announcements" icon="📢" theme={theme}>
        <WidgetLoading message="Loading announcements..." />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer title="Announcements" icon="📢" theme={theme}>
        <WidgetError message={error} onRetry={loadAnnouncements} />
      </WidgetContainer>
    );
  }

  if (announcements.length === 0) {
    return (
      <WidgetContainer title="Announcements" icon="📢" theme={theme}>
        <WidgetEmpty message="No announcements at this time" icon="📭" />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title={(settings?.title as string) || 'Announcements'}
      icon="📢"
      description={(settings?.description as string) || undefined}
      theme={theme}
    >
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`p-4 rounded-lg border-l-4 ${getPriorityColor(announcement.priority)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadge(announcement.priority)}`}>
                {announcement.priority}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(announcement.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

