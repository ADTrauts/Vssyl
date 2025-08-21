import React, { useState } from 'react';
import { Card, Button } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { FeatureBadge } from '../../EnterpriseUpgradePrompt';
import { 
  Shield, 
  Lock, 
  Archive, 
  Eye, 
  Key, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Flag,
  Search,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';

interface ChatEnterpriseShowcaseProps {
  businessId?: string;
  onUpgrade?: () => void;
}

const ENTERPRISE_FEATURES = [
  {
    id: 'chat_e2e_encryption',
    name: 'End-to-End Encryption',
    description: 'Military-grade encryption for all messages and files',
    icon: <Lock className="w-6 h-6" />,
    color: 'text-green-600 bg-green-50',
    benefits: [
      'AES-256 and ChaCha20 encryption algorithms',
      'Zero-knowledge architecture',
      'Perfect forward secrecy',
      'Encrypted file sharing',
      'Key rotation and management'
    ]
  },
  {
    id: 'chat_message_retention',
    name: 'Message Retention & Compliance',
    description: 'Automated data retention policies and legal holds',
    icon: <Archive className="w-6 h-6" />,
    color: 'text-blue-600 bg-blue-50',
    benefits: [
      'Automated retention policies',
      'Legal hold management',
      'Compliance reporting (GDPR, HIPAA, SOX)',
      'Data export and archiving',
      'Audit trails and chain of custody'
    ]
  },
  {
    id: 'chat_content_moderation',
    name: 'AI Content Moderation',
    description: 'Intelligent content filtering and policy enforcement',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-red-600 bg-red-50',
    benefits: [
      'Real-time content scanning',
      'Custom moderation rules',
      'PII and sensitive data detection',
      'Harassment and toxicity prevention',
      'Automated violation reporting'
    ]
  },
  {
    id: 'chat_advanced_search',
    name: 'Enterprise Search',
    description: 'Advanced search across all encrypted communications',
    icon: <Search className="w-6 h-6" />,
    color: 'text-purple-600 bg-purple-50',
    benefits: [
      'Full-text encrypted search',
      'Advanced filtering and facets',
      'Compliance-ready search logs',
      'Cross-channel search',
      'Saved searches and alerts'
    ]
  },
  {
    id: 'chat_voice_calls',
    name: 'Encrypted Voice & Video',
    description: 'Secure voice and video calls with recording',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-indigo-600 bg-indigo-50',
    benefits: [
      'End-to-end encrypted calls',
      'Call recording and transcription',
      'Screen sharing with watermarks',
      'Meeting compliance controls',
      'Call analytics and insights'
    ]
  },
  {
    id: 'chat_workflow_integration',
    name: 'Workflow Integration',
    description: 'Advanced automation and approval workflows',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-orange-600 bg-orange-50',
    benefits: [
      'Message approval workflows',
      'Automated compliance checks',
      'Integration with business systems',
      'Smart notifications and routing',
      'Custom workflow triggers'
    ]
  }
];

export const ChatEnterpriseShowcase: React.FC<ChatEnterpriseShowcaseProps> = ({
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
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Enterprise Chat Features</h2>
            <p className="text-gray-600 mt-2">
              Secure, compliant, and intelligent business communications
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <FeatureBadge tier="enterprise" hasAccess={false} />
          <span className="text-gray-600">•</span>
          <span className="text-sm text-gray-600">Starting at $15/user/month</span>
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

      {/* Security & Compliance Section */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Enterprise-Grade Security & Compliance
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Meet the highest security standards with comprehensive compliance features, 
            advanced encryption, and intelligent monitoring for regulated industries.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">256-bit</div>
              </div>
              <div className="text-sm text-gray-600">AES Encryption</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-lg font-bold text-green-600">SOC 2</div>
              </div>
              <div className="text-sm text-gray-600">Type II Certified</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">GDPR</div>
              </div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div className="text-lg font-bold text-orange-600">24/7</div>
              </div>
              <div className="text-sm text-gray-600">Monitoring</div>
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
            <h3 className="font-semibold text-gray-900 mb-2">Executive Communications</h3>
            <p className="text-sm text-gray-600">
              Secure board discussions, strategic planning, and confidential decision-making 
              with zero-knowledge encryption and comprehensive audit trails.
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg inline-flex mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Legal & Compliance</h3>
            <p className="text-sm text-gray-600">
              Legal privilege protection, litigation hold management, and automated 
              compliance reporting for regulated industries and legal teams.
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg inline-flex mb-4">
              <Flag className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">HR & People Operations</h3>
            <p className="text-sm text-gray-600">
              Sensitive HR discussions, employee reviews, and workplace incident 
              management with privacy protection and content moderation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatEnterpriseShowcase;
