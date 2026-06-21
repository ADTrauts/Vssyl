'use client';

import React, { useState } from 'react';
import { Button, Card, ConfirmModal, Spinner } from 'shared/components';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import type { WorkforceCommunicationListItem, WorkforceCommunicationStatus } from '@/api/workforceComms';
import { cancelCommunication, trashCommunication } from '@/api/workforceComms';
import { useGlobalTrash } from '@/contexts/GlobalTrashContext';
import { formatWorkforceDate, priorityBadgeClass, priorityLabel } from './workforceCommsUtils';
import CommunicationComposer from './CommunicationComposer';
import { BusinessOperationsEmptyState } from '@/components/business-operations/BusinessOperationsEmptyState';

interface CommunicationListProps {
  businessId: string;
  communications: WorkforceCommunicationListItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  statusFilter?: WorkforceCommunicationStatus;
  title?: string;
}

export default function CommunicationList({
  businessId,
  communications,
  loading,
  error,
  onRefresh,
  statusFilter,
  title = 'Communications',
}: CommunicationListProps) {
  const { trashItem } = useGlobalTrash();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = statusFilter
    ? communications.filter((c) => c.status === statusFilter)
    : communications;

  const handleTrash = async () => {
    if (!pendingTrashId) return;
    setActionLoading(true);
    try {
      await trashCommunication(businessId, pendingTrashId);
      await trashItem({
        id: pendingTrashId,
        name: communications.find((c) => c.id === pendingTrashId)?.title ?? 'Communication',
        type: 'communication',
        moduleId: 'workforce_comms',
        moduleName: 'Workforce Communications',
        metadata: { businessId },
      });
      setPendingTrashId(null);
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!pendingCancelId) return;
    setActionLoading(true);
    try {
      await cancelCommunication(businessId, pendingCancelId);
      setPendingCancelId(null);
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-v-text-primary">{title}</h2>
        <Button onClick={() => { setEditingId(null); setComposerOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : error ? (
        <Card className="p-4 text-red-700">{error}</Card>
      ) : filtered.length === 0 ? (
        <BusinessOperationsEmptyState
          icon={<Megaphone className="h-12 w-12" />}
          title="No communications found"
          description="Create a draft communication to reach your workforce audience."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((comm) => (
            <Card key={comm.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{comm.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${priorityBadgeClass(comm.priority)}`}>
                      {priorityLabel(comm.priority)}
                    </span>
                    <span className="text-xs text-v-text-muted">{comm.status}</span>
                  </div>
                  <p className="text-sm text-v-text-secondary mt-1">
                    {comm.summary || 'No summary'}
                  </p>
                  <p className="text-xs text-v-text-muted mt-2">
                    Updated {formatWorkforceDate(comm.updatedAt)}
                    {comm._count?.audienceResolutions
                      ? ` · ${comm._count.audienceResolutions} recipients`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {comm.status === 'DRAFT' || comm.status === 'SCHEDULED' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setEditingId(comm.id); setComposerOpen(true); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : null}
                  {comm.status !== 'CANCELLED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingTrashId(comm.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {(comm.status === 'PUBLISHED' || comm.status === 'SCHEDULED') && (
                    <Button size="sm" variant="secondary" onClick={() => setPendingCancelId(comm.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CommunicationComposer
        open={composerOpen}
        businessId={businessId}
        communicationId={editingId}
        onClose={() => { setComposerOpen(false); setEditingId(null); }}
        onSaved={() => { setComposerOpen(false); setEditingId(null); onRefresh(); }}
      />

      <ConfirmModal
        open={!!pendingTrashId}
        onClose={() => setPendingTrashId(null)}
        onConfirm={handleTrash}
        title="Move to trash?"
        description="This communication will move to Global Trash. You can restore it later."
        confirmLabel="Move to trash"
        loading={actionLoading}
      />

      <ConfirmModal
        open={!!pendingCancelId}
        onClose={() => setPendingCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel communication?"
        description="Published or scheduled communications will be cancelled for the audience."
        confirmLabel="Cancel communication"
        loading={actionLoading}
      />
    </div>
  );
}
