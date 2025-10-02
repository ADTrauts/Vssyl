'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../../contexts/DashboardContext';
import { toast } from 'react-hot-toast';
import { ChatModuleWrapper } from './ChatModuleWrapper';

interface ChatPageContentProps {
  className?: string;
}

export function ChatPageContent({ className = '' }: ChatPageContentProps) {
  const { data: session } = useSession();
  const { currentDashboard, navigateToDashboard } = useDashboard();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Conversation creation handler
  const handleCreateConversation = useCallback(async (type: 'DIRECT' | 'GROUP' | 'CHANNEL', participantIds: string[], name?: string) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ 
          type,
          participantIds,
          name,
          dashboardId: currentDashboard?.id || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create conversation');
      }
      
      // Trigger refresh without page reload
      setRefreshTrigger(prev => prev + 1);
      toast.success('Conversation created successfully');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  }, [session, currentDashboard]);

  // Context switch handler
  const handleContextSwitch = useCallback(async (dashboardId: string) => {
    await navigateToDashboard(dashboardId);
    // Use router.push for seamless navigation instead of page reload
    router.push(`/chat?dashboard=${dashboardId}`);
  }, [navigateToDashboard, router]);

  return (
    <div className={`h-screen bg-gray-50 ${className}`}>
      {/* Main Content - Context-aware module with built-in sidebar */}
      <ChatModuleWrapper 
        className="h-full" 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}

export default ChatPageContent;
