'use client';
import { useEffect, useState } from 'react';
import { calendarAPI, EventItem } from '../../api/calendar';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { CalendarPageShell } from './CalendarPageShell';
import { CalendarPageHeader, CalendarShortcutsHelp, CalendarViewSwitcher, PageToolbar } from './CalendarViewChrome';
import { CalendarEventsEmptyState } from './CalendarEventsEmptyState';
import { useCalendarViewContext, type CalendarViewBaseProps } from './calendarViewContext';

export function CalendarYearView(props: CalendarViewBaseProps = {}) {
  const { contextFilter, contextLabel, sidebarContextType, sidebarContextId } = useCalendarViewContext(props);
  const { visibleCalendarIds } = useCalendarContext();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const start = new Date(viewYear, 0, 1, 0, 0, 0);
        const end = new Date(viewYear, 11, 31, 23, 59, 59);
        const selectedIds = Array.from(visibleCalendarIds);
        const resp =
          selectedIds.length > 0
            ? await calendarAPI.listEvents({
                start: start.toISOString(),
                end: end.toISOString(),
                contexts: contextFilter,
                calendarIds: selectedIds,
              })
            : await calendarAPI.listEvents({
                start: start.toISOString(),
                end: end.toISOString(),
                contexts: contextFilter,
              });
        if (resp?.success) setEvents(resp.data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load events';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [contextFilter, visibleCalendarIds, viewYear]);

  const counts = Array(12).fill(0) as number[];
  events.forEach((ev) => {
    const d = new Date(ev.startAt);
    if (d.getFullYear() === viewYear) counts[d.getMonth()] += 1;
  });

  const months = Array.from({ length: 12 }, (_, m) =>
    new Date(viewYear, m, 1).toLocaleString(undefined, { month: 'short' })
  );

  return (
    <CalendarPageShell
      sidebarContextType={sidebarContextType}
      sidebarContextId={sidebarContextId}
      header={<CalendarPageHeader viewLabel={`Year — ${viewYear}`} description={contextLabel} showNewEvent={false} />}
      toolbar={
        <PageToolbar
          leading={
            <div className="flex flex-wrap items-center gap-2">
              <CalendarViewSwitcher active="year" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewYear((y) => y - 1)}
                  aria-label="Previous year"
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewYear(new Date().getFullYear())}
                >
                  This Year
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewYear((y) => y + 1)}
                  aria-label="Next year"
                >
                  {'>'}
                </button>
              </div>
              <CalendarShortcutsHelp />
            </div>
          }
        />
      }
    >
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && events.length === 0 && <CalendarEventsEmptyState variant="year" />}
      {!loading && (
        <div className="grid grid-cols-3 gap-2">
          {months.map((label, idx) => {
            const c = counts[idx] || 0;
            const intensity = Math.min(1, c / 10);
            const bg = `rgba(59,130,246,${0.1 + 0.6 * intensity})`;
            return (
              <div key={label} className="flex min-h-[120px] flex-col rounded border p-2">
                <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">{label}</div>
                <div className="flex-1 rounded" style={{ background: bg }} />
                <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                  {c} event{c === 1 ? '' : 's'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CalendarPageShell>
  );
}
