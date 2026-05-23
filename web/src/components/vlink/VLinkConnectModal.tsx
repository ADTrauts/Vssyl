'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Modal, Button, Input, Spinner } from 'shared/components';
import { toast } from 'react-hot-toast';
import { useDashboard } from '@/contexts/DashboardContext';
import { useVLinkDrag, type VLinkDragEntity } from '@/contexts/VLinkDragContext';
import * as vlinksAPI from '@/api/vlinks';
import type { VLinkScope, VLinkSummary } from '@/api/vlinks';

interface VLinkConnectModalProps {
  open: boolean;
  onClose: () => void;
  entity: VLinkDragEntity | null;
  onLinked?: () => void;
}

export function VLinkConnectModal({ open, onClose, entity, onLinked }: VLinkConnectModalProps) {
  const { data: session } = useSession();
  const { currentDashboardId, currentDashboard } = useDashboard();
  const businessId =
    currentDashboard && 'business' in currentDashboard ? currentDashboard.business?.id ?? null : null;
  const householdId =
    currentDashboard && 'household' in currentDashboard ? currentDashboard.household?.id ?? null : null;
  const [mode, setMode] = useState<'connect' | 'create'>('connect');
  const [vlinks, setVlinks] = useState<VLinkSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<VLinkScope>('PERSONAL');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !session?.accessToken) return;
    setLoading(true);
    vlinksAPI
      .listVLinks(session.accessToken, { dashboardId: currentDashboardId ?? undefined })
      .then((res) => setVlinks(res.vlinks))
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [open, session?.accessToken, currentDashboardId]);

  useEffect(() => {
    if (entity?.title) setTitle(`Link: ${entity.title}`);
  }, [entity]);

  const handleConfirm = async () => {
    if (!session?.accessToken || !entity) return;
    setSaving(true);
    try {
      let vlinkId = selectedId;
      if (mode === 'create') {
        if (!title.trim()) {
          toast.error('Title is required');
          return;
        }
        if (!currentDashboardId) {
          toast.error('Dashboard context required');
          return;
        }
        const created = await vlinksAPI.createVLink(session.accessToken, {
          title: title.trim(),
          scope,
          dashboardId: currentDashboardId,
          businessId: scope === 'BUSINESS' ? businessId : null,
          householdId: scope === 'HOUSEHOLD' ? householdId : null,
        });
        vlinkId = created.id;
      }
      if (!vlinkId) {
        toast.error('Select a vlink');
        return;
      }
      await vlinksAPI.linkEntityToVLink(session.accessToken, vlinkId, {
        entityType: entity.entityType,
        entityId: entity.entityId,
        moduleId: entity.moduleId,
        replacePrimary: true,
      });
      toast.success('Linked to V_Link');
      onLinked?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add to V_Link" size="medium">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Connect this item to an existing vlink or create a new one. V_Link access does not grant others access to
          linked item content.
        </p>
        <div className="flex gap-2">
          <Button variant={mode === 'connect' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('connect')}>
            Connect existing
          </Button>
          <Button variant={mode === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('create')}>
            Create new
          </Button>
        </div>
        {mode === 'connect' ? (
          loading ? (
            <Spinner />
          ) : (
            <select
              className="w-full border rounded-md px-3 py-2 text-gray-800"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select vlink…</option>
              {vlinks.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.publicCode})
                </option>
              ))}
            </select>
          )
        ) : (
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="V_Link title" />
            <select
              className="w-full border rounded-md px-3 py-2 text-gray-800"
              value={scope}
              onChange={(e) => setScope(e.target.value as VLinkScope)}
            >
              <option value="PERSONAL">Personal</option>
              <option value="BUSINESS">Business</option>
              <option value="HOUSEHOLD">Household</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function GlobalVLinkConnectModal() {
  const { connectModalOpen, pendingEntity, closeConnectModal } = useVLinkDrag();
  return <VLinkConnectModal open={connectModalOpen} onClose={closeConnectModal} entity={pendingEntity} />;
}
