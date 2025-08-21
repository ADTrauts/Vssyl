import React from 'react';
import { useFeature } from '../hooks/useFeatureGating';
import EnterpriseUpgradePrompt from '../components/EnterpriseUpgradePrompt';
import LoadingSpinner from '../components/LoadingSpinner';

interface FeatureGateProps {
  feature: string;
  businessId?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  children: React.ReactNode;
}

/**
 * FeatureGate component that conditionally renders children based on feature access
 * Shows upgrade prompts for locked enterprise features
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  businessId,
  fallback,
  showUpgradePrompt = true,
  children
}) => {
  const { hasAccess, loading, accessInfo } = useFeature(feature, businessId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show upgrade prompt for enterprise features
  if (showUpgradePrompt && accessInfo?.reason?.includes('enterprise')) {
    return <EnterpriseUpgradePrompt feature={feature} accessInfo={accessInfo} />;
  }

  // Show upgrade prompt for standard features
  if (showUpgradePrompt && accessInfo?.reason?.includes('standard')) {
    return <StandardUpgradePrompt feature={feature} accessInfo={accessInfo} />;
  }

  // Show custom fallback or default locked message
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
      <div className="text-center">
        <div className="text-gray-600 mb-2">🔒 Feature Locked</div>
        <p className="text-sm text-gray-500">
          This feature requires a higher subscription tier.
        </p>
        {accessInfo?.reason && (
          <p className="text-xs text-gray-400 mt-1">{accessInfo.reason}</p>
        )}
      </div>
    </div>
  );
};

/**
 * StandardUpgradePrompt component for standard tier features
 */
const StandardUpgradePrompt: React.FC<{
  feature: string;
  accessInfo: any;
}> = ({ feature, accessInfo }) => {
  return (
    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-center">
        <div className="text-blue-600 text-2xl mb-3">⭐</div>
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Upgrade to Standard
        </h3>
        <p className="text-blue-700 mb-4">
          Unlock this feature with a Standard subscription starting at $49.99/month
        </p>
        <div className="flex gap-3 justify-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upgrade Now
          </button>
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Learn More
          </button>
        </div>
        {accessInfo?.reason && (
          <p className="text-xs text-blue-500 mt-3">{accessInfo.reason}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Hook for conditional rendering based on feature access
 */
export const useFeatureGate = (feature: string, businessId?: string) => {
  const { hasAccess, loading, accessInfo } = useFeature(feature, businessId);
  
  return {
    hasAccess,
    loading,
    accessInfo,
    renderWithGate: (children: React.ReactNode, options?: {
      fallback?: React.ReactNode;
      showUpgradePrompt?: boolean;
    }) => (
      <FeatureGate
        feature={feature}
        businessId={businessId}
        fallback={options?.fallback}
        showUpgradePrompt={options?.showUpgradePrompt}
      >
        {children}
      </FeatureGate>
    )
  };
};

/**
 * FeatureList component to show available and locked features for a module
 */
interface FeatureListProps {
  module: string;
  businessId?: string;
  showLocked?: boolean;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  module,
  businessId,
  showLocked = true
}) => {
  // This would use the useModuleFeatures hook to get feature access
  // Implementation would show a list of features with their access status
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Available Features</h4>
      {/* Feature list implementation */}
      <div className="text-sm text-gray-500">
        Feature list for {module} module
      </div>
    </div>
  );
};

export default FeatureGate;