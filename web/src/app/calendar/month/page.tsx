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
    <div className="flex h-screen overflow-hidden">
      <CalendarListSidebar />
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Ultra-Compact Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + Navigation */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calendar — Month</h1>
              
              {/* Navigation Controls */}
              <div className="flex items-center space-x-2">
                <button 
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
                  onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
                >
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">{'<'}</span>
                </button>
                <button 
                  className="px-3 py-1.5 rounded-lg text-white transition-colors font-medium text-sm" 
                  style={{ 
                    backgroundColor: 'var(--primary-green)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-red)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-green)'}
                  onClick={() => setViewDate(new Date())}
                >
                  Today
                </button>
                <button 
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
                  onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
                >
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">{'>'}</span>
                </button>
                <div className="text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-lg font-semibold text-sm bg-gray-100 dark:bg-gray-700">
                  {viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Right: View Switcher + Actions */}
            <div className="flex items-center space-x-3">
              {/* View Switcher */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex space-x-1">
                <a 
                  className="px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" 
                  href="/calendar/day"
                >
                  Day
                </a>
                <a 
                  className="px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" 
                  href="/calendar/week"
                >
                  Week
                </a>
                <a 
                  className="px-2 py-1 rounded-md text-xs font-medium text-white shadow-sm" 
                  href="/calendar/month"
                  style={{ backgroundColor: 'var(--primary-green)' }}
                >
                  Month
                </a>
                <a 
                  className="px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300" 
                  href="/calendar/year"
                >
                  Year
                </a>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowDrawer(true)} 
                  className="px-3 py-1.5 rounded-lg font-medium text-white shadow-sm hover:shadow-md transition-all text-xs"
                  style={{ backgroundColor: 'var(--primary-green)' }}
                >
                  <span>New Event</span>
                </button>
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
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center space-x-1 text-xs"
                  title="Export month events to ICS file"
                >
                  <span>📅</span>
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Modern Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                className="w-full px-3 py-2 pl-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100"
                style={{ 
                  '--tw-ring-color': 'var(--primary-green)' 
                } as React.CSSProperties}
                placeholder="Search events..."
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
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* My Events Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                checked={myEventsOnly} 
                onChange={(e) => setMyEventsOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">My events only</span>
            </label>
          </div>
          
          {/* Filter Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Calendar:</span>
              <select 
                value={selectedCalendarFilter} 
                onChange={(e) => setSelectedCalendarFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:border-transparent transition-all"
                style={{ 
                  '--tw-ring-color': 'var(--primary-green)' 
                } as React.CSSProperties}
              >
                <option value="all">All calendars</option>
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Attendee:</span>
              <select 
                value={selectedAttendeeFilter} 
                onChange={(e) => setSelectedAttendeeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:border-transparent transition-all"
                style={{ 
                  '--tw-ring-color': 'var(--primary-green)' 
                } as React.CSSProperties}
              >
                <option value="all">All attendees</option>
                <option value="me">Me only</option>
                <option value="others">Others only</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Status:</span>
              <select 
                value={selectedStatusFilter} 
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:border-transparent transition-all"
                style={{ 
                  '--tw-ring-color': 'var(--primary-green)' 
                } as React.CSSProperties}
              >
                <option value="all">All statuses</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="tentative">Tentative</option>
                <option value="needs_action">Needs action</option>
              </select>
            </div>
          </div>
        </div>
        {loading && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-600 font-medium">Loading calendar events...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 text-red-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}
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
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" onMouseUp={handleMouseUp}>
      {/* Day of week header */}
      <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        {dayNames.map(n => (
          <div key={n} className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
            {n}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell) => (
          <button
            key={cell.idx}
            className={`relative text-left border-r border-b border-gray-200 last:border-r-0 p-3 min-h-[120px] text-xs w-full transition-all duration-200 hover:bg-gray-50 ${cell.inCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'} ${cell.isToday ? 'ring-1' : ''} ${isDragging && dragStartIdx !== null && dragEndIdx !== null && cell.idx >= Math.min(dragStartIdx, dragEndIdx) && cell.idx <= Math.max(dragStartIdx, dragEndIdx) ? 'ring-2 bg-blue-50' : ''}`}
            style={cell.isToday ? {
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              '--tw-ring-color': 'var(--primary-green)'
            } as React.CSSProperties : isDragging && dragStartIdx !== null && dragEndIdx !== null && cell.idx >= Math.min(dragStartIdx, dragEndIdx) && cell.idx <= Math.max(dragStartIdx, dragEndIdx) ? {
              '--tw-ring-color': 'var(--info-blue)'
            } as React.CSSProperties : undefined}
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
            <div className="flex items-center justify-between mb-2">
              <span />
              <span 
                className={`text-sm font-medium ${cell.isToday ? 'text-white rounded-full w-6 h-6 flex items-center justify-center font-bold' : 'text-gray-700'}`}
                style={cell.isToday ? { backgroundColor: 'var(--primary-green)' } : undefined}
              >
                {cell.inCurrentMonth ? cell.dayNum : ''}
              </span>
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
                    className="flex items-center gap-2 truncate w-full hover:shadow-md rounded-lg cursor-move transition-all duration-200 transform hover:scale-[1.02] bg-white border-l-4 shadow-sm hover:shadow-lg"
                    style={{
                      marginLeft: overlapPosition * 8,
                      maxWidth: `calc(100% - ${overlapPosition * 8}px)`,
                      borderLeftColor: color
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Continuation chevrons for multi-day events */}
                      {isMultiDay && !isStartOfSpan && (
                        <span className="text-gray-400 text-xs font-bold">‹</span>
                      )}
                      
                      <span className="truncate text-sm font-medium text-gray-800">{ev.title}</span>
                      
                      {isMultiDay && !isEndOfSpan && (
                        <span className="text-gray-400 text-xs font-bold">›</span>
                      )}
                    </div>
                    
                    {/* Time for non-all-day events */}
                    {!ev.allDay && (
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
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

