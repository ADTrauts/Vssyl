'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, User, Mail, Calendar, Brain, Settings, Activity, Building, Package } from 'lucide-react';
import { getAIContext, AIContext } from '../../api/aiContextDebug';

interface UserContextInspectorProps {
  className?: string;
}

export default function UserContextInspector({ className = '' }: UserContextInspectorProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AIContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAIContext(searchQuery, session.accessToken);
      if (response.success) {
        setSelectedUser(response.data);
      } else {
        setError('Failed to fetch user context');
      }
    } catch (err) {
      setError('Error fetching user context');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Context Inspector</h3>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by user ID, email, or name..."
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

      {/* User Context Display */}
      {selectedUser && (
        <div className="p-6 space-y-6">
          {/* User Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">User Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{selectedUser.user.name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{selectedUser.user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">User Number:</span>
                <span className="ml-2 font-medium">{selectedUser.user.userNumber || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium">{formatDate(selectedUser.user.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2 font-medium">{formatDate(selectedUser.user.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* AI Profile Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">AI Personality Profile</h4>
              </div>
              <div className="text-sm">
                <p className="text-gray-600">
                  Status: <span className={`font-medium ${selectedUser.personalityProfile ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.personalityProfile ? 'Active' : 'Not configured'}
                  </span>
                </p>
                {selectedUser.personalityProfile && (
                  <p className="text-gray-600 mt-1">
                    Last Updated: {formatDate(selectedUser.personalityProfile.lastUpdated)}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">AI Autonomy Settings</h4>
              </div>
              <div className="text-sm">
                <p className="text-gray-600">
                  Status: <span className={`font-medium ${selectedUser.autonomySettings ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.autonomySettings ? 'Configured' : 'Not configured'}
                  </span>
                </p>
                {selectedUser.autonomySettings && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Scheduling:</span>
                      <span>{selectedUser.autonomySettings.scheduling}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Communication:</span>
                      <span>{selectedUser.autonomySettings.communication}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Recent AI Conversations</h4>
              <span className="text-sm text-gray-500">({selectedUser.recentConversations.length} recent)</span>
            </div>
            
            {selectedUser.recentConversations.length > 0 ? (
              <div className="space-y-3">
                {selectedUser.recentConversations.slice(0, 5).map((conversation) => (
                  <div key={conversation.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {conversation.userQuery}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(conversation.confidence)}`}>
                        {Math.round(conversation.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {conversation.aiResponse}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{conversation.interactionType}</span>
                      <span>{formatDate(conversation.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent conversations found</p>
            )}
          </div>

          {/* Module Installations */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Installed Modules</h4>
              <span className="text-sm text-gray-500">({selectedUser.moduleInstallations.length})</span>
            </div>
            
            {selectedUser.moduleInstallations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedUser.moduleInstallations.map((installation) => (
                  <div key={installation.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{installation.module.name}</p>
                      <p className="text-xs text-gray-500">{installation.module.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No modules installed</p>
            )}
          </div>

          {/* Business Memberships */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Business Memberships</h4>
              <span className="text-sm text-gray-500">({selectedUser.businessMemberships.length})</span>
            </div>
            
            {selectedUser.businessMemberships.length > 0 ? (
              <div className="space-y-2">
                {selectedUser.businessMemberships.map((membership) => (
                  <div key={membership.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{membership.business.name}</p>
                      <p className="text-xs text-gray-500">{membership.business.industry || 'No industry specified'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No business memberships</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Recent Activity</h4>
              <span className="text-sm text-gray-500">({selectedUser.recentActivity.length} recent)</span>
            </div>
            
            {selectedUser.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {selectedUser.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent activity found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
