'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Alert, Badge } from 'shared/components';
import { 
  Calendar, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Video,
  Bell,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react';

interface BusinessEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
  }>;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  type: 'meeting' | 'event' | 'deadline' | 'reminder';
  isAllDay: boolean;
  reminders: Array<{
    type: 'email' | 'popup' | 'sms';
    minutes: number;
  }>;
}

interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  label: string;
}

export default function WorkCalendarPage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params.id as string;

  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>({ type: 'month', label: 'Month' });
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null);

  const views: CalendarView[] = [
    { type: 'month', label: 'Month' },
    { type: 'week', label: 'Week' },
    { type: 'day', label: 'Day' },
    { type: 'agenda', label: 'Agenda' }
  ];

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessEvents();
    }
  }, [businessId, session?.accessToken, currentDate]);

  const loadBusinessEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to get business events
      // const response = await businessAPI.getBusinessEvents(businessId, currentDate);
      
      // Mock data for now
      const mockEvents: BusinessEvent[] = [
        {
          id: '1',
          title: 'Team Standup',
          description: 'Daily team standup meeting',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T09:30:00Z',
          location: 'Conference Room A',
          attendees: [
            { id: '1', name: 'John Doe', email: 'john@company.com', status: 'accepted' },
            { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
            { id: '3', name: 'Mike Johnson', email: 'mike@company.com', status: 'pending' }
          ],
          organizer: {
            id: '1',
            name: 'John Doe',
            email: 'john@company.com'
          },
          type: 'meeting',
          isAllDay: false,
          reminders: [
            { type: 'popup', minutes: 15 },
            { type: 'email', minutes: 60 }
          ]
        },
        {
          id: '2',
          title: 'Project Review',
          description: 'Q4 project review and planning',
          startTime: '2024-01-15T14:00:00Z',
          endTime: '2024-01-15T16:00:00Z',
          meetingUrl: 'https://meet.company.com/project-review',
          attendees: [
            { id: '1', name: 'John Doe', email: 'john@company.com', status: 'accepted' },
            { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
            { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', status: 'tentative' }
          ],
          organizer: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@company.com'
          },
          type: 'meeting',
          isAllDay: false,
          reminders: [
            { type: 'popup', minutes: 30 },
            { type: 'email', minutes: 120 }
          ]
        },
        {
          id: '3',
          title: 'Company Holiday',
          description: 'Martin Luther King Jr. Day',
          startTime: '2024-01-15T00:00:00Z',
          endTime: '2024-01-15T23:59:59Z',
          attendees: [],
          organizer: {
            id: '5',
            name: 'HR Department',
            email: 'hr@company.com'
          },
          type: 'event',
          isAllDay: true,
          reminders: []
        }
      ];

      setEvents(mockEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (view.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendeeStatusColor = (status: string): string => {
    switch (status) {
      case 'accepted': return 'text-green-600';
      case 'declined': return 'text-red-600';
      case 'tentative': return 'text-yellow-600';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = events
    .filter(event => new Date(event.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Calendar">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Calendar</h1>
            <p className="text-gray-600">Business events and meetings</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Navigation */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formatDate(currentDate)}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigateDate('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigateDate('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {views.map((viewOption) => (
                    <Button
                      key={viewOption.type}
                      variant={view.type === viewOption.type ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setView(viewOption)}
                    >
                      {viewOption.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Calendar Content */}
              <div className="min-h-[400px]">
                {view.type === 'month' && (
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = new Date(currentDate);
                      date.setDate(1);
                      date.setDate(date.getDate() - date.getDay() + i);
                      
                      const dayEvents = events.filter(event => {
                        const eventDate = new Date(event.startTime);
                        return eventDate.toDateString() === date.toDateString();
                      });

                      const isToday = date.toDateString() === new Date().toDateString();
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                      return (
                        <div
                          key={i}
                          className={`min-h-[80px] p-2 border border-gray-200 ${
                            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                          } ${isToday ? 'bg-blue-50' : ''}`}
                        >
                          <div className={`text-sm font-medium ${
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          } ${isToday ? 'text-blue-600' : ''}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1 mt-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded truncate cursor-pointer hover:bg-gray-100"
                                onClick={() => setSelectedEvent(event)}
                              >
                                <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                                  {event.title}
                                </Badge>
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {view.type === 'agenda' && (
                  <div className="space-y-4">
                    {events
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((event) => (
                        <div
                          key={event.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={getEventTypeColor(event.type)}>
                                  {event.type}
                                </Badge>
                                <h3 className="font-medium text-gray-900">{event.title}</h3>
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {event.isAllDay 
                                      ? 'All day'
                                      : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                                    }
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.meetingUrl && (
                                  <div className="flex items-center space-x-1">
                                    <Video className="w-4 h-4" />
                                    <span>Online meeting</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Events */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Events</h3>
              <div className="space-y-3">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-500">
                        {event.isAllDay 
                          ? 'All day'
                          : formatTime(event.startTime)
                        }
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No events today</p>
                )}
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Upcoming</h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{event.title}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(event.startTime).toLocaleDateString()} at {formatTime(event.startTime)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  ×
                </Button>
              </div>
              
              {selectedEvent.description && (
                <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {selectedEvent.isAllDay 
                      ? 'All day'
                      : `${formatTime(selectedEvent.startTime)} - ${formatTime(selectedEvent.endTime)}`
                    }
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.meetingUrl && (
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-gray-500" />
                    <a href={selectedEvent.meetingUrl} className="text-sm text-blue-600 hover:underline">
                      Join meeting
                    </a>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Attendees</h4>
                <div className="space-y-2">
                  {selectedEvent.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{attendee.name}</span>
                      </div>
                      <span className={`text-xs ${getAttendeeStatusColor(attendee.status)}`}>
                        {attendee.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
                <Button variant="secondary" size="sm">
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
