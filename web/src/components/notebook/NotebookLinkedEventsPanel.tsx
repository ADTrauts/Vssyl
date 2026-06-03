'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input } from 'shared/components';
import { Calendar, ExternalLink, Link2, Search, Unlink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { calendarAPI, type EventItem } from '@/api/calendar';
import * as notebookLinksAPI from '@/api/notebookLinks';
import type { NotebookLinkItem } from '@/api/notebookLinks';

interface NotebookLinkedEventsPanelProps {
  pageId: string;
  refreshKey?: number;
}

function formatEventWhen(target: NotebookLinkItem['target']): string {
  if (!target?.startTime) return '';
  const start = new Date(target.startTime);
  const end = target.endTime ? new Date(target.endTime) : null;
  if (target.allDay) {
    return start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  const startStr = start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const endStr = end ? end.toLocaleTimeString(undefined, { timeStyle: 'short' }) : '';
  return endStr ? `${startStr} – ${endStr}` : startStr;
}

export function NotebookLinkedEventsPanel({ pageId, refreshKey = 0 }: NotebookLinkedEventsPanelProps) {
  const { data: session } = useSession();
  const [links, setLinks] = useState<NotebookLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventIdInput, setEventIdInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<EventItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadLinks = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await notebookLinksAPI.getPageLinks(session.accessToken, pageId, {
        targetType: 'CALENDAR_EVENT',
      });
      setLinks(res.links);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, pageId]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks, refreshKey]);

  const linkEvent = async (eventId: string, meta?: { title?: string; startAt?: string; endAt?: string }) => {
    if (!session?.accessToken) return;
    setLinking(true);
    try {
      await notebookLinksAPI.createPageLink(session.accessToken, pageId, {
        targetType: 'CALENDAR_EVENT',
        targetId: eventId,
        relationshipType: 'AGENDA',
        metadata: meta
          ? {
              meetingContext: true,
              eventTitle: meta.title,
              startAt: meta.startAt,
              endAt: meta.endAt,
            }
          : { meetingContext: true },
      });
      toast.success('Meeting linked to page');
      setEventIdInput('');
      setSearchText('');
      setSearchResults([]);
      await loadLinks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link event');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkById = () => {
    if (!eventIdInput.trim()) return;
    void linkEvent(eventIdInput.trim());
  };

  const handleSearch = async () => {
    if (!session?.accessToken || !searchText.trim()) return;
    setSearching(true);
    try {
      const now = new Date();
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const resp = await calendarAPI.searchEvents({
        text: searchText.trim(),
        start,
        end,
      });
      if (resp?.success) {
        setSearchResults(resp.data.slice(0, 8));
      } else {
        setSearchResults([]);
      }
    } catch {
      toast.error('Event search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col min-h-0 border-t border-gray-200 dark:border-slate-700">
      <div className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        Meeting / event
      </div>

      <div className="px-2 pb-2 space-y-2 max-h-56 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No linked calendar event. Search below or paste an event ID.
          </p>
        ) : (
          links.map((link) => {
            const restricted = link.targetAccessible === false || !link.target;
            const target = link.target;
            return (
              <div
                key={link.id}
                className="rounded border border-gray-200 dark:border-slate-600 p-2 text-xs bg-gray-50 dark:bg-slate-900/50"
              >
                {restricted ? (
                  <p className="text-amber-600 dark:text-amber-400">Event unavailable or restricted</p>
                ) : (
                  <>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{target?.title}</div>
                    <div className="text-gray-500 dark:text-gray-400 mt-0.5">{formatEventWhen(target)}</div>
                    {target?.location && (
                      <div className="text-gray-600 dark:text-gray-300 mt-0.5 truncate">{target.location}</div>
                    )}
                    {target?.attendeesSummary && (
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {target.attendeesSummary}
                      </div>
                    )}
                    {target?.trashed && (
                      <div className="text-amber-600 dark:text-amber-400 mt-0.5">Event in trash</div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <a
                        href="/calendar/month"
                        className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 mr-0.5" />
                        Calendar
                      </a>
                      {target?.onlineMeetingLink && (
                        <a
                          href={target.onlineMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Join link
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!session?.accessToken) return;
                          await notebookLinksAPI.archivePageLink(session.accessToken, link.id);
                          await loadLinks();
                        }}
                        title="Unlink event"
                      >
                        <Unlink className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
        <div className="flex gap-1">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search events…"
            className="flex-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleSearch} disabled={searching}>
            <Search className="w-3.5 h-3.5" />
          </Button>
        </div>
        {searchResults.length > 0 && (
          <ul className="space-y-1 max-h-24 overflow-y-auto">
            {searchResults.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 truncate"
                  disabled={linking}
                  onClick={() => void linkEvent(ev.id, { title: ev.title, startAt: ev.startAt, endAt: ev.endAt })}
                >
                  {ev.title}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1">
          <Input
            value={eventIdInput}
            onChange={(e) => setEventIdInput(e.target.value)}
            placeholder="Or event ID"
            className="flex-1 text-xs"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLinkById}
            disabled={linking || !eventIdInput.trim()}
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
