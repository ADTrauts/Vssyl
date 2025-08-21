'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBusinessConfiguration } from '../../../../../contexts/BusinessConfigurationContext';
import { businessAPI } from '../../../../../api/business';
import { inviteEmployee, getBusinessInvitations, resendInvitation, cancelInvitation, updateEmployeeRole, removeEmployee, bulkInviteEmployees, bulkUpdateEmployeeRoles, bulkRemoveEmployees } from '../../../../../api/member';
import { Card, Button, Avatar, Badge, Spinner, Alert, Modal, ToastProvider } from 'shared/components';
import { BusinessBulkActionBar, BusinessBulkAction } from '../../../../../components/member/BusinessBulkActionBar';
import { BulkInviteModal } from '../../../../../components/member/BulkInviteModal';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Shield,
  UserPlus,
  Settings,
  Trash2
} from 'lucide-react';

interface BusinessMember {
  id: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
  title?: string;
  department?: string;
  canInvite: boolean;
  canManage: boolean;
  canBilling: boolean;
  joinedAt: string;
  lastActive?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Business {
  id: string;
  name: string;
  members: BusinessMember[];
}

interface BusinessInvitation {
  id: string;
  businessId: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  title: string | null;
  department: string | null;
  invitedBy: {
    name: string | null;
  };
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export default function BusinessMembersPage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params.id as string;
  const { configuration, loading: configLoading } = useBusinessConfiguration();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BusinessMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
    title: '',
    department: '',
    message: ''
  });
  const [inviting, setInviting] = useState(false);
  
  // Invitation management state
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'orgchart' | 'permissions'>('members');
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  
  // Role management state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingMember, setEditingMember] = useState<BusinessMember | null>(null);
  const [roleForm, setRoleForm] = useState({
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
    title: '',
    department: '',
    canInvite: false,
    canManage: false,
    canBilling: false
  });
  const [updatingRole, setUpdatingRole] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);

  // Bulk operations state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessData();
    }
  }, [businessId, session?.accessToken]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [businessResponse, membersResponse] = await Promise.all([
        businessAPI.getBusiness(businessId),
        businessAPI.getBusinessMembers(businessId)
      ]);

      if (businessResponse.success) {
        setBusiness(businessResponse.data);
      }

      if (membersResponse.success) {
        // Update business with members data
        setBusiness(prev => prev ? { ...prev, members: membersResponse.data } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const response = await getBusinessInvitations(businessId);
      setInvitations(response.invitations);
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Employee';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'MANAGER': return 'blue';
      case 'EMPLOYEE': return 'green';
      default: return 'gray';
    }
  };

  const filteredMembers = business?.members.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.title && member.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const currentUserMember = business?.members.find(member => member.user.id === session?.user?.id);
  const canInvite = currentUserMember?.canInvite || currentUserMember?.role === 'ADMIN';
  const canManage = currentUserMember?.canManage || currentUserMember?.role === 'ADMIN';

  const handleInviteSubmit = async () => {
    if (!inviteForm.email.trim()) {
      return;
    }

    try {
      setInviting(true);
      await inviteEmployee(
        businessId,
        inviteForm.email,
        inviteForm.role,
        inviteForm.title || undefined,
        inviteForm.department || undefined,
        inviteForm.message || undefined
      );

      // Reset form and close modal
      setInviteForm({
        email: '',
        role: 'EMPLOYEE',
        title: '',
        department: '',
        message: ''
      });
      setShowInviteModal(false);
      
      // Reload business data to show updated member count
      await loadBusinessData();
    } catch (error) {
      console.error('Error inviting employee:', error);
      // TODO: Show error toast
    } finally {
      setInviting(false);
    }
  };

  const handleInviteFormChange = (field: string, value: string) => {
    setInviteForm(prev => ({ ...prev, [field]: value }));
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      // Reload invitations to get updated data
      await loadInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId);
      // Reload invitations to get updated data
      await loadInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const handleTabChange = (tab: 'members' | 'invitations' | 'orgchart' | 'permissions') => {
    setActiveTab(tab);
    if (tab === 'invitations') {
      loadInvitations();
    }
  };

  const handleEditRole = (member: BusinessMember) => {
    setEditingMember(member);
    setRoleForm({
      role: member.role,
      title: member.title || '',
      department: member.department || '',
      canInvite: member.canInvite,
      canManage: member.canManage,
      canBilling: member.canBilling
    });
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!editingMember) return;

    try {
      setUpdatingRole(true);
      await updateEmployeeRole(
        editingMember.id,
        roleForm.role,
        roleForm.title || undefined,
        roleForm.department || undefined,
        roleForm.canInvite,
        roleForm.canManage,
        roleForm.canBilling
      );

      // Reload business data to get updated member information
      await loadBusinessData();
      setShowRoleModal(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error updating member role:', error);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemoveMember = async (member: BusinessMember) => {
    if (!confirm(`Are you sure you want to remove ${member.user.name} from the team?`)) {
      return;
    }

    try {
      setRemovingMember(true);
      await removeEmployee(member.id);
      
      // Reload business data
      await loadBusinessData();
      
      // Show success message
      alert('Member removed successfully');
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  // Bulk operation handlers
  const handleSelectMember = (memberId: string, selected: boolean) => {
    const newSelected = new Set(selectedMembers);
    if (selected) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    } else {
      setSelectedMembers(new Set());
    }
  };

  const handleBulkInvite = async (invitations: Array<{
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    title?: string;
    department?: string;
    message?: string;
  }>) => {
    try {
      setBulkLoading(true);
      const response = await bulkInviteEmployees(businessId, invitations);
      
      // Show results
      const successCount = response.results.filter(r => r.success).length;
      const failureCount = response.results.filter(r => !r.success).length;
      
      alert(`${response.message}\n\nSuccess: ${successCount}\nFailed: ${failureCount}`);
      
      // Reload invitations
      await loadInvitations();
      setShowBulkInviteModal(false);
    } catch (err) {
      console.error('Error bulk inviting:', err);
      alert('Failed to send bulk invitations');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedMembers.size === 0) return;
    
    const memberNames = filteredMembers
      .filter(m => selectedMembers.has(m.id))
      .map(m => m.user.name)
      .join(', ');
    
    if (!confirm(`Are you sure you want to remove ${selectedMembers.size} member(s): ${memberNames}?`)) {
      return;
    }

    try {
      setBulkLoading(true);
      const response = await bulkRemoveEmployees(businessId, Array.from(selectedMembers));
      
      // Show results
      const successCount = response.results.filter(r => r.success).length;
      const failureCount = response.results.filter(r => !r.success).length;
      
      alert(`${response.message}\n\nSuccess: ${successCount}\nFailed: ${failureCount}`);
      
      // Reload data and clear selection
      await loadBusinessData();
      setSelectedMembers(new Set());
    } catch (err) {
      console.error('Error bulk removing:', err);
      alert('Failed to remove members');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkRoleUpdate = async (role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN') => {
    if (selectedMembers.size === 0) return;
    
    const updates = Array.from(selectedMembers).map(memberId => ({
      memberId,
      role,
      title: undefined,
      department: undefined,
      canInvite: undefined,
      canManage: undefined,
      canBilling: undefined,
    }));

    try {
      setBulkLoading(true);
      const response = await bulkUpdateEmployeeRoles(businessId, updates);
      
      // Show results
      const successCount = response.results.filter(r => r.success).length;
      const failureCount = response.results.filter(r => !r.success).length;
      
      alert(`${response.message}\n\nSuccess: ${successCount}\nFailed: ${failureCount}`);
      
      // Reload data and clear selection
      await loadBusinessData();
      setSelectedMembers(new Set());
    } catch (err) {
      console.error('Error bulk updating roles:', err);
      alert('Failed to update member roles');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading Members">
          {error}
        </Alert>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <Alert type="error" title="Business Not Found">
          The business you're looking for doesn't exist or you don't have access to it.
        </Alert>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-2">
            Manage your team members, roles, and permissions
          </p>
        </div>
        {canInvite && (
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => setShowBulkInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Bulk Invite
            </Button>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Members ({business?.members.length || 0})
          </button>
          <button
            onClick={() => handleTabChange('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Invitations ({invitations.length})
          </button>
          <button
            onClick={() => handleTabChange('orgchart')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orgchart'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Org Chart
          </button>
          <button
            onClick={() => handleTabChange('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permissions
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'members' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{business.members.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {business.members.filter(m => m.role === 'ADMIN').length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Managers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {business.members.filter(m => m.role === 'MANAGER').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Employees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {business.members.filter(m => m.role === 'EMPLOYEE').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Members Tab Content */}
      {activeTab === 'members' && (
        <>
          {/* Filters */}
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="MANAGER">Managers</option>
                  <option value="EMPLOYEE">Employees</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Bulk Action Bar */}
          {selectedMembers.size > 0 && (
            <BusinessBulkActionBar
              selectedCount={selectedMembers.size}
              totalCount={filteredMembers.length}
              actions={[
                {
                  id: 'remove',
                  label: `Remove (${selectedMembers.size})`,
                  icon: Trash2,
                  variant: 'secondary',
                  onClick: handleBulkRemove,
                  disabled: bulkLoading
                },
                {
                  id: 'role-employee',
                  label: 'Set as Employee',
                  icon: Users,
                  variant: 'secondary',
                  onClick: () => handleBulkRoleUpdate('EMPLOYEE'),
                  disabled: bulkLoading
                },
                {
                  id: 'role-manager',
                  label: 'Set as Manager',
                  icon: Settings,
                  variant: 'secondary',
                  onClick: () => handleBulkRoleUpdate('MANAGER'),
                  disabled: bulkLoading
                },
                {
                  id: 'role-admin',
                  label: 'Set as Admin',
                  icon: Shield,
                  variant: 'secondary',
                  onClick: () => handleBulkRoleUpdate('ADMIN'),
                  disabled: bulkLoading
                }
              ]}
              onClearSelection={() => setSelectedMembers(new Set())}
              className="mb-4"
            />
          )}

          {/* Members List */}
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      <input
                        type="checkbox"
                        checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Member</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Active</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.id)}
                          onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            src={member.user.name} 
                            alt={member.user.name}
                            size={40}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{member.user.name}</p>
                            <p className="text-sm text-gray-500">{member.user.email}</p>
                            {member.title && (
                              <p className="text-xs text-gray-400">{member.title}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge color={getRoleColor(member.role)}>
                          {getRoleDisplayName(member.role)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {member.department || '-'}
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowMemberModal(true);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No members found matching your criteria</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Invitations Tab Content */}
      {activeTab === 'invitations' && (
        <Card className="p-6">
          {loadingInvitations ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Invited By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sent</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Expires</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => {
                    const isExpired = new Date(invitation.expiresAt) < new Date();
                    return (
                      <tr key={invitation.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{invitation.email}</p>
                            {invitation.department && (
                              <p className="text-sm text-gray-500">{invitation.department}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge color={getRoleColor(invitation.role)}>
                            {getRoleDisplayName(invitation.role)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {invitation.title || '-'}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {invitation.invitedBy.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <Badge color="red">Expired</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {!isExpired && (
                              <Button
                                variant="secondary"
                                onClick={() => handleResendInvitation(invitation.id)}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Resend
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loadingInvitations && invitations.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending invitations</p>
              <p className="text-sm text-gray-400 mt-2">
                Invite new members to see them appear here
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Org Chart Tab Content */}
      {activeTab === 'orgchart' && (
        <div className="space-y-6">
          {/* Org Chart Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Departments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.orgChart?.departments?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Positions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.orgChart?.positions?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Org Tiers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.orgChart?.tiers?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.orgChart?.employeePositions?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Org Chart Content */}
          <Card className="p-6">
            {configLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size={32} />
                <p className="ml-3 text-gray-600">Loading organizational data...</p>
              </div>
            ) : configuration?.orgChart && (
              configuration.orgChart.departments.length > 0 || 
              configuration.orgChart.positions.length > 0 || 
              configuration.orgChart.tiers.length > 0
            ) ? (
              <div className="space-y-6">
                {/* Departments */}
                {configuration.orgChart.departments.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Departments</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {configuration.orgChart.departments.map((dept) => (
                        <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900">{dept.name}</h5>
                          {dept.description && (
                            <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Manager: {dept.managerId || 'Unassigned'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizational Tiers */}
                {configuration.orgChart.tiers.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Organizational Tiers</h4>
                    <div className="space-y-2">
                      {configuration.orgChart.tiers
                        .sort((a, b) => a.level - b.level)
                        .map((tier) => (
                        <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">
                                Level {tier.level}: {tier.name}
                              </h5>
                              {tier.description && (
                                <p className="text-sm text-gray-600">{tier.description}</p>
                              )}
                            </div>
                            <Badge color="blue">Level {tier.level}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employee Assignments */}
                {configuration.orgChart.employeePositions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Position Assignments</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Employee</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Position</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Start Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configuration.orgChart.employeePositions.map((assignment) => (
                            <tr key={assignment.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Avatar size={32} src={assignment.user?.name} alt={assignment.user?.name || 'User'} />
                                  <div>
                                    <p className="font-medium text-gray-900">{assignment.user?.name || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{assignment.user?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{assignment.position?.title}</p>
                                  <p className="text-sm text-gray-500">Level {assignment.position?.tier?.level}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {assignment.position?.department?.name || '-'}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizational Data</h3>
                <p className="text-gray-500 mb-6">
                  Your organizational chart is empty. Set up departments, positions, and assignments to get started.
                </p>
                <div className="text-left max-w-md mx-auto space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Get started:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Create organizational tiers (C-Suite, Management, Staff)</li>
                      <li>• Set up departments (Sales, Engineering, HR)</li>
                      <li>• Define positions within departments</li>
                      <li>• Assign employees to positions</li>
                    </ul>
                  </div>
                </div>
                <Button variant="secondary" className="mt-6" disabled>
                  Create Org Chart
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Permissions Tab Content */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Permission Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Module Permissions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.modulePermissions ? Object.keys(configuration.modulePermissions).length : 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Position Rules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.positionPermissions ? Object.keys(configuration.positionPermissions).length : 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Department Access</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {configuration?.departmentModules ? Object.keys(configuration.departmentModules).length : 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Permission Details */}
          <Card className="p-6">
            {configLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size={32} />
                <p className="ml-3 text-gray-600">Loading permission data...</p>
              </div>
            ) : configuration ? (
              <div className="space-y-8">
                {/* Module Permissions */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Module Permissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(configuration.modulePermissions || {}).map(([moduleId, permissions]) => (
                      <div key={moduleId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 capitalize">{moduleId}</h5>
                          <Badge color="blue">{permissions.length} permissions</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {permissions.map((perm) => (
                            <Badge key={perm} color="gray" size="sm">{perm}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Permissions */}
                {configuration.permissions && configuration.permissions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Available Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {configuration.permissions.map((permission) => (
                        <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{permission.name}</h5>
                            <Badge color="green">{permission.moduleId}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Roles */}
                {configuration.roles && configuration.roles.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Business Roles</h4>
                    <div className="space-y-3">
                      {configuration.roles.map((role) => (
                        <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900">{role.name}</h5>
                              <p className="text-sm text-gray-600">{role.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge color="purple">{role.level}</Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {role.permissions.length} permissions
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((perm) => (
                              <Badge key={perm} color="gray" size="sm">{perm}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Position-based Module Access */}
                {configuration.enabledModules && configuration.enabledModules.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Enabled Business Modules</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {configuration.enabledModules.map((module) => (
                        <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{module.name}</h5>
                            <Badge color={module.status === 'enabled' ? 'green' : 'gray'}>
                              {module.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {module.permissions.map((perm) => (
                              <Badge key={perm} color="blue" size="sm">{perm}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Permission Data</h3>
                <p className="text-gray-500 mb-6">
                  Permission system is not configured yet. Set up roles, positions, and module access to get started.
                </p>
                <div className="text-left max-w-md mx-auto space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Features:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Position-based permissions</li>
                      <li>• Department-level access</li>
                      <li>• Module access control</li>
                      <li>• Custom permission sets</li>
                    </ul>
                  </div>
                </div>
                <Button variant="secondary" className="mt-6" disabled>
                  Manage Permissions
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <Modal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite New Member"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteForm.email}
                onChange={(e) => handleInviteFormChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select 
                value={inviteForm.role}
                onChange={(e) => handleInviteFormChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="Software Engineer"
                value={inviteForm.title}
                onChange={(e) => handleInviteFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <input
                type="text"
                placeholder="Engineering"
                value={inviteForm.department}
                onChange={(e) => handleInviteFormChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (Optional)
              </label>
              <textarea
                placeholder="Personal message to include with the invitation..."
                value={inviteForm.message}
                onChange={(e) => handleInviteFormChange('message', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowInviteModal(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInviteSubmit}
                disabled={inviting || !inviteForm.email.trim()}
              >
                {inviting ? <Spinner size={16} /> : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Member Details Modal */}
      {showMemberModal && selectedMember && (
        <Modal
          open={showMemberModal}
          onClose={() => setShowMemberModal(false)}
          title="Member Details"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar 
                src={selectedMember.user.name} 
                alt={selectedMember.user.name}
                size={48}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedMember.user.name}</h3>
                <p className="text-gray-500">{selectedMember.user.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <Badge color={getRoleColor(selectedMember.role)}>
                  {getRoleDisplayName(selectedMember.role)}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{selectedMember.title || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-900">{selectedMember.department || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
                <p className="text-gray-900">{new Date(selectedMember.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Permissions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Can invite members</span>
                  <Badge color={selectedMember.canInvite ? 'green' : 'gray'}>
                    {selectedMember.canInvite ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Can manage team</span>
                  <Badge color={selectedMember.canManage ? 'green' : 'gray'}>
                    {selectedMember.canManage ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Can manage billing</span>
                  <Badge color={selectedMember.canBilling ? 'green' : 'gray'}>
                    {selectedMember.canBilling ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setShowMemberModal(false)}>
                Close
              </Button>
              {canManage && selectedMember && selectedMember.user.id !== session?.user?.id && (
                <>
                  <Button 
                    variant="secondary"
                    onClick={() => handleEditRole(selectedMember)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Role
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => handleRemoveMember(selectedMember)}
                    disabled={removingMember}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {removingMember ? 'Removing...' : 'Remove'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {showRoleModal && editingMember && (
        <Modal
          open={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title="Edit Member Role"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar 
                src={editingMember.user.name} 
                alt={editingMember.user.name}
                size={40}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{editingMember.user.name}</h3>
                <p className="text-gray-500">{editingMember.user.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select 
                value={roleForm.role}
                onChange={(e) => setRoleForm(prev => ({ ...prev, role: e.target.value as 'EMPLOYEE' | 'MANAGER' | 'ADMIN' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="Software Engineer"
                value={roleForm.title}
                onChange={(e) => setRoleForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <input
                type="text"
                placeholder="Engineering"
                value={roleForm.department}
                onChange={(e) => setRoleForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Permissions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Can invite members</label>
                    <p className="text-xs text-gray-500">Allow this member to send invitations to new team members</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={roleForm.canInvite}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, canInvite: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Can manage team</label>
                    <p className="text-xs text-gray-500">Allow this member to edit roles and remove team members</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={roleForm.canManage}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, canManage: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Can manage billing</label>
                    <p className="text-xs text-gray-500">Allow this member to access and modify billing settings</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={roleForm.canBilling}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, canBilling: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowRoleModal(false)}
                disabled={updatingRole}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={updatingRole}
              >
                {updatingRole ? <Spinner size={16} /> : 'Update Role'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

        {/* Bulk Invite Modal */}
        <BulkInviteModal
          isOpen={showBulkInviteModal}
          onClose={() => setShowBulkInviteModal(false)}
          onSubmit={handleBulkInvite}
          loading={bulkLoading}
        />
      </div>
    </ToastProvider>
  );
} 