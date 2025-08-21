import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  MapPin, 
  Monitor, 
  Car, 
  Wifi, 
  Coffee, 
  Users, 
  Clock, 
  Calendar, 
  Search, 
  Filter,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ResourceBookingPanelProps {
  businessId?: string;
  eventId?: string;
  className?: string;
}

interface Resource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'vehicle' | 'space';
  category: string;
  capacity?: number;
  location: string;
  amenities: string[];
  hourlyRate?: number;
  description: string;
  availability: 'available' | 'busy' | 'maintenance' | 'offline';
  features: {
    wifi: boolean;
    projector: boolean;
    whiteboard: boolean;
    videoConf: boolean;
    catering: boolean;
    accessibility: boolean;
  };
  images: string[];
  policies: {
    advanceBookingDays: number;
    maxBookingHours: number;
    requiresApproval: boolean;
    cancellationPolicy: string;
  };
  bookings: ResourceBooking[];
  maintenanceSchedule?: Array<{
    date: Date;
    duration: number;
    description: string;
  }>;
}

interface ResourceBooking {
  id: string;
  resourceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  attendeeCount: number;
  setup: string;
  specialRequests?: string;
  cost?: number;
  approvedBy?: string;
  createdAt: Date;
  notes?: string;
}

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  conflictReason?: string;
}

const RESOURCE_TYPES = [
  { value: 'room', label: 'Meeting Rooms', icon: <Users className="w-4 h-4" /> },
  { value: 'equipment', label: 'Equipment', icon: <Monitor className="w-4 h-4" /> },
  { value: 'vehicle', label: 'Vehicles', icon: <Car className="w-4 h-4" /> },
  { value: 'space', label: 'Spaces', icon: <MapPin className="w-4 h-4" /> }
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: <Wifi className="w-4 h-4" /> },
  { id: 'projector', label: 'Projector', icon: <Monitor className="w-4 h-4" /> },
  { id: 'whiteboard', label: 'Whiteboard', icon: <Edit className="w-4 h-4" /> },
  { id: 'videoConf', label: 'Video Conference', icon: <Monitor className="w-4 h-4" /> },
  { id: 'catering', label: 'Catering', icon: <Coffee className="w-4 h-4" /> },
  { id: 'accessibility', label: 'Accessible', icon: <Users className="w-4 h-4" /> }
];

export const ResourceBookingPanel: React.FC<ResourceBookingPanelProps> = ({
  businessId,
  eventId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'manage'>('browse');
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingDuration, setBookingDuration] = useState(1);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    loadResourceData();
  }, [businessId]);

  const loadResourceData = async () => {
    try {
      setLoading(true);
      
      // Mock resources
      const mockResources: Resource[] = [
        {
          id: '1',
          name: 'Executive Boardroom',
          type: 'room',
          category: 'Conference Room',
          capacity: 16,
          location: 'Floor 10, East Wing',
          amenities: ['WiFi', 'Projector', 'Video Conference', 'Catering'],
          hourlyRate: 150,
          description: 'Premium boardroom with city views, perfect for executive meetings and presentations.',
          availability: 'available',
          features: {
            wifi: true,
            projector: true,
            whiteboard: true,
            videoConf: true,
            catering: true,
            accessibility: true
          },
          images: ['/resources/boardroom1.jpg', '/resources/boardroom2.jpg'],
          policies: {
            advanceBookingDays: 30,
            maxBookingHours: 8,
            requiresApproval: true,
            cancellationPolicy: '24 hours notice required'
          },
          bookings: []
        },
        {
          id: '2',
          name: 'Collaboration Hub A',
          type: 'room',
          category: 'Team Room',
          capacity: 8,
          location: 'Floor 5, Central',
          amenities: ['WiFi', 'Whiteboard', 'Monitor'],
          hourlyRate: 75,
          description: 'Modern collaboration space with flexible seating and digital whiteboards.',
          availability: 'available',
          features: {
            wifi: true,
            projector: false,
            whiteboard: true,
            videoConf: false,
            catering: false,
            accessibility: true
          },
          images: ['/resources/collab1.jpg'],
          policies: {
            advanceBookingDays: 14,
            maxBookingHours: 4,
            requiresApproval: false,
            cancellationPolicy: '2 hours notice required'
          },
          bookings: []
        },
        {
          id: '3',
          name: '4K Projector System',
          type: 'equipment',
          category: 'AV Equipment',
          location: 'AV Storage, Floor 3',
          amenities: ['4K Display', 'HDMI', 'Wireless Casting'],
          hourlyRate: 50,
          description: 'Professional-grade 4K projector with wireless presentation capabilities.',
          availability: 'available',
          features: {
            wifi: true,
            projector: true,
            whiteboard: false,
            videoConf: false,
            catering: false,
            accessibility: true
          },
          images: ['/resources/projector1.jpg'],
          policies: {
            advanceBookingDays: 7,
            maxBookingHours: 12,
            requiresApproval: false,
            cancellationPolicy: '4 hours notice required'
          },
          bookings: []
        },
        {
          id: '4',
          name: 'Company Vehicle - Tesla Model S',
          type: 'vehicle',
          category: 'Executive Transport',
          location: 'Parking Garage Level B1',
          amenities: ['Electric', 'GPS', 'Autopilot'],
          hourlyRate: 25,
          description: 'Executive vehicle for client meetings and business travel.',
          availability: 'available',
          features: {
            wifi: true,
            projector: false,
            whiteboard: false,
            videoConf: false,
            catering: false,
            accessibility: false
          },
          images: ['/resources/tesla1.jpg'],
          policies: {
            advanceBookingDays: 3,
            maxBookingHours: 24,
            requiresApproval: true,
            cancellationPolicy: '12 hours notice required'
          },
          bookings: []
        }
      ];

      // Mock bookings
      const mockBookings: ResourceBooking[] = [
        {
          id: '1',
          resourceId: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john.doe@company.com',
          title: 'Board Meeting Q4 Review',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          status: 'confirmed',
          attendeeCount: 12,
          setup: 'Boardroom style with presentation screen',
          cost: 300,
          approvedBy: 'admin@company.com',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          resourceId: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@company.com',
          title: 'Team Standup',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          status: 'confirmed',
          attendeeCount: 6,
          setup: 'Casual seating circle',
          cost: 75,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      ];

      setResources(mockResources);
      setBookings(mockBookings);
      
      // Record usage
      await recordUsage('calendar_resource_booking', 1);
      
    } catch (error) {
      console.error('Failed to load resource data:', error);
      toast.error('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookResource = async (resourceId: string) => {
    try {
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;

      const newBooking: ResourceBooking = {
        id: Date.now().toString(),
        resourceId,
        userId: 'current-user',
        userName: 'Current User',
        userEmail: 'user@company.com',
        title: `Resource Booking - ${resource.name}`,
        startTime: bookingDate,
        endTime: new Date(bookingDate.getTime() + bookingDuration * 60 * 60 * 1000),
        status: resource.policies.requiresApproval ? 'pending' : 'confirmed',
        attendeeCount,
        setup: 'Standard setup',
        cost: (resource.hourlyRate || 0) * bookingDuration,
        createdAt: new Date()
      };

      setBookings(prev => [...prev, newBooking]);
      setShowBookingModal(false);
      
      toast.success(`${resource.name} ${resource.policies.requiresApproval ? 'booking requested' : 'booked successfully'}`);
      
      // Record usage
      await recordUsage('calendar_resource_booking', 1);
      
    } catch (error) {
      console.error('Failed to book resource:', error);
      toast.error('Failed to book resource');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as const }
          : booking
      ));
      
      toast.success('Booking cancelled successfully');
      
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const getAvailabilityIndicator = (resource: Resource) => {
    switch (resource.availability) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'busy':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'maintenance':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredResources = resources.filter(resource => {
    if (searchQuery && !resource.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !resource.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedResourceType && resource.type !== selectedResourceType) {
      return false;
    }
    if (selectedAmenities.length > 0) {
      const hasAmenities = selectedAmenities.every(amenity => 
        resource.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
      );
      if (!hasAmenities) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="calendar_resource_booking" businessId={businessId}>
      <Card className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resource Booking</h2>
                <p className="text-gray-600">Book conference rooms, equipment, and shared resources</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => loadResourceData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {activeTab === 'manage' && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'browse', label: 'Browse Resources', icon: Search },
              { id: 'bookings', label: 'My Bookings', icon: Calendar },
              { id: 'manage', label: 'Manage Resources', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Browse Resources Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={selectedResourceType}
                  onChange={(e) => setSelectedResourceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {RESOURCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                
                <select
                  value={attendeeCount}
                  onChange={(e) => setAttendeeCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 person</option>
                  <option value={5}>2-5 people</option>
                  <option value={10}>6-10 people</option>
                  <option value={20}>11-20 people</option>
                  <option value={50}>20+ people</option>
                </select>
                
                <input
                  type="datetime-local"
                  value={bookingDate.toISOString().slice(0, 16)}
                  onChange={(e) => setBookingDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amenities Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Amenities:</span>
                {AMENITIES.map(amenity => (
                  <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAmenities(prev => [...prev, amenity.id]);
                        } else {
                          setSelectedAmenities(prev => prev.filter(a => a !== amenity.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      {amenity.icon}
                      {amenity.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                  <Card key={resource.id} className="p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {RESOURCE_TYPES.find(t => t.value === resource.type)?.icon}
                        <h3 className="font-medium text-gray-900">{resource.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {getAvailabilityIndicator(resource)}
                        <span className="text-xs text-gray-500 capitalize">
                          {resource.availability}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{resource.location}</span>
                      </div>
                      {resource.capacity && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Capacity: {resource.capacity}</span>
                        </div>
                      )}
                      {resource.hourlyRate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">${resource.hourlyRate}/hour</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {amenity}
                        </Badge>
                      ))}
                      {resource.amenities.length > 3 && (
                        <Badge className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{resource.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedResource(resource);
                          setShowBookingModal(true);
                        }}
                        disabled={resource.availability !== 'available'}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Book
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* My Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.map(booking => {
                const resource = resources.find(r => r.id === booking.resourceId);
                return (
                  <Card key={booking.id} className="p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {resource && RESOURCE_TYPES.find(t => t.value === resource.type)?.icon}
                        <div>
                          <h3 className="font-medium text-gray-900">{booking.title}</h3>
                          <p className="text-sm text-gray-600">{resource?.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`px-2 py-1 text-xs border rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.toUpperCase()}
                        </Badge>
                        {booking.status === 'confirmed' || booking.status === 'pending' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Date & Time</div>
                        <div className="text-gray-900">
                          {booking.startTime.toLocaleDateString()}<br />
                          {booking.startTime.toLocaleTimeString()} - {booking.endTime.toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Attendees</div>
                        <div className="text-gray-900">{booking.attendeeCount} people</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Setup</div>
                        <div className="text-gray-900">{booking.setup}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Cost</div>
                        <div className="text-gray-900">${booking.cost || 0}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Manage Resources Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Management</h3>
                <p className="text-gray-600 mb-4">Manage resource inventory, policies, and availability</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Resource
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </FeatureGate>
  );
};

export default ResourceBookingPanel;
