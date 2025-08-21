import React from 'react';
import { useFeature } from '../../hooks/useFeatureGating';
import { useDashboard } from '../../contexts/DashboardContext';
import EnhancedChatModule from './enterprise/EnhancedChatModule';
import ChatModule from '../modules/ChatModule';

interface ChatModuleWrapperProps {
  className?: string;
}

/**
 * Wrapper component that conditionally renders either the standard Chat module
 * or the enhanced enterprise Chat module based on feature access
 */
export const ChatModuleWrapper: React.FC<ChatModuleWrapperProps> = ({
  className = ''
}) => {
  const { currentDashboard, getDashboardType } = useDashboard();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Check if user has enterprise Chat features
  const { hasAccess: hasEnterpriseFeatures } = useFeature('chat_e2e_encryption', businessId);
  
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
    />
  );
};

export default ChatModuleWrapper;
