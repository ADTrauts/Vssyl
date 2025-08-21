import React from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import EnhancedDashboardModule from './enterprise/EnhancedDashboardModule';
import DashboardEnterpriseShowcase from './enterprise/DashboardEnterpriseShowcase';

interface DashboardModuleWrapperProps {
  businessId?: string;
  showEnterpriseFeatures?: boolean;
  className?: string;
}

/**
 * Smart wrapper component that conditionally loads the appropriate Dashboard module
 * based on user's feature access and subscription tier.
 * 
 * Logic:
 * 1. If user has enterprise dashboard features -> EnhancedDashboardModule
 * 2. If in business context but no enterprise access -> Show enterprise showcase
 * 3. Fallback -> Standard dashboard (handled by parent)
 */
export const DashboardModuleWrapper: React.FC<DashboardModuleWrapperProps> = ({
  businessId,
  showEnterpriseFeatures = true,
  className = ''
}) => {
  // Check for enterprise dashboard features using individual hooks
  const { hasAccess: hasEnterpriseAnalytics, loading: analyticsLoading } = useFeature('dashboard_advanced_analytics', businessId);
  const { hasAccess: hasExecutiveInsights, loading: insightsLoading } = useFeature('dashboard_executive_insights', businessId);
  const { hasAccess: hasCrossModuleAnalytics, loading: crossModuleLoading } = useFeature('dashboard_cross_module_analytics', businessId);

  // Determine if user has any enterprise dashboard features
  const hasAnyEnterpriseDashboardFeature = 
    hasEnterpriseAnalytics || hasExecutiveInsights || hasCrossModuleAnalytics;

  // Combined loading state
  const loading = analyticsLoading || insightsLoading || crossModuleLoading;

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user has enterprise features, show enhanced dashboard
  if (hasAnyEnterpriseDashboardFeature) {
    return (
      <EnhancedDashboardModule 
        businessId={businessId}
        className={className}
      />
    );
  }

  // If in business context but no enterprise access, show enterprise showcase
  if (businessId && showEnterpriseFeatures) {
    return (
      <DashboardEnterpriseShowcase 
        businessId={businessId}
        className={className}
      />
    );
  }

  // Fallback: Return null to let parent handle standard dashboard
  return null;
};

export default DashboardModuleWrapper;
