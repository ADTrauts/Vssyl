import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Eye,
  MapPin,
  DollarSign,
  Zap,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CalendarAnalyticsPanelProps {
  businessId?: string;
  className?: string;
}

interface MeetingMetrics {
  totalMeetings: number;
  averageDuration: number;
  totalHours: number;
  attendeeHours: number;
  meetingCost: number;
  productivityScore: number;
  trends: {
    meetingsChange: number;
    durationChange: number;
    costChange: number;
    productivityChange: number;
  };
}

interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  bookingRate: number;
  totalBookings: number;
  totalHours: number;
  revenue: number;
  averageRating: number;
  maintenanceHours: number;
  utilizationTrend: number;
}

interface MeetingEffectiveness {
  meetingId: string;
  title: string;
  date: Date;
  duration: number;
  attendeeCount: number;
  cost: number;
  effectivenessScore: number;
  followUpActions: number;
  completedActions: number;
  attendeeRating: number;
  outcomes: string[];
  roomUtilization: number;
}

interface TimeSlotAnalysis {
  hour: number;
  dayOfWeek: string;
  meetingCount: number;
  averageAttendance: number;
  effectivenessScore: number;
  conflictRate: number;
  bookingLead: number; // days in advance
}

interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  meetingCount: number;
  totalHours: number;
  averageAttendees: number;
  costPerMeeting: number;
  productivityIndex: number;
  collaborationScore: number;
  externalMeetingRatio: number;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
];

const METRIC_CARDS = [
  {
    id: 'meetings',
    title: 'Total Meetings',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 'hours',
    title: 'Meeting Hours',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-green-50 text-green-600'
  },
  {
    id: 'cost',
    title: 'Meeting Cost',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'bg-orange-50 text-orange-600'
  },
  {
    id: 'productivity',
    title: 'Productivity Score',
    icon: <Target className="w-5 h-5" />,
    color: 'bg-purple-50 text-purple-600'
  }
];

export const CalendarAnalyticsPanel: React.FC<CalendarAnalyticsPanelProps> = ({
  businessId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'effectiveness' | 'insights'>('overview');
  const [meetingMetrics, setMeetingMetrics] = useState<MeetingMetrics | null>(null);
  const [resourceUtilization, setResourceUtilization] = useState<ResourceUtilization[]>([]);
  const [meetingEffectiveness, setMeetingEffectiveness] = useState<MeetingEffectiveness[]>([]);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [timeSlotAnalysis, setTimeSlotAnalysis] = useState<TimeSlotAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    loadAnalyticsData();
  }, [businessId, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock meeting metrics
      const mockMetrics: MeetingMetrics = {
        totalMeetings: 342,
        averageDuration: 47, // minutes
        totalHours: 268,
        attendeeHours: 1540,
        meetingCost: 15400,
        productivityScore: 78,
        trends: {
          meetingsChange: 12.5,
          durationChange: -8.2,
          costChange: 3.1,
          productivityChange: 15.7
        }
      };

      // Mock resource utilization
      const mockResourceUtilization: ResourceUtilization[] = [
        {
          resourceId: '1',
          resourceName: 'Executive Boardroom',
          resourceType: 'Conference Room',
          bookingRate: 78.5,
          totalBookings: 156,
          totalHours: 312,
          revenue: 46800,
          averageRating: 4.7,
          maintenanceHours: 8,
          utilizationTrend: 12.3
        },
        {
          resourceId: '2',
          resourceName: 'Collaboration Hub A',
          resourceType: 'Team Room',
          bookingRate: 65.2,
          totalBookings: 234,
          totalHours: 187,
          revenue: 14025,
          averageRating: 4.4,
          maintenanceHours: 4,
          utilizationTrend: -5.7
        },
        {
          resourceId: '3',
          resourceName: '4K Projector System',
          resourceType: 'AV Equipment',
          bookingRate: 45.8,
          totalBookings: 87,
          totalHours: 174,
          revenue: 8700,
          averageRating: 4.8,
          maintenanceHours: 12,
          utilizationTrend: 28.4
        }
      ];

      // Mock meeting effectiveness
      const mockEffectiveness: MeetingEffectiveness[] = [
        {
          meetingId: '1',
          title: 'Q4 Strategic Planning',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          duration: 120,
          attendeeCount: 8,
          cost: 1200,
          effectivenessScore: 92,
          followUpActions: 12,
          completedActions: 11,
          attendeeRating: 4.6,
          outcomes: ['Strategy approved', 'Budget allocated', 'Timeline established'],
          roomUtilization: 85
        },
        {
          meetingId: '2',
          title: 'Weekly Team Standup',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          duration: 30,
          attendeeCount: 6,
          cost: 150,
          effectivenessScore: 67,
          followUpActions: 3,
          completedActions: 2,
          attendeeRating: 3.8,
          outcomes: ['Tasks assigned', 'Blockers identified'],
          roomUtilization: 45
        },
        {
          meetingId: '3',
          title: 'Client Presentation',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          duration: 90,
          attendeeCount: 5,
          cost: 675,
          effectivenessScore: 88,
          followUpActions: 8,
          completedActions: 7,
          attendeeRating: 4.4,
          outcomes: ['Contract signed', 'Follow-up scheduled', 'Demo approved'],
          roomUtilization: 75
        }
      ];

      // Mock department metrics
      const mockDepartmentMetrics: DepartmentMetrics[] = [
        {
          departmentId: 'sales',
          departmentName: 'Sales',
          meetingCount: 89,
          totalHours: 156,
          averageAttendees: 4.2,
          costPerMeeting: 125,
          productivityIndex: 85,
          collaborationScore: 72,
          externalMeetingRatio: 0.65
        },
        {
          departmentId: 'engineering',
          departmentName: 'Engineering',
          meetingCount: 124,
          totalHours: 98,
          averageAttendees: 6.8,
          costPerMeeting: 95,
          productivityIndex: 78,
          collaborationScore: 88,
          externalMeetingRatio: 0.12
        },
        {
          departmentId: 'marketing',
          departmentName: 'Marketing',
          meetingCount: 67,
          totalHours: 112,
          averageAttendees: 5.4,
          costPerMeeting: 140,
          productivityIndex: 82,
          collaborationScore: 79,
          externalMeetingRatio: 0.34
        }
      ];

      // Mock time slot analysis
      const mockTimeSlotAnalysis: TimeSlotAnalysis[] = [
        { hour: 9, dayOfWeek: 'Monday', meetingCount: 45, averageAttendance: 85, effectivenessScore: 78, conflictRate: 12, bookingLead: 3.5 },
        { hour: 10, dayOfWeek: 'Monday', meetingCount: 62, averageAttendance: 92, effectivenessScore: 82, conflictRate: 8, bookingLead: 4.2 },
        { hour: 14, dayOfWeek: 'Tuesday', meetingCount: 38, averageAttendance: 76, effectivenessScore: 71, conflictRate: 18, bookingLead: 2.1 },
        { hour: 15, dayOfWeek: 'Wednesday', meetingCount: 52, averageAttendance: 88, effectivenessScore: 85, conflictRate: 6, bookingLead: 5.8 }
      ];

      setMeetingMetrics(mockMetrics);
      setResourceUtilization(mockResourceUtilization);
      setMeetingEffectiveness(mockEffectiveness);
      setDepartmentMetrics(mockDepartmentMetrics);
      setTimeSlotAnalysis(mockTimeSlotAnalysis);
      
      // Record usage
      await recordUsage('calendar_analytics', 1);
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      // Generate comprehensive analytics report
      const reportData = {
        period: selectedPeriod,
        metrics: meetingMetrics,
        resources: resourceUtilization,
        effectiveness: meetingEffectiveness,
        departments: departmentMetrics,
        timeSlots: timeSlotAnalysis,
        generatedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Analytics report exported successfully');
      
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="calendar_analytics" businessId={businessId}>
      <Card className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Calendar Analytics</h2>
                <p className="text-gray-600">Meeting effectiveness and resource utilization insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PERIOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <Button
                variant="secondary"
                onClick={() => loadAnalyticsData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'resources', label: 'Resource Usage', icon: MapPin },
              { id: 'effectiveness', label: 'Meeting Effectiveness', icon: Target },
              { id: 'insights', label: 'Insights', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
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
          {/* Overview Tab */}
          {activeTab === 'overview' && meetingMetrics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {METRIC_CARDS.map(card => {
                  let value, trend, unit = '';
                  
                  switch (card.id) {
                    case 'meetings':
                      value = meetingMetrics.totalMeetings;
                      trend = meetingMetrics.trends.meetingsChange;
                      break;
                    case 'hours':
                      value = meetingMetrics.totalHours;
                      trend = meetingMetrics.trends.durationChange;
                      unit = 'hrs';
                      break;
                    case 'cost':
                      value = `$${meetingMetrics.meetingCost.toLocaleString()}`;
                      trend = meetingMetrics.trends.costChange;
                      break;
                    case 'productivity':
                      value = meetingMetrics.productivityScore;
                      trend = meetingMetrics.trends.productivityChange;
                      unit = '/100';
                      break;
                    default:
                      value = 0;
                      trend = 0;
                  }
                  
                  return (
                    <Card key={card.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${card.color}`}>
                          {card.icon}
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(trend)}
                          <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{value}<span className="text-sm text-gray-500">{unit}</span></div>
                      <div className="text-sm text-gray-600">{card.title}</div>
                    </Card>
                  );
                })}
              </div>

              {/* Department Breakdown */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Department Metrics</h3>
                <div className="space-y-3">
                  {departmentMetrics.map(dept => (
                    <div key={dept.departmentId} className="grid grid-cols-6 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{dept.departmentName}</div>
                      <div className="text-sm">
                        <div className="text-gray-500">Meetings</div>
                        <div className="font-medium">{dept.meetingCount}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">Hours</div>
                        <div className="font-medium">{dept.totalHours}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">Avg Cost</div>
                        <div className="font-medium">${dept.costPerMeeting}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">Productivity</div>
                        <div className={`font-medium ${getEffectivenessColor(dept.productivityIndex).split(' ')[0]}`}>
                          {dept.productivityIndex}/100
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">External %</div>
                        <div className="font-medium">{Math.round(dept.externalMeetingRatio * 100)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Cost Efficiency</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost per hour:</span>
                      <span className="font-medium">${(meetingMetrics.meetingCost / meetingMetrics.totalHours).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost per attendee hour:</span>
                      <span className="font-medium">${(meetingMetrics.meetingCost / meetingMetrics.attendeeHours).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average meeting cost:</span>
                      <span className="font-medium">${(meetingMetrics.meetingCost / meetingMetrics.totalMeetings).toFixed(0)}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Time Efficiency</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average duration:</span>
                      <span className="font-medium">{meetingMetrics.averageDuration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total person-hours:</span>
                      <span className="font-medium">{meetingMetrics.attendeeHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meetings per day:</span>
                      <span className="font-medium">{(meetingMetrics.totalMeetings / 30).toFixed(1)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Resource Usage Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              {resourceUtilization.map(resource => (
                <Card key={resource.resourceId} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{resource.resourceName}</h3>
                      <p className="text-sm text-gray-600">{resource.resourceType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`px-2 py-1 text-xs rounded-full ${
                        resource.utilizationTrend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {resource.utilizationTrend > 0 ? '+' : ''}{resource.utilizationTrend.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <div className="text-gray-500 text-sm">Utilization</div>
                      <div className={`font-medium text-lg ${getUtilizationColor(resource.bookingRate)}`}>
                        {resource.bookingRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Bookings</div>
                      <div className="font-medium text-lg">{resource.totalBookings}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Hours</div>
                      <div className="font-medium text-lg">{resource.totalHours}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Revenue</div>
                      <div className="font-medium text-lg">${resource.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Rating</div>
                      <div className="font-medium text-lg">{resource.averageRating.toFixed(1)}/5</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Maintenance</div>
                      <div className="font-medium text-lg">{resource.maintenanceHours}h</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Meeting Effectiveness Tab */}
          {activeTab === 'effectiveness' && (
            <div className="space-y-4">
              {meetingEffectiveness.map(meeting => (
                <Card key={meeting.meetingId} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <p className="text-sm text-gray-600">
                        {meeting.date.toLocaleDateString()} • {meeting.duration} min • {meeting.attendeeCount} attendees
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`px-3 py-1 text-sm rounded-full ${getEffectivenessColor(meeting.effectivenessScore)}`}>
                        {meeting.effectivenessScore}/100
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-gray-500 text-sm">Cost</div>
                      <div className="font-medium">${meeting.cost}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Actions</div>
                      <div className="font-medium">{meeting.completedActions}/{meeting.followUpActions}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Rating</div>
                      <div className="font-medium">{meeting.attendeeRating.toFixed(1)}/5</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Room Usage</div>
                      <div className="font-medium">{meeting.roomUtilization}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Outcomes</div>
                      <div className="font-medium">{meeting.outcomes.length}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-500 text-sm mb-2">Key Outcomes:</div>
                    <div className="flex flex-wrap gap-2">
                      {meeting.outcomes.map((outcome, index) => (
                        <Badge key={index} className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {outcome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Optimal Meeting Times</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timeSlotAnalysis.map((slot, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{slot.dayOfWeek} at {slot.hour}:00</span>
                        <Badge className={`px-2 py-1 text-xs rounded-full ${getEffectivenessColor(slot.effectivenessScore)}`}>
                          {slot.effectivenessScore}/100
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Meetings: </span>
                          <span className="font-medium">{slot.meetingCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Attendance: </span>
                          <span className="font-medium">{slot.averageAttendance}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Conflicts: </span>
                          <span className="font-medium">{slot.conflictRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendations */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Optimize Meeting Duration</div>
                      <div className="text-sm text-blue-700">
                        Reduce average meeting time by 15% to save ${((meetingMetrics?.meetingCost || 0) * 0.15).toFixed(0)} per month
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">Improve Resource Utilization</div>
                      <div className="text-sm text-green-700">
                        Collaboration Hub A is underutilized. Consider promotion or space reconfiguration.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-orange-900">Schedule Optimization</div>
                      <div className="text-sm text-orange-700">
                        Tuesday 2 PM has high conflict rates. Consider alternative time slots for better effectiveness.
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </FeatureGate>
  );
};

export default CalendarAnalyticsPanel;
