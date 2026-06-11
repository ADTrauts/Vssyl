'use client';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { calendarAPI, EventItem } from '../../api/calendar';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { CalendarPageShell } from './CalendarPageShell';
import { CalendarPageHeader, CalendarShortcutsHelp, CalendarViewSwitcher, PageToolbar } from './CalendarViewChrome';
import { CalendarEventsEmptyState } from './CalendarEventsEmptyState';
import { useCalendarEventContextMenu } from './useCalendarEventContextMenu';
import { useCalendarViewContext, type CalendarViewBaseProps } from './calendarViewContext';
import EventDrawer from './EventDrawer';
import { RecurrenceScopeModal, type RecurrenceScope } from './RecurrenceScopeModal';
import { useSession } from 'next-auth/react';
import { chatSocket } from '../../lib/chatSocket';

export function CalendarDayView(props: CalendarViewBaseProps = {}) {
  const router = useRouter();
  const {
    effectiveContextType,
    effectiveContextId,
    contextFilter,
    contextLabel,
    sidebarContextType,
    sidebarContextId,
  } = useCalendarViewContext(props);
  const { visibleCalendarIds } = useCalendarContext();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [draftStart, setDraftStart] = useState<Date | undefined>();
  const [draftEnd, setDraftEnd] = useState<Date | undefined>();
  const { data: session } = useSession();
  const [showAvailability, setShowAvailability] = useState(false);
  const [busy, setBusy] = useState<{ startAt: string; endAt: string }[]>([]);
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [pendingRecurrenceUpdate, setPendingRecurrenceUpdate] = useState<{
    ev: EventItem;
    newStart: Date;
    newEnd: Date;
  } | null>(null);

  const openCreateDrawer = useCallback(() => {
    const start = new Date(viewDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setEditingEvent(null);
    setDraftStart(start);
    setDraftEnd(end);
    setShowDrawer(true);
  }, [viewDate]);

  const dayLabel = viewDate.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 0, 0, 0);
        const end = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 23, 59, 59);
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
  }, [contextFilter, visibleCalendarIds, viewDate]);

  const hours = Array.from({ length: 24 }, (_, h) => h);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === 'd') router.push('/calendar/day');
      if (key === 'w') router.push('/calendar/week');
      if (key === 'm') router.push('/calendar/month');
      if (key === 'y') router.push('/calendar/year');
      if (key === 'n') {
        const start = new Date(viewDate);
        start.setHours(9,0,0,0);
        const end = new Date(start.getTime() + 60*60*1000);
        setEditingEvent(null);
        setDraftStart(start);
        setDraftEnd(end);
        setShowDrawer(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, viewDate]);

  // Realtime updates
  useEffect(() => {
    const token = (session as any)?.accessToken as string | undefined;
    let unsubscribe: (() => void) | null = null;
    (async () => {
      if (token) await chatSocket.connect(token);
      const handler = (payload: any) => {
        if (!payload || payload.type !== 'event') return;
        setEvents(prev => {
          if (payload.action === 'deleted') {
            return prev.filter(e => e.id !== payload.event.id);
          }
          const incoming = payload.event as EventItem;
          const idx = prev.findIndex(e => e.id === incoming.id);
          if (idx >= 0) {
            const next = prev.slice();
            next[idx] = { ...next[idx], ...incoming };
            return next;
          }
          return [incoming, ...prev];
        });
      };
      chatSocket.onRaw('calendar_event', handler);
      unsubscribe = () => { chatSocket.offRaw('calendar_event', handler); };
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [session]);

  // Load availability when toggled
  useEffect(() => {
    (async () => {
      if (!showAvailability) { setBusy([]); return; }
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 0, 0, 0);
      const end = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), 23, 59, 59);
      const selectedIds = Array.from(visibleCalendarIds);
      const calendarIds = selectedIds.length > 0 ? selectedIds : Array.from(new Set(events.map(e => e.calendarId)));
      if (calendarIds.length === 0) { setBusy([]); return; }
      try {
        const resp = await calendarAPI.freeBusy({ start: start.toISOString(), end: end.toISOString(), calendarIds });
        if ((resp as any)?.success) setBusy((resp as any).data);
      } catch {}
    })();
  }, [showAvailability, viewDate, visibleCalendarIds, events]);

  const applyEventTimeUpdate = async (
    ev: EventItem,
    newStart: Date,
    newEnd: Date,
    scope?: RecurrenceScope
  ) => {
    try {
      const payload: Record<string, string> = {
        startAt: newStart.toISOString(),
        endAt: newEnd.toISOString(),
      };
      if (ev.recurrenceRule && scope === 'THIS') {
        payload.editMode = 'THIS';
        payload.occurrenceStartAt = ev.occurrenceStartAt || ev.startAt;
      }
      const resp = await calendarAPI.updateEvent(ev.id, payload);
      if (resp?.success) {
        const updated = resp.data as EventItem;
        setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, ...updated } : e)));
      }
    } catch (error: unknown) {
      console.error('Failed to update event time:', error);
    }
  };

  const handleUpdateEventTime = async (ev: EventItem, newStart: Date, newEnd: Date) => {
    if (ev.recurrenceRule) {
      setPendingRecurrenceUpdate({ ev, newStart, newEnd });
      return;
    }
    await applyEventTimeUpdate(ev, newStart, newEnd);
  };

  const currentUserId = (session as { user?: { id?: string } })?.user?.id;
  const visibleDayEvents = useMemo(() => {
    return events.filter((ev) => {
      if (myEventsOnly && currentUserId && ev.createdById !== currentUserId) return false;
      const start = new Date(ev.occurrenceStartAt || ev.startAt);
      const end = new Date(ev.occurrenceEndAt || ev.endAt);
      const d = viewDate.toDateString();
      return start.toDateString() === d || end.toDateString() === d;
    });
  }, [events, myEventsOnly, currentUserId, viewDate]);

  return (
    <CalendarPageShell
      sidebarContextType={sidebarContextType}
      sidebarContextId={sidebarContextId}
      onSidebarCreateEvent={openCreateDrawer}
      header={
        <CalendarPageHeader
          viewLabel={`Day — ${dayLabel}`}
          description={contextLabel}
          onNewEvent={openCreateDrawer}
        />
      }
      toolbar={
        <PageToolbar
          leading={
            <div className="flex flex-wrap items-center gap-2">
              <CalendarViewSwitcher active="day" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
                  aria-label="Previous day"
                >
                  {'<'}
                </button>
                <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => setViewDate(new Date())}>
                  Today
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
                  aria-label="Next day"
                >
                  {'>'}
                </button>
              </div>
            </div>
          }
          trailing={
            <>
              <button
                type="button"
                className={`rounded border px-3 py-1 text-sm ${showAvailability ? 'border-blue-300 bg-blue-50' : ''}`}
                onClick={() => setShowAvailability((v) => !v)}
                title="Toggle availability overlay"
              >
                Availability
              </button>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={myEventsOnly} onChange={(e) => setMyEventsOnly(e.target.checked)} />
                My events
              </label>
            </>
          }
        />
      }
      overlays={
        <>
          <EventDrawer
            isOpen={showDrawer}
            onClose={() => setShowDrawer(false)}
            onCreated={() => setShowDrawer(false)}
            onUpdated={() => setShowDrawer(false)}
            contextType={effectiveContextType}
            contextId={effectiveContextId || props.dashboardId || undefined}
            eventToEdit={editingEvent || undefined}
            defaultStart={draftStart}
            defaultEnd={draftEnd}
          />
          <RecurrenceScopeModal
            open={pendingRecurrenceUpdate !== null}
            onClose={() => setPendingRecurrenceUpdate(null)}
            title="Update recurring event"
            description="Apply this time change to a single occurrence or the entire series?"
            onSelect={(scope) => {
              if (!pendingRecurrenceUpdate) return;
              const { ev, newStart, newEnd } = pendingRecurrenceUpdate;
              setPendingRecurrenceUpdate(null);
              void applyEventTimeUpdate(ev, newStart, newEnd, scope);
            }}
          />
        </>
      }
    >
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && visibleDayEvents.length === 0 && (
        <CalendarEventsEmptyState variant="day" filtered={myEventsOnly && events.length > 0} />
      )}
      {!loading && (
        <DayColumn
          date={viewDate}
          events={events}
          onCreate={(start, end) => {
            setEditingEvent(null);
            setDraftStart(start);
            setDraftEnd(end);
            setShowDrawer(true);
          }}
          onSelect={(ev) => {
            setEditingEvent(ev);
            setShowDrawer(true);
          }}
          onUpdateTime={handleUpdateEventTime}
          busy={showAvailability ? busy : []}
          myEventsOnly={myEventsOnly}
          currentUserId={(session as { user?: { id?: string } })?.user?.id}
        />
      )}
    </CalendarPageShell>
  );
}

function DayColumn({ date, events, onCreate, onSelect, onUpdateTime, busy, myEventsOnly, currentUserId }: { date: Date; events: EventItem[]; onCreate: (start: Date, end: Date) => void; onSelect: (ev: EventItem) => void; onUpdateTime: (ev: EventItem, start: Date, end: Date) => void; busy: { startAt: string; endAt: string }[]; myEventsOnly: boolean; currentUserId?: string; }) {
  const { openContextMenu, contextMenu } = useCalendarEventContextMenu({ onEdit: onSelect });
  const ref = useRef<HTMLDivElement | null>(null);
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragEndY, setDragEndY] = useState<number | null>(null);
  const [dragEventId, setDragEventId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move'|'resize'|null>(null);
  const [dragOriginStart, setDragOriginStart] = useState<Date | null>(null);
  const [dragOriginEnd, setDragOriginEnd] = useState<Date | null>(null);
  const [previewStart, setPreviewStart] = useState<Date | null>(null);
  const [previewEnd, setPreviewEnd] = useState<Date | null>(null);

  const pxToTime = (y: number): Date => {
    const rect = ref.current?.getBoundingClientRect();
    const height = rect?.height || 24 * 40;
    const ratio = Math.max(0, Math.min(1, y / height));
    const minutesFromStart = Math.round(ratio * 24 * 60 / 15) * 15;
    const base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    base.setMinutes(minutesFromStart);
    return base;
  };

  const timeToY = (d: Date): number => {
    const rect = ref.current?.getBoundingClientRect();
    const height = rect?.height || 24 * 40;
    const minutes = d.getHours() * 60 + d.getMinutes();
    return (minutes / (24 * 60)) * height;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setDragStartY(e.clientY - rect.top);
    setDragEndY(null);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartY == null) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    setDragEndY(y);
    if (dragEventId && dragOriginStart && dragOriginEnd && dragMode) {
      if (dragMode === 'move') {
        const deltaMinutes = (y - (dragStartY ?? 0)) / (rect.height || 1) * (24 * 60);
        const newStart = new Date(dragOriginStart);
        const newEnd = new Date(dragOriginEnd);
        newStart.setMinutes(newStart.getMinutes() + Math.round(deltaMinutes / 15) * 15);
        newEnd.setMinutes(newEnd.getMinutes() + Math.round(deltaMinutes / 15) * 15);
        setPreviewStart(newStart);
        setPreviewEnd(newEnd);
      } else if (dragMode === 'resize') {
        setPreviewStart(dragOriginStart);
        setPreviewEnd(pxToTime(y));
      }
    } else if (dragStartY != null) {
      const y1 = Math.min(dragStartY, y);
      const y2 = Math.max(dragStartY, y);
      setPreviewStart(pxToTime(y1));
      setPreviewEnd(pxToTime(y2));
    }
  };
  const handleMouseUp = () => {
    if (dragEventId && dragOriginStart && dragOriginEnd && dragEndY != null && dragMode) {
      const rect = ref.current?.getBoundingClientRect();
      const startY = dragStartY ?? 0;
      const endY = dragEndY;
      if (dragMode === 'move') {
        const deltaMinutes = (endY - startY) / (rect?.height || 1) * (24 * 60);
        const newStart = new Date(dragOriginStart);
        const newEnd = new Date(dragOriginEnd);
        newStart.setMinutes(newStart.getMinutes() + Math.round(deltaMinutes / 15) * 15);
        newEnd.setMinutes(newEnd.getMinutes() + Math.round(deltaMinutes / 15) * 15);
        const ev = events.find(e => e.id === dragEventId);
        if (ev) onUpdateTime(ev, newStart, newEnd);
      } else if (dragMode === 'resize') {
        const start = dragOriginStart;
        const end = pxToTime(endY);
        if (end > start) {
          const ev = events.find(e => e.id === dragEventId);
          if (ev) onUpdateTime(ev, start, end);
        }
      }
    } else if (dragStartY != null && dragEndY != null) {
      const y1 = Math.min(dragStartY, dragEndY);
      const y2 = Math.max(dragStartY, dragEndY);
      const start = pxToTime(y1);
      const end = pxToTime(y2);
      if (end > start) onCreate(start, end);
    }
    setDragStartY(null);
    setDragEndY(null);
    setDragEventId(null);
    setDragMode(null);
    setDragOriginStart(null);
    setDragOriginEnd(null);
    setPreviewStart(null);
    setPreviewEnd(null);
  };

  const dayEvents = events
    .filter(ev => {
      if (!myEventsOnly || !currentUserId) return true;
      return ev.createdById === currentUserId;
    })
    .map(ev => ({ ev, start: new Date(ev.occurrenceStartAt || ev.startAt), end: new Date(ev.occurrenceEndAt || ev.endAt) }))
    .filter(({ start, end }) => start.toDateString() === date.toDateString() || end.toDateString() === date.toDateString());

  return (
    <>
    <div className="grid grid-cols-[60px_1fr] gap-2">
      <div>
        {hours.map(h => (
          <div key={h} className="h-12 text-xs text-gray-400">{`${h}:00`}</div>
        ))}
      </div>
      <div
        ref={ref}
        className="relative border rounded"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
      >
        {hours.map(h => (
          <div key={h} className="h-12 border-b" />
        ))}
        {/* Busy overlay */}
        {busy.map((b, idx) => {
          const s = new Date(b.startAt);
          const e = new Date(b.endAt);
          if (s.toDateString() !== date.toDateString() && e.toDateString() !== date.toDateString()) return null;
          const top = timeToY(s);
          const height = Math.max(4, timeToY(e) - timeToY(s));
          return (
            <div key={idx} className="absolute left-1 right-1 bg-gray-300/30 rounded" style={{ top, height }} />
          );
        })}
        {dayEvents.map(({ ev, start, end }) => {
          const top = timeToY(start);
          const height = Math.max(10, timeToY(end) - timeToY(start));
          return (
            <div
              key={ev.id + (ev.occurrenceStartAt || '')}
              className="absolute left-1 right-1 bg-blue-100 border border-blue-300 rounded text-xs overflow-hidden"
              style={{ top, height }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const rect = ref.current?.getBoundingClientRect();
                if (!rect) return;
                const yInBlock = e.clientY - (rect.top + top);
                const isResize = yInBlock > height - 8;
                setDragEventId(ev.id);
                setDragMode(isResize ? 'resize' : 'move');
                setDragStartY(e.clientY - rect.top);
                setDragOriginStart(start);
                setDragOriginEnd(end);
              }}
              onDoubleClick={(e) => { e.stopPropagation(); onSelect(ev); }}
              onContextMenu={(e) => openContextMenu(e, ev)}
            >
              <div className="px-1 py-0.5 truncate">{ev.title}</div>
              <div className="absolute left-0 right-0 bottom-0 h-1 bg-blue-400 cursor-ns-resize" />
            </div>
          );
        })}
        {previewStart && previewEnd && (
          <div
            className="absolute left-1 right-1 bg-blue-500/20 border border-blue-500 rounded"
            style={{ top: timeToY(previewStart), height: Math.max(4, timeToY(previewEnd) - timeToY(previewStart)) }}
          />
        )}
      </div>
    </div>
    {contextMenu}
    </>
  );
}
