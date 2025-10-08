import React from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import EnhancedDriveModule from './enterprise/EnhancedDriveModule';
import DriveModule from '../modules/DriveModule';

interface DriveModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that conditionally renders either the standard Drive module
 * or the enhanced enterprise Drive module based on feature access
 */
export const DriveModuleWrapper: React.FC<DriveModuleWrapperProps> = ({
  className = '',
  refreshTrigger
}) => {
  const { currentDashboard, getDashboardType } = useDashboard();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Check if user has enterprise Drive features
  const { hasAccess: hasEnterpriseFeatures } = useFeature('drive_advanced_sharing', businessId);
  
  // If user has enterprise features and is in a business context, use enhanced module
  if (hasEnterpriseFeatures && businessId) {
    return (
      <EnhancedDriveModule 
        businessId={businessId}
        className={className}
        refreshTrigger={refreshTrigger}
      />
    );
  }
  
  // Otherwise, use standard Drive module
  return (
    <DriveModule 
      businessId={businessId || ''}
      className={className}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default DriveModuleWrapper;
