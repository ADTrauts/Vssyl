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
  
  // TEMPORARY: Force enhanced module for testing (remove this in production)
  const forceEnhanced = true; // Set to false to disable
  
  console.log('🔍 Drive Module Selection Debug:', {
    hasEnterpriseFeatures,
    businessId,
    currentDashboard: currentDashboard?.id,
    dashboardType,
    forceEnhanced,
    willUseEnhanced: (hasEnterpriseFeatures && businessId) || forceEnhanced
  });
  
  // If user has enterprise features and is in a business context, use enhanced module
  // TEMPORARY: Also use enhanced if forceEnhanced is true
  if ((hasEnterpriseFeatures && businessId) || forceEnhanced) {
    return (
      <EnhancedDriveModule 
        businessId={businessId || currentDashboard?.id || 'temp-business-id'}
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
