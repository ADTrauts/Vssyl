import React, { Suspense, lazy } from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import CalendarModule from '../modules/CalendarModule';
import { Spinner } from 'shared/components';

// Lazy load enterprise module for better performance
const EnhancedCalendarModule = lazy(() => import('./enterprise/EnhancedCalendarModule'));

interface CalendarModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that conditionally renders either the standard Calendar module
 * or the enhanced enterprise Calendar module based on feature access
 * 
 * NOTE: Does NOT include sidebar - sidebars are managed by parent components
 * Includes lazy loading for enterprise module to optimize bundle size
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
      <Suspense 
        fallback={
          <div className="flex items-center justify-center bg-gray-50 h-full">
            <div className="text-center">
              <Spinner size={32} />
              <p className="mt-4 text-sm text-gray-600">Loading enterprise calendar...</p>
            </div>
          </div>
        }
      >
        <EnhancedCalendarModule 
          businessId={businessId}
          className={className}
          refreshTrigger={refreshTrigger}
        />
      </Suspense>
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
