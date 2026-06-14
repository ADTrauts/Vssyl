'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Button, Spinner } from 'shared/components';
import { calendarAPI, type Calendar as CalendarRecord } from '@/api/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

interface PlaceCalendarLinkModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (calendarId: string) => void | Promise<void>;
  loading?: boolean;
  meetingName?: string;
}

/**
 * Certified modal picker for linking a Place meeting to a calendar (replaces native prompt).
 */
export function PlaceCalendarLinkModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  meetingName,
}: PlaceCalendarLinkModalProps) {
  const [calendars, setCalendars] = useState<CalendarRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadCalendars = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await calendarAPI.listCalendars();
      const list = res.data ?? [];
      setCalendars(list);
      const primary = list.find(c => c.isPrimary) ?? list[0];
      setSelectedId(primary?.id ?? null);
    } catch {
      setFetchError('Could not load your calendars. Try again.');
      setCalendars([]);
      setSelectedId(null);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadCalendars();
    } else {
      setSelectedId(null);
      setFetchError(null);
    }
  }, [open, loadCalendars]);

  const handleConfirm = () => {
    if (!selectedId) return;
    void onConfirm(selectedId);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to calendar"
      size="medium"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {meetingName
            ? `Choose a calendar for "${meetingName}".`
            : 'Choose a calendar for this meeting.'}
        </p>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Spinner size={28} />
          </div>
        ) : fetchError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {fetchError}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => void loadCalendars()}>
              Retry
            </Button>
          </div>
        ) : calendars.length === 0 ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            No calendars found. Create a calendar in the Calendar module first.
          </p>
        ) : (
          <ul className="max-h-60 space-y-2 overflow-y-auto" role="listbox" aria-label="Calendars">
            {calendars.map(cal => (
              <li key={cal.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedId === cal.id}
                  onClick={() => setSelectedId(cal.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedId === cal.id
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-600 dark:bg-indigo-950 dark:text-indigo-100'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span className="flex-1 font-medium">{cal.name}</span>
                  {cal.isPrimary ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Primary</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading || !selectedId || fetching}
          >
            {loading ? 'Linking…' : 'Link to calendar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
