'use client';
import { useEffect, useMemo, useState } from 'react';
import { calendarAPI, EventItem } from '../../../api/calendar';
import { useDashboard } from '../../../contexts/DashboardContext';
import { CalendarProvider, useCalendarContext } from '../../../contexts/CalendarContext';
import CalendarListSidebar from '../../../components/calendar/CalendarListSidebar';

function YearInner() {
  const { currentDashboard, getDashboardType, getDashboardDisplayName } = useDashboard();
  const { visibleCalendarIds } = useCalendarContext();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());

  const contextFilter = useMemo(() => {
    if (!currentDashboard) return [] as string[];
    const type = getDashboardType(currentDashboard).toUpperCase();
    const id = (currentDashboard as any).business?.id || (currentDashboard as any).household?.id || currentDashboard.id;
    return [`${type}:${id}`];
  }, [currentDashboard, getDashboardType]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const start = new Date(viewYear, 0, 1, 0, 0, 0);
        const end = new Date(viewYear, 11, 31, 23, 59, 59);
        const selectedIds = Array.from(visibleCalendarIds);
        const resp = selectedIds.length > 0
          ? await calendarAPI.listEvents({ start: start.toISOString(), end: end.toISOString(), contexts: contextFilter, calendarIds: selectedIds })
          : await calendarAPI.listEvents({ start: start.toISOString(), end: end.toISOString(), contexts: contextFilter });
        if (resp?.success) setEvents(resp.data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    })();
  }, [contextFilter, visibleCalendarIds, viewYear]);

  // Aggregate counts per month
  const counts = Array(12).fill(0) as number[];
  events.forEach(ev => {
    const d = new Date(ev.startAt);
    if (d.getFullYear() === viewYear) counts[d.getMonth()] += 1;
  });

  const months = Array.from({ length: 12 }, (_, m) => new Date(viewYear, m, 1).toLocaleString(undefined, { month: 'short' }));

  return (
    <div className="flex h-full">
      <CalendarListSidebar />
      <div className="flex-1 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Calendar — Year</h1>
            <div className="ml-2 grid grid-cols-4 gap-2 text-xs">
              <a className="px-2 py-1 border rounded text-center hover:bg-gray-50" href="/calendar/day">Day</a>
              <a className="px-2 py-1 border rounded text-center hover:bg-gray-50" href="/calendar/week">Week</a>
              <a className="px-2 py-1 border rounded text-center hover:bg-gray-50" href="/calendar/month">Month</a>
              <a className="px-2 py-1 border rounded text-center bg-gray-100" href="/calendar/year">Year</a>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button className="px-2 py-1 border rounded" onClick={() => setViewYear(y => y - 1)}>{'<'}</button>
              <button className="px-2 py-1 border rounded" onClick={() => setViewYear(new Date().getFullYear())}>This Year</button>
              <button className="px-2 py-1 border rounded" onClick={() => setViewYear(y => y + 1)}>{'>'}</button>
              <div className="ml-2 text-sm text-gray-600">{viewYear}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">{currentDashboard ? getDashboardDisplayName(currentDashboard) : 'All Tabs'}</div>
        </div>

        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && (
          <div className="grid grid-cols-3 gap-2">
            {months.map((label, idx) => {
              const c = counts[idx] || 0;
              const intensity = Math.min(1, c / 10); // rough scale
              const bg = `rgba(59,130,246,${0.1 + 0.6*intensity})`;
              return (
                <div key={label} className="border rounded p-2 min-h-[120px] flex flex-col">
                  <div className="text-xs text-gray-600 mb-2">{label}</div>
                  <div className="flex-1 rounded" style={{ background: bg }} />
                  <div className="text-[11px] text-gray-500 mt-2">{c} event{c === 1 ? '' : 's'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarYearPage() {
  return (
    <CalendarProvider>
      <YearInner />
    </CalendarProvider>
  );
}
