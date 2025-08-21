import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnterpriseUpgradePromptProps {
  feature: string;
  accessInfo?: {
    reason?: string;
    usageInfo?: {
      metric: string;
      limit: number;
      currentUsage: number;
      remaining: number;
    };
  };
  size?: 'sm' | 'md' | 'lg';
  showFeatureDetails?: boolean;
}

const FEATURE_BENEFITS: Record<string, {
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}> = {
  // Drive Enterprise Features
  'drive_advanced_sharing': {
    title: 'Advanced File Sharing',
    description: 'Professional-grade file sharing with enterprise controls',
    icon: '🔗',
    benefits: [
      'Granular permission controls (view/edit/comment/download)',
      'Link expiration dates and password protection',
      'External sharing with domain whitelist',
      'Share analytics and access tracking'
    ]
  },
  'drive_audit_logs': {
    title: 'File Audit Logs',
    description: 'Complete compliance and security tracking',
    icon: '📋',
    benefits: [
      'Complete file access tracking',
      'Compliance reporting (GDPR, HIPAA)',
      'Data retention policies',
      'Legal hold capabilities'
    ]
  },
  'drive_dlp': {
    title: 'Data Loss Prevention',
    description: 'Protect sensitive data with AI-powered detection',
    icon: '🛡️',
    benefits: [
      'Sensitive data detection (SSN, credit cards, etc.)',
      'Content scanning and blocking',
      'Policy enforcement and alerts',
      'Quarantine and review workflows'
    ]
  },

  // Chat Enterprise Features
  'chat_message_retention': {
    title: 'Message Retention Policies',
    description: 'Enterprise-grade message management',
    icon: '💾',
    benefits: [
      'Configurable retention policies by channel/user',
      'Automated archiving to cold storage',
      'eDiscovery search and export',
      'Legal hold preservation'
    ]
  },
  'chat_encryption': {
    title: 'End-to-End Encryption',
    description: 'Military-grade security for sensitive conversations',
    icon: '🔐',
    benefits: [
      'End-to-end encryption for sensitive conversations',
      'Message signing and verification',
      'Secure guest access with limited permissions',
      'Integration with enterprise identity providers'
    ]
  },

  // Calendar Enterprise Features
  'calendar_resource_booking': {
    title: 'Resource Booking',
    description: 'Manage conference rooms and equipment efficiently',
    icon: '🏢',
    benefits: [
      'Conference room and equipment booking',
      'Resource availability and scheduling',
      'Booking approval workflows',
      'Usage analytics and optimization'
    ]
  },

  // Dashboard Enterprise Features
  'dashboard_custom_widgets': {
    title: 'Custom Widget Builder',
    description: 'Build powerful dashboards with drag-and-drop',
    icon: '📊',
    benefits: [
      'Drag-and-drop dashboard designer',
      'Custom data source connections',
      'Advanced visualization options',
      'Widget sharing and templates'
    ]
  },
  'dashboard_ai_insights': {
    title: 'AI-Powered Insights',
    description: 'Let AI discover patterns and opportunities',
    icon: '🤖',
    benefits: [
      'Automated pattern recognition',
      'Anomaly detection and alerts',
      'Recommendation engine',
      'Natural language query interface'
    ]
  }
};

export const EnterpriseUpgradePrompt: React.FC<EnterpriseUpgradePromptProps> = ({
  feature,
  accessInfo,
  size = 'md',
  showFeatureDetails = true
}) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  
  const featureInfo = FEATURE_BENEFITS[feature];
  
  const handleUpgrade = () => {
    router.push('/billing?upgrade=enterprise');
  };

  const handleLearnMore = () => {
    router.push('/enterprise');
  };

  const handleStartTrial = () => {
    router.push('/billing?trial=enterprise');
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 ${sizeClasses[size]}`}>
      <div className="text-center">
        {/* Header */}
        <div className="text-purple-600 text-3xl mb-3">
          {featureInfo?.icon || '⭐'}
        </div>
        
        <h3 className="text-xl font-bold text-purple-900 mb-2">
          {featureInfo?.title || 'Enterprise Feature'}
        </h3>
        
        <p className="text-purple-700 mb-4">
          {featureInfo?.description || 'This powerful feature is available with Enterprise subscription'}
        </p>

        {/* Feature Benefits */}
        {showFeatureDetails && featureInfo?.benefits && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-purple-600 hover:text-purple-800 font-medium mb-3 transition-colors"
            >
              {showDetails ? '▼ Hide details' : '▶ See what you get'}
            </button>
            
            {showDetails && (
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <ul className="text-left space-y-2">
                  {featureInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Usage Info */}
        {accessInfo?.usageInfo && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-800">
              <strong>Usage Limit Reached:</strong> {accessInfo.usageInfo.currentUsage} / {accessInfo.usageInfo.limit}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Upgrade to Enterprise for unlimited usage
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleUpgrade}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            Upgrade to Enterprise
          </button>
          
          <button
            onClick={handleStartTrial}
            className="px-6 py-3 text-purple-600 bg-white border border-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
          >
            Start Free Trial
          </button>
          
          <button
            onClick={handleLearnMore}
            className="px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            Learn More
          </button>
        </div>

        {/* Pricing Info */}
        <div className="mt-4 text-xs text-purple-600">
          Enterprise starts at $99/month • 14-day free trial • Cancel anytime
        </div>

        {/* Reason */}
        {accessInfo?.reason && (
          <details className="mt-4">
            <summary className="text-xs text-purple-500 cursor-pointer hover:text-purple-700">
              Technical details
            </summary>
            <p className="text-xs text-purple-400 mt-1">{accessInfo.reason}</p>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Compact Enterprise upgrade prompt for inline use
 */
export const CompactEnterprisePrompt: React.FC<{
  feature: string;
  className?: string;
}> = ({ feature, className = '' }) => {
  const featureInfo = FEATURE_BENEFITS[feature];
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm ${className}`}>
      <span>{featureInfo?.icon || '⭐'}</span>
      <span className="font-medium">Enterprise</span>
      <button className="text-purple-600 hover:text-purple-800 underline">
        Upgrade
      </button>
    </div>
  );
};

/**
 * Feature badge that shows tier and upgrade option
 */
export const FeatureBadge: React.FC<{
  tier: 'free' | 'standard' | 'enterprise';
  hasAccess: boolean;
  feature?: string;
  size?: 'sm' | 'md';
}> = ({ tier, hasAccess, feature, size = 'sm' }) => {
  const router = useRouter();
  
  const tierColors = {
    free: 'bg-gray-100 text-gray-700',
    standard: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700'
  };
  
  const tierIcons = {
    free: '🆓',
    standard: '⭐',
    enterprise: '👑'
  };
  
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  
  if (hasAccess) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${tierColors[tier]} ${sizeClasses}`}>
        <span>{tierIcons[tier]}</span>
        <span className="capitalize">{tier}</span>
      </span>
    );
  }
  
  return (
    <button
      onClick={() => router.push(`/billing?upgrade=${tier}`)}
      className={`inline-flex items-center gap-1 rounded-full font-medium border-2 border-dashed hover:bg-opacity-50 transition-colors ${tierColors[tier]} ${sizeClasses}`}
    >
      <span>🔒</span>
      <span className="capitalize">{tier}</span>
      <span className="ml-1">→</span>
    </button>
  );
};

export default EnterpriseUpgradePrompt;
