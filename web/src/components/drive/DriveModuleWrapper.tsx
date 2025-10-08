import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
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
  
  // Get business ID for context
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // For now, always use standard Drive module to avoid feature gating issues
  // TODO: Add enterprise feature checking back when module system is properly set up
  return (
    <DriveModule 
      businessId={businessId || ''}
      className={className}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default DriveModuleWrapper;
