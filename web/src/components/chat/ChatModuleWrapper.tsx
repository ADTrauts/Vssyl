import React from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import EnhancedChatModule from './enterprise/EnhancedChatModule';
import ChatModule from '../modules/ChatModule';

interface ChatModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that conditionally renders either the standard Chat module
 * or the enhanced enterprise Chat module based on feature access
 * 
 * Pattern matches DriveModuleWrapper and CalendarModuleWrapper for consistency
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
  
  // If user has enterprise features and is in a business context, use enhanced module
  if (hasEnterpriseFeatures && businessId) {
    return (
      <EnhancedChatModule 
        businessId={businessId}
        className={className}
      />
    );
  }
  
  // Otherwise, use standard Chat module
  return (
    <ChatModule 
      businessId={businessId || ''}
      className={className}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default ChatModuleWrapper;

