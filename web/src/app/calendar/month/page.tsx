'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { calendarAPI, EventItem } from '../../../api/calendar';
import { useDashboard } from '../../../contexts/DashboardContext';
import { CalendarProvider, useCalendarContext } from '../../../contexts/CalendarContext';
import CalendarListSidebar from '../../../components/calendar/CalendarListSidebar';
import EventDrawer from '../../../components/calendar/EventDrawer';
import { useSession } from 'next-auth/react';
import { chatSocket } from '../../../lib/chatSocket';

// Define Calendar type for the filter dropdown
interface Calendar {
  id: string;
  name: string;
  color?: string;
}

function MonthInner() {
  const { currentDashboard, getDashboardType, getDashboardDisplayName } = useDashboard();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [draftStart, setDraftStart] = useState<Date | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const { data: session } = useSession();
  const [searchText, setSearchText] = useState('');
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [selectedCalendarFilter, setSelectedCalendarFilter] = useState<string>('all');
  const [selectedAttendeeFilter, setSelectedAttendeeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [calendars, setCalendars] = useState<Calendar[]>([]);

  // Load calendars for filter dropdown
  useEffect(() => {
    (async () => {
      try {
        const resp = await calendarAPI.listCalendars();
        if (resp?.success) {
          setCalendars(resp.data);
        }
      } catch (error) {
        console.error('Failed to load calendars:', error);
      }
    })();
  }, []);

  // Apply filters to events
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Calendar filter
    if (selectedCalendarFilter !== 'all') {
      filtered = filtered.filter(ev => ev.calendarId === selectedCalendarFilter);
    }
    
    // Attendee filter
    if (selectedAttendeeFilter !== 'all') {
      filtered = filtered.filter(ev => {
        if (selectedAttendeeFilter === 'me') {
          return ev.createdById === (session as any)?.user?.id;
        } else if (selectedAttendeeFilter === 'others') {
          return ev.createdById !== (session as any)?.user?.id;
        }
        return true;
      });
    }
    
    // Status filter
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(ev => {
        if (ev.attendees && ev.attendees.length > 0) {
          return ev.attendees.some(att => {
            if (selectedStatusFilter === 'accepted') return att.response === 'ACCEPTED';
            if (selectedStatusFilter === 'declined') return att.response === 'DECLINED';
            if (selectedStatusFilter === 'tentative') return att.response === 'TENTATIVE';
            if (selectedStatusFilter === 'needs_action') return att.response === 'NEEDS_ACTION';
            return true;
          });
        }
        return true;
      });
    }
    
    // Search text filter
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(ev => 
        ev.title.toLowerCase().includes(searchLower) ||
        (ev.description && ev.description.toLowerCase().includes(searchLower)) ||
        (ev.location && ev.location.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [events, selectedCalendarFilter, selectedAttendeeFilter, selectedStatusFilter, debouncedSearchText, session]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load persistent filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('calendar-filters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setSelectedCalendarFilter(filters.calendar || 'all');
        setSelectedAttendeeFilter(filters.attendee || 'all');
        setSelectedStatusFilter(filters.status || 'all');
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    const filters = {
      calendar: selectedCalendarFilter,
      attendee: selectedAttendeeFilter,
      status: selectedStatusFilter
    };
    localStorage.setItem('calendar-filters', JSON.stringify(filters));
  }, [selectedCalendarFilter, selectedAttendeeFilter, selectedStatusFilter]);

  // Initialize view from ?y=YYYY&m=1-12 if present
  useEffect(() => {
    const y = searchParams?.get('y');
    const m = searchParams?.get('m');
    if (y || m) {
      const year = y ? parseInt(y, 10) : new Date().getFullYear();
      const month = m ? Math.max(0, Math.min(11, parseInt(m, 10) - 1)) : new Date().getMonth();
      if (!isNaN(year) && !isNaN(month)) {
        setViewDate(new Date(year, month, 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextFilter = useMemo(() => {
    // Default to All Tabs overlay: fetch all accessible contexts for now
    // Minimal MVP: if currentDashboard exists, ensure its primary calendar is provisioned
    if (!currentDashboard) return [] as string[];
    const type = getDashboardType(currentDashboard).toUpperCase();
    const id = (currentDashboard as any).business?.id || (currentDashboard as any).household?.id || currentDashboard.id;
    return [`${type}:${id}`];
  }, [currentDashboard, getDashboardType]);

  const { visibleCalendarIds } = useCalendarContext();

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load current view month range
        const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
        // If user has explicitly selected calendars, pass them for precise filtering
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
    };
    run();
  }, [contextFilter, visibleCalendarIds, viewDate]);

  // Realtime: subscribe to socket updates
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
      (chatSocket as any).on?.('calendar_event', handler as any);
      unsubscribe = () => { (chatSocket as any).off?.('calendar_event', handler as any); };
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [session]);

  return (
    <div className="flex h-full">
      <CalendarListSidebar />
      <div className="flex-1 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Calendar — Month</h1>
            <div className="ml-2 grid grid-cols-4 gap-2 text-xs">
              <a className="px-2 py-1 border rounded text-center hover:bg-gray-50" href="/calendar/day">Day</a>
              <a className="px-2 py-1 border rounded text-center hover:bg-gray-50" href="/calendar/week">Week</a>
              <a className="px-2 py-1 border rounded text-center bg-gray-100" href="/calendar/month">Month</a>
              <a className="px-2 py-1 border rounded text-center hover:bg-gray-50" href="/calendar/year">Year</a>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 border rounded" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>{'<'}</button>
              <button className="px-2 py-1 border rounded" onClick={() => setViewDate(new Date())}>Today</button>
              <button className="px-2 py-1 border rounded" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>{'>'}</button>
              <div className="ml-2 text-sm text-gray-600">{viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowDrawer(true)} className="px-3 py-1 border rounded">New Event</button>
            <button 
              onClick={async () => {
                try {
                  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                  const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
                  
                  // Get events for export
                  const selectedIds = Array.from(visibleCalendarIds);
                  const resp = selectedIds.length > 0
                    ? await calendarAPI.listEvents({ start: start.toISOString(), end: end.toISOString(), contexts: contextFilter, calendarIds: selectedIds })
                    : await calendarAPI.listEvents({ start: start.toISOString(), end: end.toISOString(), contexts: contextFilter });
                  
                  if (resp?.success && resp.data.length > 0) {
                    // Create ICS content
                    let icsContent = 'BEGIN:VCALENDAR\r\n';
                    icsContent += 'VERSION:2.0\r\n';
                    icsContent += 'PRODID:-//Vssyl//Calendar//EN\r\n';
                    icsContent += 'CALSCALE:GREGORIAN\r\n';
                    icsContent += 'METHOD:PUBLISH\r\n';
                    
                    resp.data.forEach(event => {
                      icsContent += 'BEGIN:VEVENT\r\n';
                      icsContent += `UID:${event.id}\r\n`;
                      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
                      icsContent += `DTSTART:${event.allDay ? new Date(event.startAt).toISOString().slice(0, 8) : new Date(event.startAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
                      icsContent += `DTEND:${event.allDay ? new Date(event.endAt).toISOString().slice(0, 8) : new Date(event.endAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
                      if (event.allDay) {
                        icsContent += 'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE\r\n';
                      }
                      icsContent += `SUMMARY:${event.title.replace(/\r?\n/g, '\\n')}\r\n`;
                      if (event.description) {
                        icsContent += `DESCRIPTION:${event.description.replace(/\r?\n/g, '\\n')}\r\n`;
                      }
                      if (event.location) {
                        icsContent += `LOCATION:${event.location.replace(/\r?\n/g, '\\n')}\r\n`;
                      }
                      if (event.recurrenceRule) {
                        icsContent += `RRULE:${event.recurrenceRule}\r\n`;
                      }
                      icsContent += 'END:VEVENT\r\n';
                    });
                    
                    icsContent += 'END:VCALENDAR\r\n';
                    
                    // Download file
                    const blob = new Blob([icsContent], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `calendar-${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}.ics`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } else {
                    alert('No events to export for this month.');
                  }
                } catch (error) {
                  console.error('Error exporting ICS:', error);
                  alert('Error exporting calendar. Please try again.');
                }
              }}
              className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
              title="Export month events to ICS file"
            >
              📅 Export ICS
            </button>
            <div className="text-sm text-gray-500">{currentDashboard ? getDashboardDisplayName(currentDashboard) : 'All Tabs'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            className="px-2 py-1 border rounded text-sm"
            placeholder="Search events"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && searchText.trim()) {
                const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 23, 59, 59);
                const resp = await calendarAPI.searchEvents({ text: searchText.trim(), start: start.toISOString(), end: end.toISOString(), contexts: contextFilter });
                if ((resp as any)?.success) setEvents((resp as any).data);
              }
            }}
          />
          <label className="text-xs flex items-center gap-1 ml-2">
            <input type="checkbox" checked={myEventsOnly} onChange={(e) => setMyEventsOnly(e.target.checked)} />
            My events
          </label>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Calendar:</span>
            <select 
              value={selectedCalendarFilter} 
              onChange={(e) => setSelectedCalendarFilter(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="all">All calendars</option>
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Attendee:</span>
            <select 
              value={selectedAttendeeFilter} 
              onChange={(e) => setSelectedAttendeeFilter(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="all">All attendees</option>
              <option value="me">Me only</option>
              <option value="others">Others only</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Status:</span>
            <select 
              value={selectedStatusFilter} 
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="all">All statuses</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="tentative">Tentative</option>
              <option value="needs_action">Needs action</option>
            </select>
          </div>
        </div>
        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && (
          <MonthGrid 
            viewDate={viewDate} 
            events={filteredEvents} 
            onCellCreate={(start, end) => { setEditingEvent(null); setDraftStart(start); setDraftEnd(end); setShowDrawer(true); }} 
            onEventClick={(ev) => { setEditingEvent(ev); setShowDrawer(true); }}
            onEventMove={async (ev, deltaDays) => {
              const start = new Date(ev.occurrenceStartAt || ev.startAt);
              const end = new Date(ev.occurrenceEndAt || ev.endAt);
              let newStart = new Date(start);
              let newEnd = new Date(end);
              if (deltaDays !== 0) {
                newStart = new Date(start);
                newEnd = new Date(end);
                newStart.setDate(newStart.getDate() + deltaDays);
                newEnd.setDate(newEnd.getDate() + deltaDays);
              } else if (ev.occurrenceEndAt) {
                // Interpret as end-resize (passed via modified ev)
                newEnd = new Date(ev.occurrenceEndAt);
              }
              const payload: any = { startAt: newStart.toISOString(), endAt: newEnd.toISOString() };
              if (ev.recurrenceRule) {
                const thisOnly = confirm('Move this occurrence only? Press Cancel to move the entire series.');
                if (thisOnly) {
                  payload.editMode = 'THIS';
                  payload.occurrenceStartAt = ev.occurrenceStartAt || ev.startAt;
                }
              }
              const resp = await calendarAPI.updateEvent(ev.id, payload);
              if ((resp as any)?.success) {
                const updated = (resp as any).data as EventItem;
                setEvents(prev => prev.map(e => (e.id === ev.id ? { ...e, ...updated } : e)));
              }
            }}
            myEventsOnly={myEventsOnly}
            currentUserId={(session as any)?.user?.id}
          />
        )}
      </div>
      <EventDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        onCreated={() => { setShowDrawer(false); /* TODO: trigger refresh */ setViewDate(new Date(viewDate)); }}
        onUpdated={() => { setShowDrawer(false); setViewDate(new Date(viewDate)); }}
        contextType={currentDashboard ? (getDashboardType(currentDashboard).toUpperCase() as any) : undefined}
        contextId={(currentDashboard as any)?.business?.id || (currentDashboard as any)?.household?.id || currentDashboard?.id}
        defaultStart={draftStart}
        defaultEnd={draftEnd}
        eventToEdit={editingEvent || undefined}
      />
    </div>
  );
}

function MonthGrid({ viewDate, events, onCellCreate, onEventClick, onEventMove, myEventsOnly, currentUserId }: { viewDate: Date; events: EventItem[]; onCellCreate: (start: Date, end: Date) => void; onEventClick: (ev: EventItem) => void; onEventMove: (ev: EventItem, deltaDays: number) => void; myEventsOnly: boolean; currentUserId?: string; }) {
  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = 42; // 6 weeks view

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells = Array.from({ length: totalCells }).map((_, idx) => {
    const dayNum = idx - startWeekday + 1;
    const inCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const date = inCurrentMonth ? new Date(year, month, dayNum) : null;
    const isToday = date ? (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) : false;
    return { idx, dayNum, inCurrentMonth, date, isToday };
  });

  // Precompute events per day with overlap detection and positioning
  const eventsByDay = new Map<string, EventItem[]>();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  const pushEventForDate = (d: Date, ev: EventItem) => {
    const key = d.toISOString().slice(0,10);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(ev);
  };
  
  events.forEach(ev => {
    const start = new Date(ev.occurrenceStartAt || ev.startAt);
    const end = new Date(ev.occurrenceEndAt || ev.endAt);
    // Clip to current month range
    const clipStart = start < monthStart ? monthStart : start;
    const clipEnd = end > monthEnd ? monthEnd : end;
    // Iterate day by day
    const d = new Date(clipStart.getFullYear(), clipStart.getMonth(), clipStart.getDate());
    while (d <= clipEnd) {
      pushEventForDate(d, ev);
      d.setDate(d.getDate() + 1);
    }
  });

  // Calculate overlap positions for each day
  eventsByDay.forEach((dayEvents, dateKey) => {
    // Sort by start time and duration (longer events first for better overlap handling)
    dayEvents.sort((a, b) => {
      const aStart = new Date(a.occurrenceStartAt || a.startAt);
      const bStart = new Date(b.occurrenceStartAt || b.startAt);
      if (aStart.getTime() !== bStart.getTime()) {
        return aStart.getTime() - bStart.getTime();
      }
      // Longer events first
      const aDuration = new Date(a.occurrenceEndAt || a.endAt).getTime() - aStart.getTime();
      const bDuration = new Date(b.occurrenceEndAt || b.endAt).getTime() - bStart.getTime();
      return bDuration - aDuration;
    });

    // Assign overlap positions
    let currentPosition = 0;
    let lastEndTime = 0;
    
    dayEvents.forEach((ev, index) => {
      const startTime = new Date(ev.occurrenceStartAt || ev.startAt).getTime();
      if (startTime < lastEndTime) {
        currentPosition++;
      } else {
        currentPosition = 0;
      }
      (ev as any).overlapPosition = currentPosition;
      lastEndTime = Math.max(lastEndTime, new Date(ev.occurrenceEndAt || ev.endAt).getTime());
    });
  });

  const { calendarsById } = useCalendarContext();

  // Drag selection across days
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const [dragEndIdx, setDragEndIdx] = useState<number | null>(null);
  const isDragging = dragStartIdx !== null && dragEndIdx !== null;

  const idxToDate = (idx: number): Date | null => {
    const dayNum = idx - startWeekday + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  };

  const handleMouseUp = () => {
    if (dragStartIdx !== null && dragEndIdx !== null) {
      const startIdx = Math.min(dragStartIdx, dragEndIdx);
      const endIdx = Math.max(dragStartIdx, dragEndIdx);
      const startDate = idxToDate(startIdx);
      const endDate = idxToDate(endIdx);
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start.toDateString() === end.toDateString()) {
          start.setHours(9, 0, 0, 0);
          end.setHours(10, 0, 0, 0);
        } else {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
        }
        onCellCreate(start, end);
      }
    }
    setDragStartIdx(null);
    setDragEndIdx(null);
  };

  return (
    <div className="w-full" onMouseUp={handleMouseUp}>
      {/* Day of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-medium text-gray-500">
        {dayNames.map(n => (
          <div key={n} className="px-2">{n}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => (
          <button
            key={cell.idx}
            className={`relative text-left border rounded p-2 min-h-[100px] text-xs w-full ${cell.inCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'} ${cell.isToday ? 'ring-2 ring-blue-500' : ''} ${isDragging && dragStartIdx !== null && dragEndIdx !== null && cell.idx >= Math.min(dragStartIdx, dragEndIdx) && cell.idx <= Math.max(dragStartIdx, dragEndIdx) ? 'ring-1 ring-blue-400 bg-blue-50' : ''}`}
            onClick={() => {
              if (!cell.date) return;
              const start = new Date(cell.date);
              start.setHours(9,0,0,0);
              const end = new Date(start.getTime() + 60*60*1000);
              onCellCreate(start, end);
            }}
            onMouseDown={() => { setDragStartIdx(cell.idx); setDragEndIdx(cell.idx); }}
            onMouseEnter={() => { if (dragStartIdx !== null) setDragEndIdx(cell.idx); }}
          >
            <div className="flex items-center justify-between mb-1">
              <span />
              <span className={`text-[11px] ${cell.isToday ? 'font-bold text-blue-600' : ''}`}>{cell.inCurrentMonth ? cell.dayNum : ''}</span>
            </div>
            <div className="space-y-1">
               {(cell.date ? (eventsByDay.get(cell.date.toISOString().slice(0,10)) || []) : []).filter(ev => {
                 if (!myEventsOnly || !currentUserId) return true;
                 return ev.createdById === currentUserId;
               }).slice(0,5).map(ev => {
                const color = calendarsById[ev.calendarId]?.color || '#3b82f6';
                const start = new Date(ev.occurrenceStartAt || ev.startAt);
                const end = new Date(ev.occurrenceEndAt || ev.endAt);
                const isStartOfSpan = start.toDateString() === cell.date?.toDateString();
                const isEndOfSpan = end.toDateString() === cell.date?.toDateString();
                const isMultiDay = start.toDateString() !== end.toDateString();
                const overlapPosition = (ev as any).overlapPosition || 0;
                
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1 truncate w-full hover:bg-gray-50 rounded cursor-move"
                    style={{
                      marginLeft: overlapPosition * 8,
                      maxWidth: `calc(100% - ${overlapPosition * 8}px)`
                    }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    draggable
                    onDragStart={(e) => {
                      // Shift+drag for start resize, Alt+drag for end resize, default is move
                      const payload = { 
                        id: ev.id, 
                        mode: e.shiftKey ? 'resizeStart' : e.altKey ? 'resizeEnd' : 'move' 
                      };
                      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                      e.currentTarget.setAttribute('data-dragging', 'true');
                    }}
                    onDragEnd={(e) => { e.currentTarget.removeAttribute('data-dragging'); }}
                    title="Drag to move. Shift+Drag to resize start date. Alt+Drag to resize end date."
                  >
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    
                    {/* Continuation chevrons for multi-day events */}
                    {isMultiDay && !isStartOfSpan && (
                      <span className="text-gray-400 mr-1">‹</span>
                    )}
                    
                    <span className="truncate">{ev.title}</span>
                    
                    {isMultiDay && !isEndOfSpan && (
                      <span className="text-gray-400 ml-1">›</span>
                    )}
                    
                    {/* Time for non-all-day events */}
                    {!ev.allDay && (
                      <span className="text-gray-500 ml-1">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                );
              })}
              {cell.date && (eventsByDay.get(cell.date.toISOString().slice(0,10)) || []).filter(ev => {
                if (!myEventsOnly || !currentUserId) return true;
                return ev.createdById === currentUserId;
              }).length > 5 && (
                <div className="text-gray-400 text-center">
                  +{(eventsByDay.get(cell.date.toISOString().slice(0,10)) || []).filter(ev => {
                    if (!myEventsOnly || !currentUserId) return true;
                    return ev.createdById === currentUserId;
                  }).length - 5} more
                </div>
              )}
              {/* Allow drop to move by day */}
              <div
                className="absolute inset-0"
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  if (!cell.inCurrentMonth || !cell.date) return;
                  const data = e.dataTransfer.getData('text/plain');
                  try {
                    const parsed = JSON.parse(data);
                    const ev = events.find(x => x.id === parsed.id);
                    if (!ev) return;
                    const start = new Date(ev.occurrenceStartAt || ev.startAt);
                    
                    if (parsed.mode === 'resizeStart') {
                      // Shift+drag: resize start date to drop day start
                      const dropStart = new Date(cell.date);
                      dropStart.setHours(0, 0, 0, 0);
                      const newStart = dropStart;
                      const newEnd = new Date(ev.occurrenceEndAt || ev.endAt);
                      
                      if (newStart < newEnd) {
                        // Update both start and end dates to maintain duration
                        const duration = newEnd.getTime() - start.getTime();
                        const adjustedEnd = new Date(newStart.getTime() + duration);
                        onEventMove({ ...ev, occurrenceStartAt: newStart.toISOString(), occurrenceEndAt: adjustedEnd.toISOString() } as any, 0);
                      }
                    } else if (parsed.mode === 'resizeEnd') {
                      // Alt+drag: resize end date to drop day end
                      const dropEnd = new Date(cell.date);
                      dropEnd.setHours(23, 59, 59, 999);
                      const newStart = new Date(ev.occurrenceStartAt || ev.startAt);
                      const newEnd = dropEnd;
                      
                      if (newEnd > newStart) {
                        onEventMove({ ...ev, occurrenceEndAt: newEnd.toISOString() } as any, 0);
                      }
                    } else {
                      // Default: move event
                      const deltaDays = Math.round((cell.date.getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / (1000*60*60*24));
                      if (deltaDays !== 0) onEventMove(ev, deltaDays);
                    }
                  } catch {}
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CalendarMonthPage() {
  return (
    <CalendarProvider>
      <MonthInner />
    </CalendarProvider>
  );
}

