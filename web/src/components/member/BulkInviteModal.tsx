'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Textarea, Spinner } from 'shared/components';
import { UserPlus, X, Plus } from 'lucide-react';

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invitations: Array<{
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    title?: string;
    department?: string;
    message?: string;
  }>) => Promise<void>;
  loading?: boolean;
}

export const BulkInviteModal: React.FC<BulkInviteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [invitations, setInvitations] = useState<Array<{
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    title: string;
    department: string;
    message: string;
  }>>([
    { email: '', role: 'EMPLOYEE', title: '', department: '', message: '' }
  ]);

  const [globalMessage, setGlobalMessage] = useState('');
  const [globalRole, setGlobalRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE');

  const addInvitation = () => {
    setInvitations([...invitations, { email: '', role: 'EMPLOYEE', title: '', department: '', message: '' }]);
  };

  const removeInvitation = (index: number) => {
    if (invitations.length > 1) {
      setInvitations(invitations.filter((_, i) => i !== index));
    }
  };

  const updateInvitation = (index: number, field: string, value: string) => {
    const updated = [...invitations];
    updated[index] = { ...updated[index], [field]: value };
    setInvitations(updated);
  };

  const applyGlobalSettings = () => {
    const updated = invitations.map(inv => ({
      ...inv,
      role: globalRole,
      message: globalMessage
    }));
    setInvitations(updated);
  };

  const handleSubmit = async () => {
    const validInvitations = invitations
      .filter(inv => inv.email.trim())
      .map(inv => ({
        email: inv.email.trim(),
        role: inv.role,
        title: inv.title.trim() || undefined,
        department: inv.department.trim() || undefined,
        message: inv.message.trim() || undefined,
      }));

    if (validInvitations.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }

    await onSubmit(validInvitations);
  };

  const resetForm = () => {
    setInvitations([{ email: '', role: 'EMPLOYEE', title: '', department: '', message: '' }]);
    setGlobalMessage('');
    setGlobalRole('EMPLOYEE');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} size="large">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Invite Members</h2>
          <Button variant="ghost" onClick={handleClose} className="p-1">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Global Settings */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Global Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Role
              </label>
              <select
                value={globalRole}
                onChange={(e) => setGlobalRole(e.target.value as 'EMPLOYEE' | 'MANAGER' | 'ADMIN')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Global Message
              </label>
              <Input
                type="text"
                value={globalMessage}
                onChange={(e) => setGlobalMessage(e.target.value)}
                placeholder="Optional message for all invitations"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={applyGlobalSettings}
            className="text-sm"
          >
            Apply to All
          </Button>
        </div>

        {/* Invitations List */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Invitations ({invitations.filter(inv => inv.email.trim()).length})
            </h3>
            <Button
              variant="secondary"
              onClick={addInvitation}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Another
            </Button>
          </div>

          {invitations.map((invitation, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Invitation {index + 1}
                </span>
                {invitations.length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => removeInvitation(index)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={invitation.email}
                    onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                    placeholder="employee@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={invitation.role}
                    onChange={(e) => updateInvitation(index, 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <Input
                    type="text"
                    value={invitation.title}
                    onChange={(e) => updateInvitation(index, 'title', e.target.value)}
                    placeholder="Job Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <Input
                    type="text"
                    value={invitation.department}
                    onChange={(e) => updateInvitation(index, 'department', e.target.value)}
                    placeholder="Department"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message
                  </label>
                  <Textarea
                    value={invitation.message}
                    onChange={(e) => updateInvitation(index, 'message', e.target.value)}
                    placeholder="Optional personal message for this invitation"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || invitations.filter(inv => inv.email.trim()).length === 0}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Spinner size={16} />
                <span>Sending Invitations...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Send Invitations</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 