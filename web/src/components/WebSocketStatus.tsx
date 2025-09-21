/**
 * WebSocket Status Component
 * Displays real-time WebSocket connection status with fallback mode indicators
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface WebSocketStatusProps {
  isConnected: boolean;
  state: 'connected' | 'connecting' | 'disconnected' | 'failed' | 'polling';
  mode: 'websocket' | 'polling' | 'offline';
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  isConnected,
  state,
  mode,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (state === 'connected' && mode === 'websocket') {
      return <Wifi className="w-4 h-4 text-green-500" />;
    } else if (state === 'polling') {
      return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
    } else if (state === 'connecting') {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    } else if (state === 'failed') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (state === 'connected' && mode === 'websocket') {
      return 'Real-time';
    } else if (state === 'polling') {
      return 'Polling';
    } else if (state === 'connecting') {
      return 'Connecting...';
    } else if (state === 'failed') {
      return 'Connection Failed';
    } else {
      return 'Offline';
    }
  };

  const getStatusColor = () => {
    if (state === 'connected' && mode === 'websocket') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (state === 'polling') {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else if (state === 'connecting') {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else if (state === 'failed') {
      return 'text-red-600 bg-red-50 border-red-200';
    } else {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

export default WebSocketStatus;
