import React, { useState } from 'react';
import { Card, Button, Badge } from 'shared/components';
import { EnterpriseUpgradePrompt } from '../../EnterpriseUpgradePrompt';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Target,
  Layers,
  PieChart,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Globe,
  Settings,
  Eye,
  Brain,
  RefreshCw,
  Download
} from 'lucide-react';

interface DashboardEnterpriseShowcaseProps {
  businessId?: string;
  onUpgrade?: () => void;
  className?: string;
}

interface FeatureShowcase {
  id: string;
  title: string;
  description: string;
  category: 'analytics' | 'intelligence' | 'collaboration' | 'compliance';
  icon: React.ReactNode;
  benefits: string[];
  preview: React.ReactNode;
  tier: 'premium' | 'enterprise';
}

const ENTERPRISE_FEATURES: FeatureShowcase[] = [
  {
    id: 'executive_analytics',
    title: 'Executive Analytics Dashboard',
    description: 'C-level insights with real-time KPI tracking, performance metrics, and business intelligence.',
    category: 'analytics',
    icon: <BarChart3 className="w-6 h-6" />,
    tier: 'enterprise',
    benefits: [
      'Real-time executive KPI dashboard',
      'Automated performance reporting',
      'Predictive business analytics',
      'Cross-department insights',
      'Custom metric tracking'
    ],
    preview: (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Revenue Growth</div>
              <TrendingUp className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">+24.5%</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Active Users</div>
              <Users className="w-3 h-3 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">1,247</div>
          </div>
        </div>
        <div className="bg-white p-2 rounded text-xs text-gray-600">
          📊 Real-time business metrics with predictive insights
        </div>
      </div>
    )
  },
  {
    id: 'cross_module_analytics',
    title: 'Cross-Module Analytics',
    description: 'Unified insights across Drive, Chat, Calendar, and Dashboard modules with correlation analysis.',
    category: 'intelligence',
    icon: <Layers className="w-6 h-6" />,
    tier: 'enterprise',
    benefits: [
      'Module usage correlation analysis',
      'User journey mapping',
      'Cross-platform productivity insights',
      'Integrated compliance reporting',
      'Holistic business intelligence'
    ],
    preview: (
      <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-lg">
        <div className="space-y-2 mb-3">
          {['Drive', 'Chat', 'Calendar'].map((module, i) => (
            <div key={module} className="flex items-center justify-between">
              <div className="text-xs text-gray-600">{module}</div>
              <div className="w-16 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full" 
                  style={{ width: `${85 - i * 10}%` }}
                />
              </div>
              <div className="text-xs font-medium">{85 - i * 10}%</div>
            </div>
          ))}
        </div>
        <div className="bg-white p-2 rounded text-xs text-gray-600">
          🔄 Cross-module productivity correlation: +34% efficiency
        </div>
      </div>
    )
  },
  {
    id: 'ai_insights',
    title: 'AI-Powered Business Intelligence',
    description: 'Machine learning insights, automated recommendations, and predictive analytics.',
    category: 'intelligence',
    icon: <Brain className="w-6 h-6" />,
    tier: 'enterprise',
    benefits: [
      'AI-generated business insights',
      'Automated anomaly detection',
      'Predictive trend analysis',
      'Smart recommendations',
      'Natural language reporting'
    ],
    preview: (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <div className="text-xs font-medium text-purple-700">AI Insight</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm text-xs text-gray-700">
          <div className="font-medium mb-1">🎯 Opportunity Detected</div>
          <div>Teams using integrated workflows show 45% better outcomes</div>
        </div>
        <div className="mt-2 text-xs text-purple-600">
          💡 AI analyzed 10,000+ data points
        </div>
      </div>
    )
  },
  {
    id: 'custom_widgets',
    title: 'Custom Widget Builder',
    description: 'Drag-and-drop widget creation with custom data sources and advanced visualizations.',
    category: 'analytics',
    icon: <Plus className="w-6 h-6" />,
    tier: 'enterprise',
    benefits: [
      'Drag-and-drop widget builder',
      'Custom data source integration',
      'Advanced chart types',
      'Real-time data connections',
      'Shareable widget templates'
    ],
    preview: (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {['Chart', 'Table', 'Gauge', 'Map'].map(type => (
            <div key={type} className="bg-white p-2 rounded text-center text-xs border-2 border-dashed border-gray-200">
              {type}
            </div>
          ))}
        </div>
        <div className="bg-white p-2 rounded text-xs text-gray-600">
          🎨 Build custom visualizations with any data source
        </div>
      </div>
    )
  },
  {
    id: 'compliance_monitoring',
    title: 'Compliance & Security Dashboard',
    description: 'Real-time compliance monitoring, audit trails, and security policy management.',
    category: 'compliance',
    icon: <Shield className="w-6 h-6" />,
    tier: 'enterprise',
    benefits: [
      'Real-time compliance monitoring',
      'Automated audit trail generation',
      'Security policy enforcement',
      'Regulatory reporting',
      'Risk assessment dashboards'
    ],
    preview: (
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 rounded-lg">
        <div className="space-y-2 mb-3">
          {[
            { name: 'GDPR', score: 96, status: 'compliant' },
            { name: 'SOX', score: 94, status: 'compliant' },
            { name: 'HIPAA', score: 89, status: 'review' }
          ].map(comp => (
            <div key={comp.name} className="flex items-center justify-between bg-white p-2 rounded">
              <div className="text-xs font-medium">{comp.name}</div>
              <div className="flex items-center gap-2">
                <div className="text-xs">{comp.score}%</div>
                <div className={`w-2 h-2 rounded-full ${
                  comp.status === 'compliant' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-2 rounded text-xs text-gray-600">
          🛡️ Automated compliance monitoring across all modules
        </div>
      </div>
    )
  },
  {
    id: 'real_time_collaboration',
    title: 'Real-Time Dashboard Collaboration',
    description: 'Live dashboard editing, annotations, and collaborative analytics sessions.',
    category: 'collaboration',
    icon: <Users className="w-6 h-6" />,
    tier: 'enterprise',
    benefits: [
      'Live collaborative editing',
      'Real-time annotations',
      'Shared analytics sessions',
      'Comment and discussion threads',
      'Version control and history'
    ],
    preview: (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">👤</div>
          <div className="text-xs text-gray-600">John is editing...</div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-700 mb-1">💬 Sarah: "Great insights on Q3!"</div>
          <div className="text-xs text-gray-500">📍 Annotation on Revenue Chart</div>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          👥 3 collaborators active
        </div>
      </div>
    )
  }
];

const CATEGORY_CONFIGS = {
  analytics: { name: 'Analytics', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <BarChart3 className="w-4 h-4" /> },
  intelligence: { name: 'AI Intelligence', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Brain className="w-4 h-4" /> },
  collaboration: { name: 'Collaboration', color: 'text-green-600 bg-green-50 border-green-200', icon: <Users className="w-4 h-4" /> },
  compliance: { name: 'Compliance', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <Shield className="w-4 h-4" /> }
};

export const DashboardEnterpriseShowcase: React.FC<DashboardEnterpriseShowcaseProps> = ({
  businessId,
  onUpgrade,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const filteredFeatures = selectedCategory 
    ? ENTERPRISE_FEATURES.filter(feature => feature.category === selectedCategory)
    : ENTERPRISE_FEATURES;

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(selectedFeature === featureId ? null : featureId);
  };

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowUpgradePrompt(true);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Dashboard Features</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Unlock powerful business intelligence, AI-driven insights, and advanced analytics 
            to transform how your organization makes data-driven decisions.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full">
              ✨ Advanced Analytics
            </Badge>
            <Badge className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full">
              🤖 AI-Powered
            </Badge>
            <Badge className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full">
              🚀 Real-Time
            </Badge>
          </div>
          
          <Button onClick={handleUpgradeClick} className="px-8 py-3">
            <Zap className="w-4 h-4 mr-2" />
            Upgrade to Enterprise
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Category Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter by Category:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Features
          </button>
          {Object.entries(CATEGORY_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                selectedCategory === key
                  ? config.color
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {config.icon}
              {config.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map(feature => {
          const categoryConfig = CATEGORY_CONFIGS[feature.category];
          const isSelected = selectedFeature === feature.id;
          
          return (
            <Card 
              key={feature.id} 
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
            >
              <div onClick={() => handleFeatureSelect(feature.id)}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {feature.icon}
                  </div>
                  <Badge className={`px-2 py-1 text-xs border rounded-full ${categoryConfig.color}`}>
                    {categoryConfig.name}
                  </Badge>
                </div>
                <Badge className="px-2 py-1 text-xs bg-purple-100 text-purple-700 border border-purple-200 rounded-full">
                  Enterprise
                </Badge>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
              
              {/* Feature Preview */}
              <div className="mb-4">
                {feature.preview}
              </div>
              
              {isSelected && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgradeClick();
                    }}
                    className="w-full"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Unlock This Feature
                  </Button>
                </div>
                            )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Value Proposition */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Increase Productivity</h3>
            <p className="text-sm text-gray-600">
              AI-powered insights help teams work 40% more efficiently with data-driven decisions.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Ensure Compliance</h3>
            <p className="text-sm text-gray-600">
              Automated compliance monitoring and reporting keep your organization secure and audit-ready.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Smart Insights</h3>
            <p className="text-sm text-gray-600">
              Machine learning algorithms surface hidden patterns and opportunities in your data.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Button onClick={handleUpgradeClick} size="lg">
            <Globe className="w-4 h-4 mr-2" />
            Start Enterprise Trial
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            14-day free trial • No credit card required • Full feature access
          </p>
        </div>
      </Card>

      {/* ROI Calculator */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Enterprise Dashboard ROI</h3>
          <p className="text-gray-600">See how enterprise features impact your bottom line</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { metric: 'Time Saved', value: '15 hrs/week', description: 'Per executive' },
            { metric: 'Decision Speed', value: '+60%', description: 'Faster insights' },
            { metric: 'Compliance Cost', value: '-$50K/year', description: 'Reduced audit costs' },
            { metric: 'Productivity Gain', value: '+25%', description: 'Team efficiency' }
          ].map(item => (
            <div key={item.metric} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{item.value}</div>
              <div className="font-medium text-gray-900 mb-1">{item.metric}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUpgradePrompt(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Upgrade Required</h3>
              <button 
                onClick={() => setShowUpgradePrompt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <EnterpriseUpgradePrompt
              feature="Enterprise Dashboard"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardEnterpriseShowcase;
