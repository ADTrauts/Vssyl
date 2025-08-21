'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'shared/components';
import { User, Eye, X, Clock, AlertTriangle } from 'lucide-react';
import { useImpersonation } from '../../../contexts/ImpersonationContext';
import { adminApiService } from '../../../lib/adminApiService';

export default function ImpersonationTest() {
  const { isImpersonating, currentSession, startImpersonation, endImpersonation } = useImpersonation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminApiService.getUsers({ limit: 10 });
      if (response.data) {
        const dataAny: any = response.data as any;
        const usersList = Array.isArray(dataAny.users) ? dataAny.users : Array.isArray(dataAny) ? dataAny : [];
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user: any) => {
    const success = await startImpersonation(user.id, 'Testing impersonation functionality');
    if (success) {
      alert('Impersonation started successfully! Check the banner at the top.');
    } else {
      alert('Failed to start impersonation');
    }
  };

  const handleEndImpersonation = async () => {
    const success = await endImpersonation();
    if (success) {
      alert('Impersonation ended successfully!');
    } else {
      alert('Failed to end impersonation');
    }
  };

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impersonation Test</h1>
        <p className="text-gray-600 mt-2">Test the user impersonation functionality</p>
      </div>

      {/* Current Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
        {isImpersonating && currentSession ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Currently Impersonating</h3>
                <p className="text-sm text-yellow-700">
                  {currentSession.targetUser.name} ({currentSession.targetUser.email})
                </p>
                {currentSession.duration && (
                  <p className="text-sm text-yellow-700">
                    Duration: {formatDuration(currentSession.duration)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleEndImpersonation}
              className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>End Impersonation</span>
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Not Impersonating</h3>
                <p className="text-sm text-green-700">You are logged in as yourself</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* User List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Users</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium">{user.name || 'No name'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-xs text-gray-400">Block ID: {user.userNumber}</div>
              </div>
              <button
                onClick={() => handleImpersonate(user)}
                disabled={isImpersonating}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Impersonate</span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Test</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>1. Start Impersonation:</strong> Click the "Impersonate" button next to any user
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>2. Check Banner:</strong> A yellow banner should appear at the top of the admin portal
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>3. End Impersonation:</strong> Click "End Impersonation" in the banner or on this page
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>4. Check Audit Logs:</strong> All impersonation actions are logged in the audit system
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 