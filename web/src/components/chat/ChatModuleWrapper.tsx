import React, { Suspense, lazy } from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import ChatModule from '../modules/ChatModule';
import { Spinner } from 'shared/components';

// Lazy load enterprise module for better performance
const EnhancedChatModule = lazy(() => import('./enterprise/EnhancedChatModule'));

interface ChatModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that conditionally renders either the standard Chat module
 * or the enhanced enterprise Chat module based on feature access
 * 
 * Pattern matches DriveModuleWrapper and CalendarModuleWrapper for consistency
 * Includes lazy loading for enterprise module to optimize bundle size
 */
export const ChatModuleWrapper: React.FC<ChatModuleWrapperProps> = ({
  className = '',
  refreshTrigger
}) => {
  const { currentDashboard, getDashboardType } = useDashboard();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Check if user has enterprise Chat features
  // Using 'chat_message_retention' as the primary enterprise chat feature gate
  const { hasAccess: hasEnterpriseFeatures } = useFeature('chat_message_retention', businessId);
  
  // Full-page layout with Chat (no separate sidebar - chat has integrated panels)
  // If user has enterprise features and is in a business context, use enhanced module
  if (hasEnterpriseFeatures && businessId) {
    return (
      <div className={`h-full ${className}`}>
        <Suspense 
          fallback={
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Spinner size={32} />
                <p className="mt-4 text-sm text-gray-600">Loading enterprise chat...</p>
              </div>
            </div>
          }
        >
          <EnhancedChatModule 
            businessId={businessId}
            className="h-full"
          />
        </Suspense>
      </div>
    );
  }
  
  // Otherwise, use standard Chat module
  return (
    <div className={`h-full ${className}`}>
      <ChatModule 
        businessId={businessId || ''}
        className="h-full"
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default ChatModuleWrapper;

