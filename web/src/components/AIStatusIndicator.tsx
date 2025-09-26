'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../lib/apiUtils';

interface AIStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

type AIStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export default function AIStatusIndicator({ className = '', showLabel = false }: AIStatusIndicatorProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<AIStatus>('disconnected');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkAIStatus = async () => {
    if (!session?.accessToken) return;

    setStatus('connecting');
    
    try {
      const response = await authenticatedApiCall<{
        response: string;
        confidence: number;
      }>('/api/ai/twin', {
        method: 'POST',
        body: JSON.stringify({
          query: 'Status check',
          context: {
            currentModule: 'status-check',
            dashboardType: 'personal',
            urgency: 'low'
          }
        })
      }, session.accessToken);

      if (response.response) {
        setStatus('connected');
        setLastCheck(new Date());
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('AI status check failed:', error);
      setStatus('error');
    }
  };

  // Check status on mount and every 5 minutes
  useEffect(() => {
    if (session?.accessToken) {
      checkAIStatus();
      const interval = setInterval(checkAIStatus, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [session?.accessToken]);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Brain className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Brain className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `AI Connected${lastCheck ? ` (${lastCheck.toLocaleTimeString()})` : ''}`;
      case 'connecting':
        return 'Connecting to AI...';
      case 'error':
        return 'AI Connection Error';
      default:
        return 'AI Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!session) return null;

  return (
    <div 
      className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={checkAIStatus}
      title={getStatusText()}
    >
      <div className="relative">
        {getStatusIcon()}
        {/* Connection indicator dot */}
        <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white ${
          status === 'connected' ? 'bg-green-500' :
          status === 'connecting' ? 'bg-yellow-500' :
          status === 'error' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
      </div>
      
      {showLabel && (
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          AI
        </span>
      )}
    </div>
  );
}
