'use client';

import { useState } from 'react';
import { Card, Button, Avatar, Badge, Toast, Spinner, Input } from 'shared/components';
import { businessAPI } from '@/api/business';

interface Member {
  id: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
  title?: string;
  department?: string;
  canInvite: boolean;
  canManage: boolean;
  canBilling: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface MemberManagementProps {
  businessId: string;
  members: Member[];
  currentUserId?: string;
  canManage: boolean;
  onMemberUpdate: () => void;
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employee' }
];

// Create a simple FormGroup component
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

export function MemberManagement({ businessId, members, currentUserId, canManage, onMemberUpdate }: MemberManagementProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [role, setRole] = useState<Member['role']>('EMPLOYEE');
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setRole(member.role);
  };

  const handleSave = async (member: Member) => {
    setLoading(true);
    try {
      const result = await businessAPI.updateBusinessMember(businessId, member.user.id, { role: role as Member['role'] });
      if (result.success) {
        setToast({ type: 'success', message: 'Member updated successfully!' });
        setEditingMemberId(null);
        onMemberUpdate();
      } else {
        setToast({ type: 'error', message: 'Failed to update member' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (member: Member) => {
    setRemovingMemberId(member.id);
    try {
      const result = await businessAPI.removeBusinessMember(businessId, member.user.id);
      if (result.success) {
        setToast({ type: 'success', message: 'Member removed successfully!' });
        onMemberUpdate();
      } else {
        setToast({ type: 'error', message: 'Failed to remove member' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Members</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                {canManage && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <Avatar src={undefined} nameOrEmail={member.user.name || member.user.email} size={32} />
                    <span className="font-medium text-gray-900">{member.user.name || member.user.email}</span>
                    {member.user.id === currentUserId && (
                      <Badge color="blue">You</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingMemberId === member.id ? (
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value as Member['role'])}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize text-gray-700">{member.role.toLowerCase()}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{member.user.email}</td>
                  <td className="px-4 py-2 text-gray-500 text-sm">{new Date(member.joinedAt).toLocaleDateString()}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      {editingMemberId === member.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setEditingMemberId(null)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSave(member)}
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleEdit(member)}
                            disabled={editingMemberId !== null || member.user.id === currentUserId}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleRemove(member)}
                            disabled={removingMemberId !== null || member.user.id === currentUserId}
                          >
                            {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!canManage && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              You don't have permission to manage members. Contact an administrator for changes.
            </p>
          </div>
        )}
      </div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          open={true}
          onClose={() => setToast(null)}
        />
      )}
    </Card>
  );
} 