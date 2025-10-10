import React from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import EnhancedCalendarModule from './enterprise/EnhancedCalendarModule';
import CalendarModule from '../modules/CalendarModule';

interface CalendarModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that conditionally renders either the standard Calendar module
 * or the enhanced enterprise Calendar module based on feature access
 */
export const CalendarModuleWrapper: React.FC<CalendarModuleWrapperProps> = ({
  className = '',
  refreshTrigger
}) => {
  const { currentDashboard, getDashboardType } = useDashboard();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Check if user has enterprise Calendar features
  const { hasAccess: hasEnterpriseFeatures } = useFeature('calendar_resource_booking', businessId);
  
  // If user has enterprise features and is in a business context, use enhanced module
  if (hasEnterpriseFeatures && businessId) {
    return (
      <EnhancedCalendarModule 
        businessId={businessId}
        className={className}
        refreshTrigger={refreshTrigger}
      />
    );
  }
  
  // Otherwise, use standard Calendar module
  return (
    <CalendarModule 
      businessId={businessId || ''}
      className={className}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default CalendarModuleWrapper;
