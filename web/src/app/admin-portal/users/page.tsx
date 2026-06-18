'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, ConfirmModal } from 'shared/components';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Shield, 
  RefreshCw,
  Eye,
  User
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';
import { useImpersonation } from '../../../contexts/ImpersonationContext';

interface User {
  id: string;
  email: string;
  name: string;
  userNumber: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  _count?: {
    businesses: number;
    files: number;
  };
}

export default function UserManagement() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [impersonateReason, setImpersonateReason] = useState('');

  const { startImpersonation } = useImpersonation();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      loadUsers();
    }
  }, [status, session, currentPage, searchTerm, selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApiService.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const dataAny: any = response.data as any;
      const usersList = Array.isArray(dataAny?.users) ? dataAny.users : Array.isArray(dataAny) ? dataAny : [];
      setUsers(usersList);
      setTotalPages(typeof dataAny?.totalPages === 'number' ? dataAny.totalPages : 1);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user: User) => {
    setSelectedUser(user);
    setShowImpersonateModal(true);
  };

  const confirmImpersonate = async () => {
    if (!selectedUser) return;

    try {
      const success = await startImpersonation(selectedUser.id, impersonateReason);
      if (success) {
        setShowImpersonateModal(false);
        setSelectedUser(null);
        setImpersonateReason('');
        // The impersonation banner will automatically show
      } else {
        alert('Failed to start impersonation');
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      alert('Failed to start impersonation');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'USER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-v-surface-muted text-gray-800';
    }
  };

  const getStatusColor = (verified: boolean) => {
    return verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-v-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Authentication Required</div>
          <p className="text-v-text-secondary">Please log in to access user management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-v-text-secondary">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-v-text-primary">User Management</h1>
          <p className="text-v-text-secondary mt-2">Manage platform users and permissions</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-v-text-primary">User Management</h1>
        <p className="text-v-text-secondary mt-2">Manage platform users and permissions</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-v-text-muted dark:text-v-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by email, name, or Vssyl ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-v-border bg-v-surface bg-v-surface text-v-text-primary placeholder:text-v-text-muted dark:text-v-text-muted dark:placeholder:text-v-text-muted rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-v-border bg-v-surface bg-v-surface text-v-text-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-v-border">
                <th className="text-left py-3 px-4 font-medium text-v-text-primary">User</th>
                <th className="text-left py-3 px-4 font-medium text-v-text-primary">Vssyl ID</th>
                <th className="text-left py-3 px-4 font-medium text-v-text-primary">Role</th>
                <th className="text-left py-3 px-4 font-medium text-v-text-primary">Status</th>
                <th className="text-left py-3 px-4 font-medium text-v-text-primary">Activity</th>
                <th className="text-left py-3 px-4 font-medium text-v-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-v-surface-muted bg-v-surface">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-v-text-primary">{user.name || 'No name'}</div>
                      <div className="text-sm text-v-text-muted">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <code className="text-sm bg-v-surface-muted bg-v-surface-muted text-v-text-primary px-2 py-1 rounded">{user.userNumber}</code>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.emailVerified)}`}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-v-text-secondary">
                      <div>{user._count?.businesses || 0} businesses</div>
                      <div>{user._count?.files || 0} files</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleImpersonate(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Impersonate User"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-v-text-secondary hover:bg-v-surface-muted bg-v-surface hover:bg-v-surface-muted rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-v-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-v-border bg-v-surface bg-v-surface text-v-text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-v-border bg-v-surface bg-v-surface text-v-text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={showImpersonateModal && !!selectedUser}
        onClose={() => {
          setShowImpersonateModal(false);
          setSelectedUser(null);
          setImpersonateReason('');
        }}
        onConfirm={confirmImpersonate}
        title="Impersonate user"
        description={
          selectedUser ? (
            <div className="space-y-3">
              <p className="text-sm text-v-text-secondary">
                You are about to impersonate{' '}
                <strong>{selectedUser.name || selectedUser.email}</strong> ({selectedUser.email}).
              </p>
              <label className="block text-sm font-medium text-v-text-secondary">
                Reason (optional)
                <textarea
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  placeholder="e.g., Debugging user issue, Customer support..."
                  className="mt-1 w-full px-3 py-2 border border-v-border bg-v-surface text-v-text-primary rounded-lg"
                  rows={3}
                />
              </label>
            </div>
          ) : null
        }
        variant="standard"
        confirmLabel="Start impersonation"
      />
    </div>
  );
} 