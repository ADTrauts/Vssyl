'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Database, MessageSquare, Building, Calendar, Home, FileText, Activity } from 'lucide-react';
import { getCrossModuleContext, CrossModuleContext } from '../../api/aiContextDebug';

interface CrossModuleContextMapProps {
  className?: string;
}

export default function CrossModuleContextMap({ className = '' }: CrossModuleContextMapProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [contextData, setContextData] = useState<CrossModuleContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCrossModuleContext(searchQuery, session.accessToken);
      if (response.success) {
        setContextData(response.data);
      } else {
        setError('Failed to fetch cross-module context');
      }
    } catch (err) {
      setError('Error fetching cross-module context');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case 'drive':
        return <FileText className="w-5 h-5" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5" />;
      case 'business':
        return <Building className="w-5 h-5" />;
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      case 'household':
        return <Home className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getModuleColor = (moduleName: string) => {
    switch (moduleName) {
      case 'drive':
        return 'text-blue-600 bg-blue-100';
      case 'chat':
        return 'text-green-600 bg-green-100';
      case 'business':
        return 'text-purple-600 bg-purple-100';
      case 'calendar':
        return 'text-orange-600 bg-orange-100';
      case 'household':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Type guards for module data
  const isDriveModule = (data: any): data is { fileCount: number; recentFiles: any[]; totalSize: number } => {
    return 'fileCount' in data && 'totalSize' in data;
  };

  const isChatModule = (data: any): data is { conversationCount: number; conversations: any[] } => {
    return 'conversationCount' in data && 'conversations' in data;
  };

  const isBusinessModule = (data: any): data is { businessCount: number; businesses: any[] } => {
    return 'businessCount' in data && 'businesses' in data;
  };

  const isCalendarModule = (data: any): data is { calendarCount: number; calendars: any[] } => {
    return 'calendarCount' in data && 'calendars' in data;
  };

  const isHouseholdModule = (data: any): data is { householdCount: number; households: any[] } => {
    return 'householdCount' in data && 'households' in data;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Module Context Map</h3>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Enter user ID to view cross-module context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Context Data Display */}
      {contextData && (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Cross-Module Context Overview</h4>
            </div>
            <div className="text-sm text-gray-600">
              <p>User ID: <span className="font-mono">{contextData.userId}</span></p>
              <p>Generated: {formatDate(contextData.timestamp)}</p>
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Drive Module */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getModuleColor('drive')}`}>
                  {getModuleIcon('drive')}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Drive</h5>
                  <p className="text-sm text-gray-600">File Management</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Files:</span>
                  <span className="font-medium">{contextData.modules.drive.fileCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Size:</span>
                  <span className="font-medium">{formatFileSize(contextData.modules.drive.totalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent Files:</span>
                  <span className="font-medium">{contextData.modules.drive.recentFiles.length}</span>
                </div>
              </div>
            </div>

            {/* Chat Module */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getModuleColor('chat')}`}>
                  {getModuleIcon('chat')}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Chat</h5>
                  <p className="text-sm text-gray-600">Communication</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversations:</span>
                  <span className="font-medium">{contextData.modules.chat.conversationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Chats:</span>
                  <span className="font-medium">{contextData.modules.chat.conversations.length}</span>
                </div>
              </div>
            </div>

            {/* Business Module */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getModuleColor('business')}`}>
                  {getModuleIcon('business')}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Business</h5>
                  <p className="text-sm text-gray-600">Enterprise</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Businesses:</span>
                  <span className="font-medium">{contextData.modules.business.businessCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memberships:</span>
                  <span className="font-medium">{contextData.modules.business.businesses.length}</span>
                </div>
              </div>
            </div>

            {/* Calendar Module */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getModuleColor('calendar')}`}>
                  {getModuleIcon('calendar')}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Calendar</h5>
                  <p className="text-sm text-gray-600">Scheduling</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Calendars:</span>
                  <span className="font-medium">{contextData.modules.calendar.calendarCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium">{contextData.modules.calendar.calendars.length}</span>
                </div>
              </div>
            </div>

            {/* Household Module */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getModuleColor('household')}`}>
                  {getModuleIcon('household')}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Household</h5>
                  <p className="text-sm text-gray-600">Family</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Households:</span>
                  <span className="font-medium">{contextData.modules.household.householdCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memberships:</span>
                  <span className="font-medium">{contextData.modules.household.households.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context Connections Visualization */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Context Connections
            </h4>
            
            {/* Simple connection visualization */}
            <div className="flex items-center justify-center space-x-8">
              {Object.entries(contextData.modules).map(([moduleName, moduleData], index) => (
                <div key={moduleName} className="flex flex-col items-center">
                  <div className={`p-3 rounded-full ${getModuleColor(moduleName)} mb-2`}>
                    {getModuleIcon(moduleName)}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 capitalize">{moduleName}</div>
                    <div className="text-xs text-gray-600">
                      {moduleName === 'drive' && isDriveModule(moduleData) && `${moduleData.fileCount} files`}
                      {moduleName === 'chat' && isChatModule(moduleData) && `${moduleData.conversationCount} chats`}
                      {moduleName === 'business' && isBusinessModule(moduleData) && `${moduleData.businessCount} businesses`}
                      {moduleName === 'calendar' && isCalendarModule(moduleData) && `${moduleData.calendarCount} calendars`}
                      {moduleName === 'household' && isHouseholdModule(moduleData) && `${moduleData.householdCount} households`}
                    </div>
                  </div>
                  {index < Object.keys(contextData.modules).length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Module Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Module Details</h4>
            
            {Object.entries(contextData.modules).map(([moduleName, moduleData]) => (
              <div key={moduleName} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${getModuleColor(moduleName)}`}>
                    {getModuleIcon(moduleName)}
                  </div>
                  <h5 className="font-semibold text-gray-900 capitalize">{moduleName} Module</h5>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {moduleName === 'drive' && isDriveModule(moduleData) && (
                    <>
                      <div>
                        <span className="text-gray-600">File Count:</span>
                        <span className="ml-2 font-medium">{moduleData.fileCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Size:</span>
                        <span className="ml-2 font-medium">{formatFileSize(moduleData.totalSize)}</span>
                      </div>
                    </>
                  )}
                  {moduleName === 'chat' && isChatModule(moduleData) && (
                    <>
                      <div>
                        <span className="text-gray-600">Conversation Count:</span>
                        <span className="ml-2 font-medium">{moduleData.conversationCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active Conversations:</span>
                        <span className="ml-2 font-medium">{moduleData.conversations.length}</span>
                      </div>
                    </>
                  )}
                  {moduleName === 'business' && isBusinessModule(moduleData) && (
                    <>
                      <div>
                        <span className="text-gray-600">Business Count:</span>
                        <span className="ml-2 font-medium">{moduleData.businessCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Memberships:</span>
                        <span className="ml-2 font-medium">{moduleData.businesses.length}</span>
                      </div>
                    </>
                  )}
                  {moduleName === 'calendar' && isCalendarModule(moduleData) && (
                    <>
                      <div>
                        <span className="text-gray-600">Calendar Count:</span>
                        <span className="ml-2 font-medium">{moduleData.calendarCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active Calendars:</span>
                        <span className="ml-2 font-medium">{moduleData.calendars.length}</span>
                      </div>
                    </>
                  )}
                  {moduleName === 'household' && isHouseholdModule(moduleData) && (
                    <>
                      <div>
                        <span className="text-gray-600">Household Count:</span>
                        <span className="ml-2 font-medium">{moduleData.householdCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Memberships:</span>
                        <span className="ml-2 font-medium">{moduleData.households.length}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
