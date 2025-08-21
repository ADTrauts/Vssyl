'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Badge, Spinner } from 'shared/components';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'accepted' | 'declined' | 'pending' | 'tentative';
  }>;
  type: 'meeting' | 'appointment' | 'reminder' | 'deadline';
  priority: 'low' | 'medium' | 'high';
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  reminders: Array<{
    type: 'email' | 'push' | 'sms';
    time: number; // minutes before event
  }>;
  color: string;
}

interface CalendarModuleProps {
  businessId: string;
  className?: string;
}

export default function CalendarModule({ businessId, className = '' }: CalendarModuleProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Q4 Planning Meeting',
        description: 'Quarterly planning session with the executive team',
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
        location: 'Conference Room A',
        attendees: [
          { id: '1', name: 'John Doe', email: 'john@company.com', status: 'accepted' },
          { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
          { id: '3', name: 'Mike Johnson', email: 'mike@company.com', status: 'pending' }
        ],
        type: 'meeting',
        priority: 'high',
        reminders: [
          { type: 'email', time: 1440 }, // 24 hours
          { type: 'push', time: 15 } // 15 minutes
        ],
        color: 'blue'
      },
      {
        id: '2',
        title: 'Client Presentation',
        description: 'Present quarterly results to key client',
        startTime: '2024-01-15T14:00:00Z',
        endTime: '2024-01-15T15:00:Z',
        location: 'Virtual Meeting',
        attendees: [
          { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
          { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', status: 'accepted' }
        ],
        type: 'meeting',
        priority: 'medium',
        reminders: [
          { type: 'push', time: 30 }
        ],
        color: 'green'
      },
      {
        id: '3',
        title: 'Project Deadline',
        description: 'Marketing campaign materials due',
        startTime: '2024-01-16T17:00:00Z',
        endTime: '2024-01-16T17:00:00Z',
        type: 'deadline',
        priority: 'high',
        attendees: [
          { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', status: 'accepted' }
        ],
        reminders: [
          { type: 'email', time: 2880 }, // 48 hours
          { type: 'push', time: 60 } // 1 hour
        ],
        color: 'red'
      },
      {
        id: '4',
        title: 'Team Standup',
        description: 'Daily team synchronization meeting',
        startTime: '2024-01-17T09:00:00Z',
        endTime: '2024-01-17T09:15:00Z',
        location: 'Team Room',
        type: 'meeting',
        priority: 'low',
        recurring: {
          frequency: 'daily',
          interval: 1
        },
        attendees: [
          { id: '1', name: 'John Doe', email: 'john@company.com', status: 'accepted' },
          { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
          { id: '3', name: 'Mike Johnson', email: 'mike@company.com', status: 'accepted' },
          { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', status: 'accepted' }
        ],
        reminders: [
          { type: 'push', time: 5 }
        ],
        color: 'purple'
      }
    ];

    setEvents(mockEvents);
    setLoading(false);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'appointment': return <Clock className="w-4 h-4" />;
      case 'reminder': return <Mail className="w-4 h-4" />;
      case 'deadline': return <CalendarIcon className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setViewMode('day');
    setCurrentDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCreateEvent = () => {
    // In a real app, this would open an event creation modal
    toast.success('Event creation initiated');
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-600">Manage your business schedule and events</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => setViewMode('month')}>
            Month
          </Button>
          <Button variant="secondary" onClick={() => setViewMode('week')}>
            Week
          </Button>
          <Button variant="secondary" onClick={() => setViewMode('day')}>
            Day
          </Button>
          <Button onClick={handleCreateEvent}>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Search and Navigation */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-lg border">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-white p-3 text-center">
                <span className="text-sm font-medium text-gray-900">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {getDaysInMonth(currentDate).map((date, index) => (
              <div
                key={index}
                className={`bg-white min-h-[120px] p-2 ${
                  date ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => date && handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="text-sm text-gray-900 mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getEventsForDate(date).slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded cursor-pointer truncate ${
                            event.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            event.color === 'green' ? 'bg-green-100 text-green-800' :
                            event.color === 'red' ? 'bg-red-100 text-red-800' :
                            event.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {getEventsForDate(date).length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{getEventsForDate(date).length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {filteredEvents
            .filter(event => new Date(event.startTime) > new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 5)
            .map(event => (
              <div
                key={event.id}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className={`w-3 h-3 rounded-full ${
                  event.color === 'blue' ? 'bg-blue-500' :
                  event.color === 'green' ? 'bg-green-500' :
                  event.color === 'red' ? 'bg-red-500' :
                  event.color === 'purple' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(event.startTime)}</span>
                    </span>
                    {event.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{event.attendees.length} attendees</span>
                    </span>
                  </div>
                </div>
                <Badge className={getPriorityColor(event.priority)}>
                  {event.priority}
                </Badge>
              </div>
            ))}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  selectedEvent.color === 'blue' ? 'bg-blue-500' :
                  selectedEvent.color === 'green' ? 'bg-green-500' :
                  selectedEvent.color === 'red' ? 'bg-red-500' :
                  selectedEvent.color === 'purple' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedEvent.description && (
                <p className="text-gray-700">{selectedEvent.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Time</h4>
                  <p className="text-sm text-gray-600">
                    {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </p>
                </div>
                {selectedEvent.location && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Attendees</h4>
                <div className="space-y-2">
                  {selectedEvent.attendees.map(attendee => (
                    <div key={attendee.id} className="flex items-center space-x-3">
                      <Avatar size={24} nameOrEmail={attendee.name} />
                      <span className="text-sm text-gray-900">{attendee.name}</span>
                      <Badge color={attendee.status === 'accepted' ? 'green' : 'gray'}>
                        {attendee.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(selectedEvent.priority)}>
                    {selectedEvent.priority} priority
                  </Badge>
                  <Badge color="gray">
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm">
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
