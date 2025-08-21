import React, { useState } from 'react';
import { Card, Button } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { FeatureBadge } from '../../EnterpriseUpgradePrompt';
import { 
  Calendar, 
  MapPin, 
  CheckCircle, 
  BarChart3, 
  Zap, 
  ArrowRight,
  Lock,
  Users,
  Clock,
  Target,
  Settings,
  Shield,
  TrendingUp,
  FileText,
  Video,
  RefreshCw
} from 'lucide-react';

interface CalendarEnterpriseShowcaseProps {
  businessId?: string;
  onUpgrade?: () => void;
}

const ENTERPRISE_FEATURES = [
  {
    id: 'calendar_resource_booking',
    name: 'Smart Resource Booking',
    description: 'Intelligent booking system for rooms, equipment, and shared resources',
    icon: <MapPin className="w-6 h-6" />,
    color: 'text-blue-600 bg-blue-50',
    benefits: [
      'Conference room and equipment booking',
      'Real-time availability and conflict detection',
      'Resource utilization analytics',
      'Automated booking approvals',
      'Cost tracking and budget management'
    ]
  },
  {
    id: 'calendar_approval_workflows',
    name: 'Meeting Approval Workflows',
    description: 'Automated approval processes for meetings and events',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'text-green-600 bg-green-50',
    benefits: [
      'Multi-step approval workflows',
      'Executive and board meeting approval',
      'External attendee approval gates',
      'Budget and compliance checks',
      'Automated escalation rules'
    ]
  },
  {
    id: 'calendar_analytics',
    name: 'Meeting Analytics & Insights',
    description: 'Comprehensive analytics for meeting effectiveness and productivity',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-purple-600 bg-purple-50',
    benefits: [
      'Meeting effectiveness scoring',
      'Resource utilization metrics',
      'Cost per meeting analysis',
      'Productivity trend tracking',
      'Department performance insights'
    ]
  },
  {
    id: 'calendar_advanced_scheduling',
    name: 'AI-Powered Scheduling',
    description: 'Intelligent scheduling with conflict resolution and optimization',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-yellow-600 bg-yellow-50',
    benefits: [
      'AI-powered time slot suggestions',
      'Automatic conflict resolution',
      'Attendee availability optimization',
      'Travel time calculation',
      'Meeting preparation reminders'
    ]
  },
  {
    id: 'calendar_compliance_controls',
    name: 'Compliance & Security',
    description: 'Enterprise-grade security and compliance features',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-red-600 bg-red-50',
    benefits: [
      'Meeting recording and retention policies',
      'Data classification and protection',
      'Audit trails and compliance reporting',
      'External attendee controls',
      'Encrypted meeting content'
    ]
  },
  {
    id: 'calendar_integrations',
    name: 'Enterprise Integrations',
    description: 'Seamless integration with business systems and tools',
    icon: <RefreshCw className="w-6 h-6" />,
    color: 'text-indigo-600 bg-indigo-50',
    benefits: [
      'CRM and project management sync',
      'HR and payroll system integration',
      'Financial system cost allocation',
      'Video conferencing platforms',
      'Custom API integrations'
    ]
  }
];

export const CalendarEnterpriseShowcase: React.FC<CalendarEnterpriseShowcaseProps> = ({
  businessId,
  onUpgrade
}) => {
  const { hasFeature } = useFeatureGating(businessId);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const handleFeatureClick = (featureId: string) => {
    setExpandedFeature(expandedFeature === featureId ? null : featureId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Enterprise Calendar Features</h2>
            <p className="text-gray-600 mt-2">
              Advanced scheduling, resource management, and meeting optimization
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <FeatureBadge tier="enterprise" hasAccess={false} />
          <span className="text-gray-600">•</span>
          <span className="text-sm text-gray-600">Starting at $25/user/month</span>
          <span className="text-gray-600">•</span>
          <span className="text-sm text-gray-600">14-day free trial</span>
        </div>
        
        {onUpgrade && (
          <Button onClick={onUpgrade} size="lg" className="mb-8">
            Start Free Trial
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ENTERPRISE_FEATURES.map((feature) => (
          <FeatureGate 
            key={feature.id} 
            feature={feature.id} 
            businessId={businessId}
            showUpgradePrompt={false}
            fallback={
              <Card 
                className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-gray-200 hover:border-blue-300"
              >
                <div onClick={() => handleFeatureClick(feature.id)}>
                <div className="text-center">
                  <div className={`inline-flex p-3 rounded-lg mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                    <Lock className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                  
                  {expandedFeature === feature.id && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-left">What you get:</h4>
                      <ul className="text-left space-y-1">
                        {feature.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                        {feature.benefits.length > 3 && (
                          <li className="text-sm text-blue-600 font-medium">
                            +{feature.benefits.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                    <span>Upgrade to unlock</span>
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                </div>
              </Card>
            }
          >
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <div className="text-center">
                <div className={`inline-flex p-3 rounded-lg mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                
                <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                  <span>Available</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            </Card>
          </FeatureGate>
        ))}
      </div>

      {/* ROI Calculator */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Calculate Your ROI
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            See how enterprise calendar features can reduce meeting costs, improve productivity, 
            and optimize resource utilization for your organization.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">25%</div>
              </div>
              <div className="text-sm text-gray-600">Time Savings</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">40%</div>
              </div>
              <div className="text-sm text-gray-600">Cost Reduction</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Target className="w-5 h-5 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">60%</div>
              </div>
              <div className="text-sm text-gray-600">Productivity Gain</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Shield className="w-5 h-5 text-red-600" />
                <div className="text-2xl font-bold text-red-600">100%</div>
              </div>
              <div className="text-sm text-gray-600">Compliance</div>
            </div>
          </div>
          
          {onUpgrade && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onUpgrade} size="lg">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="secondary" size="lg">
                Schedule Demo
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg inline-flex mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Resource Optimization</h3>
            <p className="text-sm text-gray-600">
              Maximize conference room utilization, reduce booking conflicts, and track 
              resource costs with intelligent booking and analytics systems.
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg inline-flex mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Meeting Governance</h3>
            <p className="text-sm text-gray-600">
              Implement approval workflows for executive meetings, ensure compliance 
              with corporate policies, and maintain audit trails for regulatory requirements.
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg inline-flex mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Productivity Analytics</h3>
            <p className="text-sm text-gray-600">
              Analyze meeting effectiveness, track time investment, and identify 
              opportunities to improve organizational productivity and meeting culture.
            </p>
          </div>
        </Card>
      </div>

      {/* Integration Ecosystem */}
      <Card className="p-8 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Seamless Enterprise Integration
          </h3>
          <p className="text-gray-600 mb-6">
            Connect with your existing business systems for a unified experience
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { name: 'Salesforce CRM', icon: '📊' },
              { name: 'Microsoft Teams', icon: '💼' },
              { name: 'Slack', icon: '💬' },
              { name: 'Zoom', icon: '📹' },
              { name: 'Jira', icon: '🎯' },
              { name: 'SAP', icon: '📈' },
              { name: 'Workday', icon: '👥' },
              { name: 'Custom APIs', icon: '🔧' }
            ].map((integration, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border text-center">
                <div className="text-2xl mb-2">{integration.icon}</div>
                <div className="text-sm font-medium text-gray-900">{integration.name}</div>
              </div>
            ))}
          </div>
          
          {onUpgrade && (
            <Button onClick={onUpgrade}>
              Explore Integrations
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CalendarEnterpriseShowcase;
