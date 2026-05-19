'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner } from 'shared/components';
import { RefreshCw } from 'lucide-react';
import {
  fetchPersonalLearningEvents,
  reviewPersonalLearningEvent,
  type PersonalLearningEvent,
} from '../../api/aiLearningEvents';

interface PersonalLearningEventsReviewProps {
  embedded?: boolean;
  onReviewed?: () => void;
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ');
}

export default function PersonalLearningEventsReview({
  embedded,
  onReviewed,
}: PersonalLearningEventsReviewProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<PersonalLearningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'validated'>('pending');

  const loadEvents = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const data = await fetchPersonalLearningEvents(session.accessToken, filter);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load learning events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, filter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleReview = async (eventId: string, approved: boolean) => {
    if (!session?.accessToken) return;
    setBusyId(eventId);
    try {
      await reviewPersonalLearningEvent(session.accessToken, eventId, approved);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      onReviewed?.();
    } catch (err) {
      console.error('Failed to review learning event:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Learning events</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review what your AI learned from chats before it influences future behavior.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Waiting
        </Button>
        <Button
          variant={filter === 'validated' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('validated')}
        >
          Saved earlier
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void loadEvents()} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size={28} />
        </div>
      ) : events.length === 0 ? (
        <Card className="p-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {filter === 'pending'
            ? 'Nothing waiting. I’ll surface suggestions when they’re worth your time.'
            : 'No saved behaviors yet.'}
        </Card>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge size="sm" color="blue">
                        {formatEventType(event.eventType)}
                      </Badge>
                      {event.sourceModule && (
                        <Badge size="sm" color="gray">
                          {event.sourceModule}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(event.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{event.context}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
                      {event.newBehavior}
                    </p>
                    {event.oldBehavior && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        Was: {event.oldBehavior}
                      </p>
                    )}
                  </div>
                  {filter === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busyId === event.id}
                        onClick={() => void handleReview(event.id, true)}
                      >
                        Save to AI Identity
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === event.id}
                        onClick={() => void handleReview(event.id, false)}
                      >
                        Not now
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
