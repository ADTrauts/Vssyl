'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Input, Spinner } from 'shared/components';
import { toast } from 'react-hot-toast';
import * as vlinksAPI from '@/api/vlinks';
import type { VLinkMemberRole, VLinkMemberRow } from '@/api/vlinks';

interface VLinkShareModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  vlinkId: string;
}

export function VLinkShareModal({ open, onClose, token, vlinkId }: VLinkShareModalProps) {
  const [members, setMembers] = useState<VLinkMemberRow[]>([]);
  const [inviteUserId, setInviteUserId] = useState('');
  const [role, setRole] = useState<VLinkMemberRole>('VIEWER');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    vlinksAPI
      .listVLinkMembers(token, vlinkId)
      .then(setMembers)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, token, vlinkId]);

  const handleInvite = async () => {
    if (!inviteUserId.trim()) return;
    try {
      await vlinksAPI.inviteVLinkMember(token, vlinkId, inviteUserId.trim(), role);
      toast.success('Member invited');
      setInviteUserId('');
      const updated = await vlinksAPI.listVLinkMembers(token, vlinkId);
      setMembers(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share V_Link" size="large">
      <div className="space-y-4">
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
          Access to this vlink does not grant access to linked files, events, or other items. Members only see
          content they already have permission to view.
        </p>
        {loading ? (
          <Spinner />
        ) : (
          <ul className="space-y-2 max-h-40 overflow-auto">
            {members.map((m) => (
              <li key={m.id} className="flex justify-between text-sm text-gray-800 border-b pb-1">
                <span>{m.user.name ?? m.user.email}</span>
                <span className="text-gray-600">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="User ID to invite"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
          />
          <select
            className="border rounded px-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as VLinkMemberRole)}
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
          <Button variant="primary" onClick={handleInvite}>
            Invite
          </Button>
        </div>
      </div>
    </Modal>
  );
};
