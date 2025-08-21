'use client';
import { useEffect, useMemo, useState } from 'react';
import { calendarAPI, Calendar } from '../../api/calendar';
import { useDashboard } from '../../contexts/DashboardContext';
import { useCalendarContext } from '../../contexts/CalendarContext';

export default function CalendarListSidebar() {
  const { currentDashboard, getDashboardType, getDashboardDisplayName } = useDashboard();
  const { visibleCalendarIds, toggleCalendarVisibility, overlayMode, setOverlayMode, setCalendars: setCalCtx } = useCalendarContext();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);

  const contextQuery = useMemo(() => {
    if (!currentDashboard) return {} as any;
    const type = getDashboardType(currentDashboard).toUpperCase();
    const id = (currentDashboard as any).business?.id || (currentDashboard as any).household?.id || currentDashboard.id;
    return { contextType: type, contextId: id } as any;
  }, [currentDashboard, getDashboardType]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        // All Tabs mode: skip context filters to load all user calendars
        const resp = overlayMode === 'ALL_TABS'
          ? await calendarAPI.listCalendars()
          : await calendarAPI.listCalendars(contextQuery);
        if (resp?.success) {
          if (resp.data.length === 0 && overlayMode === 'CURRENT_TAB' && currentDashboard) {
            // Attempt auto-provision only if calendar module is active on this dashboard
            const calendarActive = currentDashboard.widgets?.some((w: any) => w.type === 'calendar');
            if (calendarActive) {
              const name = getDashboardDisplayName(currentDashboard);
              try {
                await calendarAPI.autoProvision({
                  contextType: (contextQuery.contextType as any) || 'PERSONAL',
                  contextId: (contextQuery.contextId as any) || '',
                  name,
                  isPrimary: true
                });
              } catch {}
              const refetch = await calendarAPI.listCalendars(contextQuery);
              if (refetch?.success) {
                setCalCtx(refetch.data);
                setCalendars(refetch.data);
              }
            } else {
              setCalCtx([]);
              setCalendars([]);
            }
          } else {
            setCalCtx(resp.data);
            setCalendars(resp.data);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [overlayMode, contextQuery, currentDashboard, getDashboardDisplayName]);

  return (
    <aside className="w-64 shrink-0 border-r p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Calendars</div>
        <select
          value={overlayMode}
          onChange={e => setOverlayMode(e.target.value as any)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="ALL_TABS">All Tabs</option>
          <option value="CURRENT_TAB">Current Tab</option>
        </select>
      </div>
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      <div className="flex items-center gap-2 mb-3">
        <button
          className="px-2 py-1 border rounded text-xs"
          onClick={async () => {
            const name = prompt('Calendar name');
            if (!name) return;
            const body: any = currentDashboard
              ? { name, contextType: getDashboardType(currentDashboard).toUpperCase(), contextId: (currentDashboard as any).business?.id || (currentDashboard as any).household?.id || currentDashboard.id }
              : { name, contextType: 'PERSONAL', contextId: (currentDashboard as any)?.id };
            const resp = await calendarAPI.createCalendar(body);
            if (resp?.success) {
              setCalendars([resp.data, ...calendars]);
              setCalCtx([resp.data, ...calendars]);
            }
          }}
        >
          + New
        </button>
      </div>
      {!loading && (
        <ul className="space-y-1">
          {calendars.map(c => (
            <li key={c.id} className="flex items-center justify-between gap-2 group">
              <button
                onClick={() => toggleCalendarVisibility(c.id)}
                className={`text-left flex-1 truncate ${visibleCalendarIds.has(c.id) ? '' : 'opacity-40'}`}
                title={c.name}
              >
                <span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{ backgroundColor: c.color || '#3b82f6' }} />
                <span className="align-middle">{c.name}</span>
              </button>
              <input
                type="color"
                value={c.color || '#3b82f6'}
                onChange={async (e) => {
                  const newColor = e.target.value;
                  const updated = await calendarAPI.updateCalendar(c.id, { color: newColor });
                  if (updated?.success) {
                    // local refresh
                    setCalendars(calendars.map(cal => cal.id === c.id ? { ...cal, color: newColor } : cal));
                  }
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                title="Edit color"
              />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button
                  className="text-[11px] text-gray-500 hover:text-gray-700"
                  onClick={async () => {
                    const name = prompt('Rename calendar', c.name);
                    if (!name || name === c.name) return;
                    const resp = await calendarAPI.updateCalendar(c.id, { name });
                    if (resp?.success) {
                      setCalendars(calendars.map(cal => cal.id === c.id ? { ...cal, name } : cal));
                      setCalCtx(calendars.map(cal => cal.id === c.id ? { ...cal, name } : cal));
                    }
                  }}
                >Rename</button>
                {!c.isSystem && c.isDeletable !== false && (
                  <button
                    className="text-[11px] text-red-600 hover:text-red-700"
                    onClick={async () => {
                      if (!confirm('Delete this calendar?')) return;
                      const resp = await calendarAPI.deleteCalendar(c.id);
                      if (resp?.success) {
                        const next = calendars.filter(cal => cal.id !== c.id);
                        setCalendars(next);
                        setCalCtx(next);
                      }
                    }}
                  >Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && calendars.length === 0 && overlayMode === 'CURRENT_TAB' && currentDashboard && !currentDashboard.widgets?.some((w: any) => w.type === 'calendar') && (
        <div className="text-xs text-gray-500 p-2 border rounded">
          Calendar module is not enabled for this tab.
          <div>
            <a href={`/dashboard/${currentDashboard.id}`} className="underline">Add module</a>
          </div>
        </div>
      )}
    </aside>
  );
}

