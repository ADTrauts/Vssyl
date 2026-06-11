'use client';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { calendarAPI, EventItem } from '../../api/calendar';
import { chatSocket } from '../../lib/chatSocket';
import { useSession } from 'next-auth/react';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { CalendarPageShell } from './CalendarPageShell';
import { CalendarPageHeader, CalendarShortcutsHelp, CalendarViewSwitcher, PageToolbar } from './CalendarViewChrome';
import { CalendarEventsEmptyState } from './CalendarEventsEmptyState';
import { useCalendarEventContextMenu } from './useCalendarEventContextMenu';
import { useCalendarViewContext, type CalendarViewBaseProps } from './calendarViewContext';
import EventDrawer from './EventDrawer';
import { RecurrenceScopeModal, type RecurrenceScope } from './RecurrenceScopeModal';

export function CalendarWeekView(props: CalendarViewBaseProps = {}) {
  const {
    effectiveContextType,
    effectiveContextId,
    contextFilter: baseContextFilter,
    contextLabel,
    sidebarContextType,
    sidebarContextId,
  } = useCalendarViewContext(props);
  const { visibleCalendarIds, overlayMode } = useCalendarContext();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const { data: session } = useSession();
  const [searchText, setSearchText] = useState('');
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [pendingRecurrenceUpdate, setPendingRecurrenceUpdate] = useState<{
    ev: EventItem;
    newStart: Date;
    newEnd: Date;
  } | null>(null);

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

  const contextFilter = useMemo(
    () => (overlayMode === 'ALL_TABS' ? ([] as string[]) : baseContextFilter),
    [overlayMode, baseContextFilter]
  );

  const openCreateDrawer = useCallback(() => {
    setEditingEvent(null);
    setShowDrawer(true);
  }, []);

  const weekLabel = `Week of ${viewDate.toLocaleDateString()}`;
  const currentUserId = (session as { user?: { id?: string } })?.user?.id;
  const visibleWeekEvents = useMemo(() => {
    if (!myEventsOnly || !currentUserId) return events;
    return events.filter((ev) => ev.createdById === currentUserId);
  }, [events, myEventsOnly, currentUserId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const day = viewDate.getDay();
        const start = new Date(viewDate);
        start.setDate(viewDate.getDate() - day);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
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

  // Realtime: subscribe to calendar_event messages
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
          const exists = prev.findIndex(e => e.id === incoming.id);
          if (exists >= 0) {
            const next = prev.slice();
            next[exists] = { ...next[exists], ...incoming };
            return next;
          }
          return [incoming, ...prev];
        });
      };
      chatSocket.onRaw('calendar_event', handler);
      unsubscribe = () => {
        chatSocket.offRaw('calendar_event', handler);
      };
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session]);

  return (
    <CalendarPageShell
      sidebarContextType={sidebarContextType}
      sidebarContextId={sidebarContextId}
      onSidebarCreateEvent={openCreateDrawer}
      header={
        <CalendarPageHeader viewLabel={`Week — ${weekLabel}`} description={contextLabel} onNewEvent={openCreateDrawer} />
      }
      toolbar={
        <PageToolbar
          leading={
            <div className="flex flex-wrap items-center gap-2">
              <CalendarViewSwitcher active="week" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}
                  aria-label="Previous week"
                >
                  {'<'}
                </button>
                <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => setViewDate(new Date())}>
                  Today
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}
                  aria-label="Next week"
                >
                  {'>'}
                </button>
              </div>
            </div>
          }
          trailing={
            <>
              <input
                className="rounded border px-2 py-1 text-sm"
                placeholder="Search events"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && searchText.trim()) {
                    const day = viewDate.getDay();
                    const start = new Date(viewDate);
                    start.setDate(viewDate.getDate() - day);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                    const resp = await calendarAPI.searchEvents({
                      text: searchText.trim(),
                      start: start.toISOString(),
                      end: end.toISOString(),
                      contexts: contextFilter,
                    });
                    if ((resp as { success?: boolean; data?: EventItem[] })?.success) {
                      setEvents((resp as { data: EventItem[] }).data);
                    }
                  }
                }}
              />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={myEventsOnly} onChange={(e) => setMyEventsOnly(e.target.checked)} />
                My events
              </label>
              <CalendarShortcutsHelp />
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
      {!loading && visibleWeekEvents.length === 0 && (
        <CalendarEventsEmptyState variant="week" filtered={myEventsOnly && events.length > 0} />
      )}
      {!loading && (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <DayColumn
              key={i}
              dayIndex={i}
              events={events}
              onCreate={(start, end) => {
                setEditingEvent({
                  id: '',
                  calendarId: '',
                  title: '',
                  startAt: start.toISOString(),
                  endAt: end.toISOString(),
                  allDay: false,
                  timezone: 'UTC',
                } as EventItem);
                setShowDrawer(true);
              }}
              onSelect={(ev) => {
                setEditingEvent(ev);
                setShowDrawer(true);
              }}
              onUpdateTime={handleUpdateEventTime}
              myEventsOnly={myEventsOnly}
              currentUserId={(session as { user?: { id?: string } })?.user?.id}
            />
          ))}
        </div>
      )}
    </CalendarPageShell>
  );
}

function DayColumn({ dayIndex, events, onCreate, onSelect, onUpdateTime, myEventsOnly, currentUserId }: { dayIndex: number; events: EventItem[]; onCreate: (start: Date, end: Date) => void; onSelect: (ev: EventItem) => void; onUpdateTime: (ev: EventItem, start: Date, end: Date) => void; myEventsOnly: boolean; currentUserId?: string; }) {
  const { openContextMenu, contextMenu } = useCalendarEventContextMenu({ onEdit: onSelect });
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragEndY, setDragEndY] = useState<number | null>(null);
  const [dragEventId, setDragEventId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move'|'resize'|null>(null);
  const [dragOriginStart, setDragOriginStart] = useState<Date | null>(null);
  const [dragOriginEnd, setDragOriginEnd] = useState<Date | null>(null);
  const [previewStart, setPreviewStart] = useState<Date | null>(null);
  const [previewEnd, setPreviewEnd] = useState<Date | null>(null);

  const pxToTime = (y: number): Date => {
    // Simple mapping: 200px column height -> 10 hours window starting 8am; adjust as needed
    const startHour = 8;
    const hoursVisible = 10;
    const rect = ref.current?.getBoundingClientRect();
    const height = rect?.height || 200;
    const ratio = Math.max(0, Math.min(1, y / height));
    const minutesFromStart = Math.round(ratio * hoursVisible * 60 / 15) * 15; // snap to 15 min
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const base = new Date(today);
    base.setDate(today.getDate() - today.getDay() + dayIndex); // go to this column's day
    base.setHours(startHour, 0, 0, 0);
    base.setMinutes(base.getMinutes() + minutesFromStart);
    return base;
  };

  const timeToY = (date: Date): number => {
    const startHour = 8;
    const hoursVisible = 10;
    const rect = ref.current?.getBoundingClientRect();
    const height = rect?.height || 200;
    const d = new Date(date);
    const minutes = (d.getHours() - startHour) * 60 + d.getMinutes();
    const clamped = Math.max(0, Math.min(hoursVisible * 60, minutes));
    return (clamped / (hoursVisible * 60)) * height;
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
        const deltaMinutes = (y - (dragStartY ?? 0)) / (ref.current?.getBoundingClientRect().height || 200) * (10 * 60);
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
      const startY = dragStartY ?? 0;
      const endY = dragEndY;
      if (dragMode === 'move') {
        const deltaMinutes = (endY - startY) / (ref.current?.getBoundingClientRect().height || 200) * (10 * 60);
        const newStart = new Date(dragOriginStart);
        const newEnd = new Date(dragOriginEnd);
        newStart.setMinutes(newStart.getMinutes() + Math.round(deltaMinutes / 15) * 15);
        newEnd.setMinutes(newEnd.getMinutes() + Math.round(deltaMinutes / 15) * 15);
        const ev = dayEvents.find(e => e.id === dragEventId);
        if (ev) onUpdateTime(ev, newStart, newEnd);
      } else if (dragMode === 'resize') {
        const start = dragOriginStart;
        const end = pxToTime(endY);
        if (end > start) {
          const ev = dayEvents.find(e => e.id === dragEventId);
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

  const dayEvents = events.filter(ev => {
    const d = new Date(ev.occurrenceStartAt || ev.startAt).getDay();
    if (d !== dayIndex) return false;
    if (myEventsOnly && currentUserId) {
      return ev.createdById === currentUserId;
    }
    return true;
  });

  const hasConflict = (start: Date, end: Date, excludeId?: string) => {
    return dayEvents.some(ev => {
      if (excludeId && ev.id === excludeId) return false;
      const s = new Date(ev.occurrenceStartAt || ev.startAt);
      const e = new Date(ev.occurrenceEndAt || ev.endAt);
      return s < end && e > start; // overlap
    });
  };

  return (
    <>
    <div
      ref={ref}
      className="border rounded p-2 min-h-[200px] relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      {dayEvents.slice(0, 20).map(ev => {
        const start = new Date(ev.occurrenceStartAt || ev.startAt);
        const end = new Date(ev.occurrenceEndAt || ev.endAt);
        const top = timeToY(start);
        const height = Math.max(10, timeToY(end) - timeToY(start));
        return (
          <div
            key={ev.id}
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
          className={
            `absolute left-1 right-1 rounded ${hasConflict(previewStart, previewEnd, dragEventId || undefined) ? 'bg-red-500/20 border border-red-500' : 'bg-blue-500/20 border border-blue-500'}`
          }
          style={{ top: timeToY(previewStart), height: Math.max(4, timeToY(previewEnd) - timeToY(previewStart)) }}
        />
      )}
    </div>
    {contextMenu}
    </>
  );
}
