import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import UnifiedChatModule from './UnifiedChatModule';

interface ChatModuleWrapperProps {
  className?: string;
  refreshTrigger?: number;
}

/**
 * Wrapper component that renders the unified Chat module with context-aware features
 * The unified module automatically switches between personal and enterprise features
 * based on user permissions and dashboard context
 */
export const ChatModuleWrapper: React.FC<ChatModuleWrapperProps> = ({
  className = '',
  refreshTrigger
}) => {
  const { currentDashboard, getDashboardType } = useDashboard();
  const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
  
  // Get business ID for enterprise feature checking
  const businessId = dashboardType === 'business' ? currentDashboard?.id : undefined;
  
  // Use unified chat module with context-aware features
  return (
    <UnifiedChatModule 
      businessId={businessId}
      className={className}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default ChatModuleWrapper;
