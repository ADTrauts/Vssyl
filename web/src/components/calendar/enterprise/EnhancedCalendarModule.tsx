import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Badge, Spinner, Input } from 'shared/components';
import { useFeatureGating, useModuleFeatures } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
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
  Mail,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import enterprise components
import ResourceBookingPanel from './ResourceBookingPanel';
import ApprovalWorkflowPanel from './ApprovalWorkflowPanel';
import CalendarAnalyticsPanel from './CalendarAnalyticsPanel';

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
  // Enterprise fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  resourceBookings?: string[];
  complianceLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  recordingEnabled?: boolean;
  encryptionEnabled?: boolean;
  costCenter?: string;
  estimatedCost?: number;
}

interface EnhancedCalendarModuleProps {
  businessId: string;
  className?: string;
}

export default function EnhancedCalendarModule({ businessId, className = '' }: EnhancedCalendarModuleProps) {
  const { recordUsage } = useFeatureGating(businessId);
  const { moduleAccess, hasBusiness: hasEnterprise } = useModuleFeatures('calendar', businessId);
  
  // Core state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enterprise features state
  const [showEnterprisePanel, setShowEnterprisePanel] = useState(false);
  const [activeEnterpriseTab, setActiveEnterpriseTab] = useState<'resources' | 'approvals' | 'analytics'>('resources');
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [resourceAlerts, setResourceAlerts] = useState(0);
  const [complianceAlerts, setComplianceAlerts] = useState(0);

  // Load enhanced calendar data
  useEffect(() => {
    loadEnhancedCalendarData();
  }, [businessId]);

  const loadEnhancedCalendarData = async () => {
    try {
      setLoading(true);
      
      // Enhanced mock data with enterprise features
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Executive Board Meeting',
          description: 'Quarterly board meeting with external auditors',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T12:00:00Z',
          location: 'Executive Boardroom',
          attendees: [
            { id: '1', name: 'John Doe', email: 'john@company.com', status: 'accepted' },
            { id: '2', name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
            { id: '3', name: 'External Auditor', email: 'auditor@external.com', status: 'pending' }
          ],
          type: 'meeting',
          priority: 'high',
          reminders: [
            { type: 'email', time: 1440 }, // 24 hours
            { type: 'push', time: 15 } // 15 minutes
          ],
          color: 'red',
          // Enterprise fields
          approvalStatus: 'approved',
          resourceBookings: ['exec-boardroom', 'av-equipment', 'catering'],
          complianceLevel: 'restricted',
          recordingEnabled: true,
          encryptionEnabled: true,
          costCenter: 'EXEC-001',
          estimatedCost: 2500
        },
        {
          id: '2',
          title: 'Team Standup',
          description: 'Daily team synchronization',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:30:00Z',
          location: 'Collaboration Hub A',
          attendees: [
            { id: '4', name: 'Mike Johnson', email: 'mike@company.com', status: 'accepted' },
            { id: '5', name: 'Sarah Wilson', email: 'sarah@company.com', status: 'accepted' },
            { id: '6', name: 'David Brown', email: 'david@company.com', status: 'accepted' }
          ],
          type: 'meeting',
          priority: 'medium',
          reminders: [
            { type: 'push', time: 5 }
          ],
          color: 'blue',
          // Enterprise fields
          approvalStatus: 'approved',
          resourceBookings: ['collab-hub-a'],
          complianceLevel: 'internal',
          recordingEnabled: false,
          encryptionEnabled: false,
          costCenter: 'ENG-001',
          estimatedCost: 150
        },
        {
          id: '3',
          title: 'Client Presentation - Pending Approval',
          description: 'Product demonstration for potential enterprise client',
          startTime: '2024-01-16T14:00:00Z',
          endTime: '2024-01-16T16:00:00Z',
          location: 'Demo Room',
          attendees: [
            { id: '7', name: 'Sales Rep', email: 'sales@company.com', status: 'accepted' },
            { id: '8', name: 'Client Contact', email: 'contact@client.com', status: 'pending' }
          ],
          type: 'meeting',
          priority: 'high',
          reminders: [
            { type: 'email', time: 120 }
          ],
          color: 'orange',
          // Enterprise fields
          approvalStatus: 'pending',
          resourceBookings: ['demo-room', 'presentation-equipment'],
          complianceLevel: 'confidential',
          recordingEnabled: true,
          encryptionEnabled: true,
          costCenter: 'SALES-001',
          estimatedCost: 750
        }
      ];

      setEvents(mockEvents);
      
      // Mock enterprise stats
      setPendingApprovals(2);
      setResourceAlerts(1);
      setComplianceAlerts(0);
      
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // Show enhanced event creation modal with enterprise features
      setShowEventModal(true);
      
      // Record usage for enterprise features
      if (hasEnterprise) {
        await recordUsage('calendar_advanced_scheduling', 1);
      }
      
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, approvalStatus: 'approved' as const }
          : event
      ));
      
      setPendingApprovals(prev => Math.max(0, prev - 1));
      toast.success('Event approved successfully');
      
      // Record usage
      await recordUsage('calendar_approval_workflows', 1);
      
    } catch (error) {
      console.error('Failed to approve event:', error);
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, approvalStatus: 'rejected' as const }
          : event
      ));
      
      setPendingApprovals(prev => Math.max(0, prev - 1));
      toast.success('Event rejected');
      
    } catch (error) {
      console.error('Failed to reject event:', error);
      toast.error('Failed to reject event');
    }
  };

  const getEventStatusIcon = (event: CalendarEvent) => {
    if (event.approvalStatus === 'pending') return <Clock className="w-4 h-4 text-yellow-600" />;
    if (event.approvalStatus === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (event.approvalStatus === 'rejected') return <XCircle className="w-4 h-4 text-red-600" />;
    if (event.encryptionEnabled) return <Shield className="w-4 h-4 text-blue-600" />;
    return null;
  };

  const getComplianceBadge = (level?: string) => {
    if (!level) return null;
    
    const configs = {
      public: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🌍' },
      internal: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🏢' },
      confidential: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🔒' },
      restricted: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🚫' }
    };
    
    const config = configs[level as keyof typeof configs];
    if (!config) return null;
    
    return (
      <Badge className={`px-2 py-1 text-xs border rounded-full ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDate; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                {hasEnterprise && (
                  <Badge className="px-2 py-1 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-full">
                    Enterprise
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">
                {hasEnterprise ? 
                  'Advanced scheduling with enterprise features' : 
                  'Manage your schedule and appointments'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Enterprise Alerts */}
            {hasEnterprise && (pendingApprovals > 0 || resourceAlerts > 0 || complianceAlerts > 0) && (
              <Button
                variant="ghost"
                onClick={() => setShowEnterprisePanel(true)}
                className="relative"
              >
                <Settings className="w-4 h-4" />
                {(pendingApprovals + resourceAlerts + complianceAlerts) > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                    {pendingApprovals + resourceAlerts + complianceAlerts}
                  </Badge>
                )}
              </Button>
            )}
            
            {/* Enterprise Quick Actions */}
            {hasEnterprise && (
              <div className="flex gap-2">
                <FeatureGate feature="calendar_analytics" businessId={businessId}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActiveEnterpriseTab('analytics');
                      setShowEnterprisePanel(true);
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                </FeatureGate>
                
                <FeatureGate feature="calendar_resource_booking" businessId={businessId}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActiveEnterpriseTab('resources');
                      setShowEnterprisePanel(true);
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Resources
                  </Button>
                </FeatureGate>
              </div>
            )}
            
            <Button onClick={handleCreateEvent}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
        
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['month', 'week', 'day'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode as any)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Calendar Content */}
        <div className="flex-1 p-6">
          {viewMode === 'month' && (
            <div className="h-full">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 h-full">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-700 border-b">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {getCalendarDays().map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const isToday = day && 
                    new Date().toDateString() === 
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-r border-b ${
                        day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            isToday ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {day}
                          </div>
                          
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map(event => (
                              <div
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`text-xs p-1 rounded cursor-pointer truncate ${
                                  event.color === 'red' ? 'bg-red-100 text-red-800' :
                                  event.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  event.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {getEventStatusIcon(event)}
                                  <span className="truncate">{event.title}</span>
                                </div>
                                {hasEnterprise && event.estimatedCost && (
                                  <div className="text-xs opacity-75">${event.estimatedCost}</div>
                                )}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Enterprise Panel */}
        {showEnterprisePanel && hasEnterprise && (
          <div className="w-1/2 border-l border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Enterprise Features</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEnterprisePanel(false)}
                >
                  ×
                </Button>
              </div>
              
              {/* Enterprise Tabs */}
              <div className="flex space-x-1 mt-4">
                {[
                  { id: 'resources', label: 'Resources', icon: MapPin, alerts: resourceAlerts },
                  { id: 'approvals', label: 'Approvals', icon: CheckCircle, alerts: pendingApprovals },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3, alerts: 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEnterpriseTab(tab.id as any)}
                    className={`flex items-center px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                      activeEnterpriseTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-1" />
                    {tab.label}
                    {tab.alerts > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                        {tab.alerts}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-full overflow-y-auto">
              {activeEnterpriseTab === 'resources' && (
                <ResourceBookingPanel
                  businessId={businessId}
                  className="border-0"
                />
              )}
              {activeEnterpriseTab === 'approvals' && (
                <ApprovalWorkflowPanel
                  businessId={businessId}
                  className="border-0"
                />
              )}
              {activeEnterpriseTab === 'analytics' && (
                <CalendarAnalyticsPanel
                  businessId={businessId}
                  className="border-0"
                />
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
                  {getComplianceBadge(selectedEvent.complianceLevel)}
                  {selectedEvent.approvalStatus === 'pending' && (
                    <Badge className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
                      Pending Approval
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-gray-500 text-sm">Time:</span>
                  <div className="font-medium">{formatEventTime(selectedEvent.startTime, selectedEvent.endTime)}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Location:</span>
                  <div className="font-medium">{selectedEvent.location}</div>
                </div>
                {hasEnterprise && selectedEvent.estimatedCost && (
                  <>
                    <div>
                      <span className="text-gray-500 text-sm">Estimated Cost:</span>
                      <div className="font-medium">${selectedEvent.estimatedCost}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Cost Center:</span>
                      <div className="font-medium">{selectedEvent.costCenter}</div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mb-4">
                <span className="text-gray-500 text-sm">Description:</span>
                <p className="text-gray-900">{selectedEvent.description}</p>
              </div>
              
              <div className="mb-4">
                <span className="text-gray-500 text-sm">Attendees:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEvent.attendees.map(attendee => (
                    <div key={attendee.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Avatar src={attendee.avatar} alt={attendee.name} size={24} />
                      <span className="text-sm">{attendee.name}</span>
                      <Badge className={`text-xs px-2 py-1 rounded ${
                        attendee.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        attendee.status === 'declined' ? 'bg-red-100 text-red-800' :
                        attendee.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {attendee.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Enterprise Features */}
              {hasEnterprise && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Enterprise Features</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Encryption: {selectedEvent.encryptionEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Recording: {selectedEvent.recordingEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    {selectedEvent.resourceBookings && selectedEvent.resourceBookings.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-purple-700">Resources: {selectedEvent.resourceBookings.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                {selectedEvent.approvalStatus === 'pending' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => handleRejectEvent(selectedEvent.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button onClick={() => handleApproveEvent(selectedEvent.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
