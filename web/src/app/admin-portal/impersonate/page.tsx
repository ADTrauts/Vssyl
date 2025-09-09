'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Input, Alert, Spinner } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import { useImpersonation } from '../../../contexts/ImpersonationContext';
import { 
  Users, 
  Search, 
  Eye, 
  User, 
  Mail, 
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  Monitor,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  emailVerified: string | null;
  _count?: {
    businesses: number;
    files: number;
  };
}

interface ImpersonationSession {
  id: string;
  targetUser: {
    id: string;
    email: string;
    name: string;
  };
  startedAt: string;
  reason: string;
}

export default function ImpersonatePage() {
  const { startImpersonation, endImpersonation, isImpersonating, currentSession } = useImpersonation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [userDashboardUrl, setUserDashboardUrl] = useState('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApiService.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      const data = response.data as any;
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [currentPage, loadUsers]);

  useEffect(() => {
    console.log('Modal state changed:', showConfirmModal);
  }, [showConfirmModal]);

  // Real-time timer for impersonation duration
  useEffect(() => {
    if (isImpersonating && currentSession) {
      const startTime = new Date(currentSession.startedAt).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      // Update immediately
      updateTimer();
      
      // Then update every second
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      setElapsedTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isImpersonating, currentSession]);

  

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleImpersonate = async (user: User) => {
    console.log('Impersonate button clicked for user:', user);
    setSelectedUser(user);
    setShowConfirmModal(true);
    console.log('Modal should now be open:', true);
  };

  const confirmImpersonation = async () => {
    if (!selectedUser) return;

    try {
      setImpersonating(true);
      setError(null);

      const success = await startImpersonation(
        selectedUser.id, 
        `Admin impersonation for user management - ${selectedUser.email}`
      );

      if (success) {
        // Instead of redirecting, show the user dashboard in an embedded view
        setUserDashboardUrl(`/dashboard?impersonated=true&userId=${selectedUser.id}`);
        setShowUserDashboard(true);
        setShowConfirmModal(false);
        setSelectedUser(null);
      } else {
        setError('Failed to start impersonation');
      }
    } catch (err) {
      setError('Failed to start impersonation');
      console.error('Impersonation error:', err);
    } finally {
      setImpersonating(false);
    }
  };

  const handleEndImpersonation = async () => {
    try {
      const success = await endImpersonation();
      if (success) {
        setShowUserDashboard(false);
        setUserDashboardUrl('');
        setElapsedTime(0);
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        setError('Failed to end impersonation');
      }
    } catch (err) {
      setError('Failed to end impersonation');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If showing user dashboard, render the embedded view
  if (showUserDashboard && isImpersonating && currentSession) {
    return (
      <div className="h-screen flex flex-col">
        {/* Admin Header Bar */}
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Admin Impersonation Active</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-yellow-800">
                <Clock className="w-4 h-4" />
                <span>Duration: {formatDuration(elapsedTime)}</span>
              </div>
              <div className="text-sm text-yellow-800">
                Viewing as: <strong>{currentSession.targetUser.name}</strong> ({currentSession.targetUser.email})
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowUserDashboard(false)}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Exit View</span>
              </Button>
              <Button
                onClick={handleEndImpersonation}
                variant="primary"
                size="sm"
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                <span>End Impersonation</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Embedded User Dashboard */}
        <div className="flex-1 relative">
          <iframe
            src={userDashboardUrl}
            className="w-full h-full border-0"
            title="User Dashboard"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin-portal" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Impersonation</h1>
            <p className="text-gray-600">Select a user to impersonate for debugging and support</p>
          </div>
        </div>
        {isImpersonating && (
          <Button
            onClick={handleEndImpersonation}
            variant="primary"
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <XCircle className="w-4 h-4" />
            <span>End Impersonation</span>
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {isImpersonating && currentSession && (
        <Alert 
          type="warning" 
          title="Currently Impersonating"
        >
          You are currently impersonating {currentSession.targetUser.name} ({currentSession.targetUser.email}) - Duration: {formatDuration(elapsedTime)}
        </Alert>
      )}

      {/* Search */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Button>
        </div>
      </Card>

      {/* Users List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <span className="text-sm text-gray-600">{users.length} users found</span>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{user.email}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span className="capitalize">{user.role}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span>{user._count?.businesses || 0} businesses</span>
                    <span>{user._count?.files || 0} files</span>
                    {user.emailVerified && (
                      <span className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleImpersonate(user)}
                  disabled={isImpersonating}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Monitor className="w-4 h-4" />
                  <span>View Dashboard</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">View User Dashboard</h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Embedded View</h3>
                  </div>
                  <p className="text-sm text-blue-800 mt-2">
                    You will view this user's dashboard within the admin portal. You can exit the view at any time without ending the impersonation session.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">User Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>Role:</strong> {selectedUser.role}</div>
                    <div><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</div>
                    <div><strong>Businesses:</strong> {selectedUser._count?.businesses || 0}</div>
                    <div><strong>Files:</strong> {selectedUser._count?.files || 0}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={() => setShowConfirmModal(false)}
                    variant="secondary"
                    disabled={impersonating}
                  >
                    Cancel
                  </Button>
                                  <Button
                  onClick={confirmImpersonation}
                  disabled={impersonating}
                  size="md"
                  className="flex items-center space-x-2"
                >
                    {impersonating ? (
                      <Spinner size={16} />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                    <span>{impersonating ? 'Starting...' : 'View Dashboard'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
