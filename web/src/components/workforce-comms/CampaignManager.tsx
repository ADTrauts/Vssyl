'use client';

import React, { useState } from 'react';
import { Button, Card, ConfirmModal, Input, Modal, Spinner, Textarea } from 'shared/components';
import { Plus } from 'lucide-react';
import {
  completeCampaign,
  createCampaign,
  updateCampaign,
  type WorkforceCampaign,
} from '@/api/workforceComms';
import { formatWorkforceDate } from './workforceCommsUtils';
import { BusinessOperationsEmptyState } from '@/components/business-operations/BusinessOperationsEmptyState';

interface CampaignManagerProps {
  businessId: string;
  campaigns: WorkforceCampaign[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function CampaignManager({
  businessId,
  campaigns,
  loading,
  error,
  onRefresh,
}: CampaignManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkforceCampaign | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (campaign: WorkforceCampaign) => {
    setEditing(campaign);
    setName(campaign.name);
    setDescription(campaign.description ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCampaign(businessId, editing.id, { name, description });
      } else {
        await createCampaign(businessId, { name, description });
      }
      setModalOpen(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!completeId) return;
    setSaving(true);
    try {
      await completeCampaign(businessId, completeId);
      setCompleteId(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : error ? (
        <Card className="p-4 text-red-700">{error}</Card>
      ) : campaigns.length === 0 ? (
        <BusinessOperationsEmptyState
          icon={<Plus className="h-12 w-12" />}
          title="No campaigns yet"
          description="Group related communications into a campaign for reporting and reach tracking."
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{campaign.name}</h3>
                  <p className="text-sm text-v-text-secondary mt-1">
                    {campaign.description || 'No description'}
                  </p>
                  <p className="text-xs text-v-text-muted mt-2">
                    Status: {campaign.status} · {campaign._count?.communications ?? 0} communications
                    · Updated {formatWorkforceDate(campaign.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(campaign)}>
                    Edit
                  </Button>
                  {campaign.status === 'ACTIVE' && (
                    <Button size="sm" variant="secondary" onClick={() => setCompleteId(campaign.id)}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit campaign' : 'New campaign'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input className="w-full mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea className="w-full mt-1" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!completeId}
        onClose={() => setCompleteId(null)}
        onConfirm={handleComplete}
        title="Complete campaign?"
        description="No further communications will be added to this active campaign."
        confirmLabel="Complete"
        loading={saving}
      />
    </div>
  );
}
