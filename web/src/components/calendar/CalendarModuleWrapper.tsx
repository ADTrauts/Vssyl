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
  dashboardId?: string | null;
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
  refreshTrigger,
  dashboardId
}) => {
  const { currentDashboard, getDashboardType } = useDashboard();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Use explicit dashboardId if provided, otherwise fall back to current dashboard
  const effectiveDashboardId = dashboardId || currentDashboard?.id;
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? (dashboardId || currentDashboard?.id) : undefined;
  
  console.log('📅 CalendarModuleWrapper:', {
    dashboardId,
    effectiveDashboardId,
    businessId,
    dashboardType,
    currentDashboardId: currentDashboard?.id
  });
  
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
          dashboardId={effectiveDashboardId}
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
      dashboardId={effectiveDashboardId}
      className={className}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default CalendarModuleWrapper;
