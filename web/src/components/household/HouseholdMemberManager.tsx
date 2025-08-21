'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User, 
  Baby, 
  Clock, 
  Mail,
  MoreHorizontal,
  Trash2,
  Edit3,
  Calendar,
  X
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert, Modal, Avatar } from 'shared/components';
import { 
  getHousehold, 
  inviteMember, 
  updateMemberRole, 
  removeMember,
  Household, 
  HouseholdMember, 
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  getRoleDisplayName,
  getRoleColor
} from '../../api/household';
import { HouseholdRole } from '@prisma/client';
import { formatRelativeTime } from '../../utils/format';
import { toast } from 'react-hot-toast';

interface HouseholdMemberManagerProps {
  householdId: string;
}

interface InviteModalState {
  isOpen: boolean;
  email: string;
  role: HouseholdRole;
  expiresAt: string;
  isGuest: boolean;
}

interface RoleEditModalState {
  isOpen: boolean;
  member: HouseholdMember | null;
  newRole: HouseholdRole;
  newExpiresAt: string;
}

const defaultInviteState: InviteModalState = {
  isOpen: false,
  email: '',
  role: 'ADULT',
  expiresAt: '',
  isGuest: false
};

const defaultRoleEditState: RoleEditModalState = {
  isOpen: false,
  member: null,
  newRole: 'ADULT',
  newExpiresAt: ''
};

export default function HouseholdMemberManager({ householdId }: HouseholdMemberManagerProps) {
  const { data: session } = useSession();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<InviteModalState>(defaultInviteState);
  const [roleEditModal, setRoleEditModal] = useState<RoleEditModalState>(defaultRoleEditState);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load household data
  const loadHousehold = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      const householdData = await getHousehold(session.accessToken, householdId);
      setHousehold(householdData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load household');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHousehold();
  }, [session?.accessToken, householdId]);

  // Get current user's role
  const getCurrentUserRole = (): HouseholdRole | null => {
    if (!household || !session?.user?.id) return null;
    const member = household.members.find(m => m.userId === session.user.id);
    return member?.role || null;
  };

  // Check if current user can manage members
  const canManageMembers = (): boolean => {
    const role = getCurrentUserRole();
    return role === 'OWNER' || role === 'ADMIN';
  };

  // Get role icon
  const getRoleIcon = (role: HouseholdRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'ADULT':
        return <User className="w-4 h-4" />;
      case 'TEEN':
        return <User className="w-4 h-4" />;
      case 'CHILD':
        return <Baby className="w-4 h-4" />;
      case 'TEMPORARY_GUEST':
        return <Clock className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Handle member invitation
  const handleInvite = async () => {
    if (!session?.accessToken || !inviteModal.email.trim()) return;

    try {
      setActionLoading('invite');
      
      const inviteData: InviteMemberRequest = {
        email: inviteModal.email.trim(),
        role: inviteModal.role,
        ...(inviteModal.isGuest && inviteModal.expiresAt ? { expiresAt: inviteModal.expiresAt } : {})
      };

      await inviteMember(session.accessToken, householdId, inviteData);
      toast.success('Member invited successfully');
      setInviteModal(defaultInviteState);
      loadHousehold(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle role update
  const handleRoleUpdate = async () => {
    if (!session?.accessToken || !roleEditModal.member) return;

    try {
      setActionLoading('role-update');
      
      const updateData: UpdateMemberRoleRequest = {
        role: roleEditModal.newRole,
        ...(roleEditModal.newExpiresAt ? { expiresAt: roleEditModal.newExpiresAt } : {})
      };

      await updateMemberRole(session.accessToken, householdId, roleEditModal.member.userId, updateData);
      toast.success('Member role updated successfully');
      setRoleEditModal(defaultRoleEditState);
      loadHousehold(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update member role');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (member: HouseholdMember) => {
    if (!session?.accessToken) return;
    
    const confirmMessage = member.userId === session.user?.id 
      ? 'Are you sure you want to leave this household?'
      : `Are you sure you want to remove ${member.user.name || member.user.email} from this household?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      setActionLoading(`remove-${member.id}`);
      await removeMember(session.accessToken, householdId, member.userId);
      toast.success('Member removed successfully');
      loadHousehold(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner size={24} />
          <span className="ml-2 text-gray-600">Loading household members...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert type="error" title="Error loading household">
          {error}
          <Button
            size="sm"
            onClick={loadHousehold}
            className="mt-2"
          >
            Try Again
          </Button>
        </Alert>
      </Card>
    );
  }

  if (!household) {
    return (
      <Card className="p-6">
        <Alert type="error" title="Household not found">
          The requested household could not be found.
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{household.name}</h2>
              <p className="text-sm text-gray-500">
                {household.members.length} member{household.members.length !== 1 ? 's' : ''}
                {household.isPrimary && (
                  <Badge size="sm" color="blue" className="ml-2">Primary</Badge>
                )}
              </p>
            </div>
          </div>
          
          {canManageMembers() && (
            <Button
              onClick={() => setInviteModal({ ...defaultInviteState, isOpen: true })}
              className="flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>

        {household.description && (
          <p className="text-gray-600 mb-4">{household.description}</p>
        )}
      </Card>

      {/* Members List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
        
        <div className="space-y-3">
          {household.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  size={40}
                  nameOrEmail={member.user.name || member.user.email}
                  className="bg-orange-100 text-orange-600"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {member.user.name || member.user.email}
                    </span>
                    {member.userId === session?.user?.id && (
                      <Badge size="sm" color="blue">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span>{member.user.email}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                    <span>Joined {formatRelativeTime(member.joinedAt)}</span>
                    {member.expiresAt && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Expires {formatRelativeTime(member.expiresAt)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge
                  size="sm"
                  color={getRoleColor(member.role)}
                  className="flex items-center space-x-1"
                >
                  {getRoleIcon(member.role)}
                  <span>{getRoleDisplayName(member.role)}</span>
                </Badge>

                {canManageMembers() && member.role !== 'OWNER' && (
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRoleEditModal({
                        isOpen: true,
                        member,
                        newRole: member.role,
                        newExpiresAt: member.expiresAt || ''
                      })}
                      disabled={actionLoading === `role-update`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member)}
                      disabled={actionLoading === `remove-${member.id}`}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === `remove-${member.id}` ? (
                        <Spinner size={16} />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Allow users to remove themselves */}
                {member.userId === session?.user?.id && member.role !== 'OWNER' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMember(member)}
                    disabled={actionLoading === `remove-${member.id}`}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading === `remove-${member.id}` ? (
                      <Spinner size={16} />
                    ) : (
                      <span className="text-xs">Leave</span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        open={inviteModal.isOpen}
        onClose={() => setInviteModal(defaultInviteState)}
        title="Invite Member"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={inviteModal.email}
              onChange={(e) => setInviteModal({ ...inviteModal, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter email address..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={inviteModal.role}
              onChange={(e) => {
                const role = e.target.value as HouseholdRole;
                setInviteModal({ 
                  ...inviteModal, 
                  role,
                  isGuest: role === 'TEMPORARY_GUEST'
                });
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ADULT">Adult</option>
              <option value="TEEN">Teen</option>
              <option value="CHILD">Child</option>
              <option value="TEMPORARY_GUEST">Temporary Guest</option>
              {getCurrentUserRole() === 'OWNER' && (
                <option value="ADMIN">Admin</option>
              )}
            </select>
          </div>

          {inviteModal.isGuest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Expires (Optional)
              </label>
              <input
                type="datetime-local"
                value={inviteModal.expiresAt}
                onChange={(e) => setInviteModal({ ...inviteModal, expiresAt: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setInviteModal(defaultInviteState)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteModal.email.trim() || actionLoading === 'invite'}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {actionLoading === 'invite' ? (
                <Spinner size={16} />
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Role Edit Modal */}
      <Modal
        open={roleEditModal.isOpen}
        onClose={() => setRoleEditModal(defaultRoleEditState)}
        title="Update Member Role"
        size="medium"
      >
        {roleEditModal.member && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar
                  size={40}
                  nameOrEmail={roleEditModal.member.user.name || roleEditModal.member.user.email}
                  className="bg-orange-100 text-orange-600"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    {roleEditModal.member.user.name || roleEditModal.member.user.email}
                  </span>
                  <div className="text-sm text-gray-500">{roleEditModal.member.user.email}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                value={roleEditModal.newRole}
                onChange={(e) => {
                  const role = e.target.value as HouseholdRole;
                  setRoleEditModal({ 
                    ...roleEditModal, 
                    newRole: role
                  });
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="ADULT">Adult</option>
                <option value="TEEN">Teen</option>
                <option value="CHILD">Child</option>
                <option value="TEMPORARY_GUEST">Temporary Guest</option>
                {getCurrentUserRole() === 'OWNER' && (
                  <option value="ADMIN">Admin</option>
                )}
              </select>
            </div>

            {roleEditModal.newRole === 'TEMPORARY_GUEST' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Expires (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={roleEditModal.newExpiresAt}
                  onChange={(e) => setRoleEditModal({ ...roleEditModal, newExpiresAt: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setRoleEditModal(defaultRoleEditState)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRoleUpdate}
                disabled={actionLoading === 'role-update'}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {actionLoading === 'role-update' ? (
                  <Spinner size={16} />
                ) : (
                  'Update Role'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 