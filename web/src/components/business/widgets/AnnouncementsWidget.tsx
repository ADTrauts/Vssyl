'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Megaphone, Clock } from 'lucide-react';
import { WidgetProps, WidgetContainer, WidgetLoading, WidgetError, WidgetEmpty } from './WidgetRegistry';
import { listFrontPageCommunications } from '@/api/workforceComms';
import {
  formatWorkforceDate,
  frontPagePriorityFromWorkforce,
  priorityBadgeClass,
  priorityLabel,
  priorityBorderClass,
} from '@/components/workforce-comms/workforceCommsUtils';
import type { WorkforceCommunicationListItem } from '@/api/workforceComms';

export default function AnnouncementsWidget({ businessId, settings, theme }: WidgetProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<WorkforceCommunicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAnnouncements();
  }, [businessId, session?.accessToken]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const communications = await listFrontPageCommunications(businessId, 20);
      const now = new Date();
      const active = communications.filter((comm) => {
        if (!comm.expiresAt) return true;
        return new Date(comm.expiresAt) > now;
      });
      setAnnouncements(active);
    } catch {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
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
        {announcements.map((announcement) => {
          const fpPriority = frontPagePriorityFromWorkforce(announcement.priority);
          return (
            <button
              key={announcement.id}
              type="button"
              className={`w-full text-left p-4 rounded-lg border-l-4 ${priorityBorderClass(announcement.priority)}`}
              onClick={() =>
                router.push(
                  `/business/${businessId}/workspace/workforce-comms/communications/${announcement.id}`
                )
              }
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{announcement.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded ${priorityBadgeClass(announcement.priority)}`}>
                  {priorityLabel(announcement.priority)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {announcement.summary || announcement.body?.slice(0, 200)}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3 mr-1" />
                {formatWorkforceDate(announcement.publishedAt)}
                {fpPriority === 'urgent' && (
                  <span className="ml-2 inline-flex items-center gap-1 text-red-700">
                    <Megaphone className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </WidgetContainer>
  );
}
