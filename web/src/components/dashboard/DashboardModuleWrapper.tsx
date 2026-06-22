import React from 'react';
import DashboardEnterpriseShowcase from './enterprise/DashboardEnterpriseShowcase';
import EnhancedDashboardModule from './enterprise/EnhancedDashboardModule';

interface DashboardModuleWrapperProps {
  businessId?: string;
  dashboardId?: string;
  showEnterpriseFeatures?: boolean;
  /** When true, mounts enterprise analytics panels via analytics facade (K3-02). */
  enableEnterpriseAnalytics?: boolean;
  className?: string;
}

/**
 * Package 3: Enterprise panels consume analytics facade; showcase remains marketing-only.
 */
export const DashboardModuleWrapper: React.FC<DashboardModuleWrapperProps> = ({
  businessId,
  dashboardId,
  showEnterpriseFeatures = true,
  enableEnterpriseAnalytics = false,
  className = '',
}) => {
  if (!businessId || !showEnterpriseFeatures) {
    return null;
  }

  if (enableEnterpriseAnalytics && dashboardId) {
    return (
      <EnhancedDashboardModule
        businessId={businessId}
        dashboardId={dashboardId}
        className={className}
      />
    );
  }

  return (
    <DashboardEnterpriseShowcase
      businessId={businessId}
      className={className}
    />
  );
};

export default DashboardModuleWrapper;
