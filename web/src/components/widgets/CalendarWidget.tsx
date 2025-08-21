'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { calendarAPI, EventItem, Calendar as CalendarType } from '../../api/calendar';
import { formatRelativeTime } from '../../utils/format';

interface CalendarWidgetProps {
  id: string;
  config?: CalendarWidgetConfig;
  onConfigChange?: (config: CalendarWidgetConfig) => void;
  onRemove?: () => void;
  
  // Dashboard context
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
}

interface CalendarWidgetConfig {
  viewMode: 'week' | 'month';
  maxEventsToShow: number;
  showQuickAdd: boolean;
  showEventDetails: boolean;
  showCalendarSelector: boolean;
  refreshInterval: number;
}

interface CalendarEvent extends EventItem {
  calendar?: CalendarType;
}

const defaultConfig: CalendarWidgetConfig = {
  viewMode: 'week',
  maxEventsToShow: 5,
  showQuickAdd: true,
  showEventDetails: true,
  showCalendarSelector: true,
  refreshInterval: 300000 // 5 minutes
};

export default function CalendarWidget({ 
  id, 
  config, 
  onConfigChange, 
  onRemove,
  dashboardId,
  dashboardType,
  dashboardName
}: CalendarWidgetProps) {
  // Ensure config always has a value, even if null/undefined is passed
  const widgetConfig = config || defaultConfig;
  
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [showConfig, setShowConfig] = useState(false);

  // Get dashboard context for calendar filtering
  const getDashboardContext = useMemo(() => {
    switch (dashboardType) {
      case 'business':
        return { contextType: 'BUSINESS', contextId: dashboardId };
      case 'educational':
        return { contextType: 'EDUCATIONAL', contextId: dashboardId };
      case 'household':
        return { contextType: 'HOUSEHOLD', contextId: dashboardId };
      default:
        return { contextType: 'PERSONAL', contextId: dashboardId };
    }
  }, [dashboardType, dashboardId]);

  // Load calendars for this dashboard context
  useEffect(() => {
    const loadCalendars = async () => {
      if (!session?.accessToken) return;
      
      try {
        const response = await calendarAPI.listCalendars(getDashboardContext);
        if (response?.success) {
          setCalendars(response.data);
          // Auto-select first calendar if none selected
          if (selectedCalendarId === 'all' && response.data.length > 0) {
            setSelectedCalendarId(response.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load calendars:', err);
      }
    };

    loadCalendars();
  }, [session?.accessToken, getDashboardContext, selectedCalendarId]);

  // Load events for the current view
  useEffect(() => {
    const loadEvents = async () => {
      if (!session?.accessToken) return;
      
      setLoading(true);
      try {
        const startDate = new Date();
        const endDate = new Date();
        
        if (widgetConfig.viewMode === 'week') {
          endDate.setDate(startDate.getDate() + 7);
        } else {
          endDate.setMonth(startDate.getMonth() + 1);
        }

        const response = await calendarAPI.listEvents({
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          contexts: [dashboardId],
          calendarIds: selectedCalendarId !== 'all' ? [selectedCalendarId] : undefined
        });

        if (response?.success) {
          // Enrich events with calendar information
          const enrichedEvents = response.data.map(event => ({
            ...event,
            calendar: calendars.find(cal => cal.id === event.calendarId)
          }));
          
          // Sort by start time
          enrichedEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          
          setEvents(enrichedEvents);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load calendar events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    
    // Set up refresh interval
    const interval = setInterval(loadEvents, widgetConfig.refreshInterval);
    return () => clearInterval(interval);
  }, [session?.accessToken, dashboardId, selectedCalendarId, widgetConfig.viewMode, widgetConfig.refreshInterval, calendars]);

  // Get dashboard-specific title and description
  const getDashboardSpecificInfo = () => {
    switch (dashboardType) {
      case 'business':
        return {
          title: 'Business Calendar',
          description: 'Team meetings and business events',
          icon: '🏢'
        };
      case 'educational':
        return {
          title: 'Academic Calendar',
          description: 'Classes and academic deadlines',
          icon: '🎓'
        };
      case 'household':
        return {
          title: 'Family Calendar',
          description: 'Family events and shared schedules',
          icon: '🏠'
        };
      default:
        return {
          title: 'Personal Calendar',
          description: 'Your personal schedule',
          icon: '📅'
        };
    }
  };

  const dashboardInfo = getDashboardSpecificInfo();

  // Format event time for display
  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day';
    
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    
    if (widgetConfig.viewMode === 'week') {
      return start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return start.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Navigate to full calendar
  const goToFullCalendar = () => {
    window.open(`/calendar/month?dashboard=${dashboardId}`, '_blank');
  };

  // Quick add event
  const quickAddEvent = () => {
    window.open(`/calendar/month?dashboard=${dashboardId}&add=true`, '_blank');
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{dashboardInfo.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{dashboardInfo.title}</h3>
            <p className="text-sm text-gray-500">{dashboardInfo.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConfig(!showConfig)}
            className="p-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Calendar Selector */}
      {widgetConfig.showCalendarSelector && calendars.length > 1 && (
        <div className="flex items-center space-x-2">
          <select
            value={selectedCalendarId}
            onChange={(e) => setSelectedCalendarId(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Calendars</option>
            {calendars.map(cal => (
              <option key={cal.id} value={cal.id}>
                {cal.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={widgetConfig.viewMode === 'week' ? 'primary' : 'ghost'}
          onClick={() => onConfigChange?.({ ...widgetConfig, viewMode: 'week' })}
          className="text-xs"
        >
          Week
        </Button>
        <Button
          size="sm"
          variant={widgetConfig.viewMode === 'month' ? 'primary' : 'ghost'}
          onClick={() => onConfigChange?.({ ...widgetConfig, viewMode: 'month' })}
          className="text-xs"
        >
          Month
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {events.slice(0, widgetConfig.maxEventsToShow).map((event) => (
          <div
            key={event.id}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: event.calendar?.color || '#3b82f6' 
                    }}
                  />
                  <h4 className="font-medium text-gray-900 truncate">
                    {event.title}
                  </h4>
                </div>
                
                {widgetConfig.showEventDetails && (
                  <div className="mt-1 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatEventTime(event)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No upcoming events</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        {widgetConfig.showQuickAdd && (
          <Button
            size="sm"
            variant="secondary"
            onClick={quickAddEvent}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={goToFullCalendar}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <span>View Full Calendar</span>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <h4 className="font-medium text-gray-900">Widget Settings</h4>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={widgetConfig.showQuickAdd}
                onChange={(e) => onConfigChange?.({ ...widgetConfig, showQuickAdd: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show Quick Add Button</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={widgetConfig.showEventDetails}
                onChange={(e) => onConfigChange?.({ ...widgetConfig, showEventDetails: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show Event Details</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={widgetConfig.showCalendarSelector}
                onChange={(e) => onConfigChange?.({ ...widgetConfig, showCalendarSelector: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show Calendar Selector</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Events to Show
            </label>
            <select
              value={widgetConfig.maxEventsToShow}
              onChange={(e) => onConfigChange?.({ ...widgetConfig, maxEventsToShow: parseInt(e.target.value) })}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={3}>3 events</option>
              <option value={5}>5 events</option>
              <option value={7}>7 events</option>
              <option value={10}>10 events</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
