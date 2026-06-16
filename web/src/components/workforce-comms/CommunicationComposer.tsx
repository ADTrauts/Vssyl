'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Input, Textarea, ConfirmModal } from 'shared/components';
import {
  createCommunicationDraft,
  getAdminCommunication,
  publishCommunication,
  scheduleCommunication,
  setCommunicationAudience,
  updateCommunicationDraft,
  type CreateCommunicationInput,
  type WorkforceAudienceSpec,
  type WorkforceAudienceType,
  type WorkforceCommunicationType,
  type WorkforcePriority,
} from '@/api/workforceComms';
import AudiencePicker from './AudiencePicker';

interface CommunicationComposerProps {
  open: boolean;
  businessId: string;
  communicationId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_OPTIONS: WorkforceCommunicationType[] = [
  'ANNOUNCEMENT',
  'DEPARTMENT_BROADCAST',
  'LEADERSHIP_MESSAGE',
  'POLICY_COMPLIANCE',
  'EMERGENCY_ALERT',
];

const PRIORITY_OPTIONS: WorkforcePriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function CommunicationComposer({
  open,
  businessId,
  communicationId,
  onClose,
  onSaved,
}: CommunicationComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [summary, setSummary] = useState('');
  const [communicationType, setCommunicationType] = useState<WorkforceCommunicationType>('ANNOUNCEMENT');
  const [priority, setPriority] = useState<WorkforcePriority>('NORMAL');
  const [requiresAck, setRequiresAck] = useState(false);
  const [showOnFrontPage, setShowOnFrontPage] = useState(false);
  const [showInHubFeed, setShowInHubFeed] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [audienceType, setAudienceType] = useState<WorkforceAudienceType>('BUSINESS');
  const [audienceSpec, setAudienceSpec] = useState<WorkforceAudienceSpec>({});
  const [savedId, setSavedId] = useState<string | null>(communicationId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmSchedule, setConfirmSchedule] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!communicationId) {
      setTitle('');
      setBody('');
      setSummary('');
      setSavedId(null);
      setAudienceType('BUSINESS');
      setAudienceSpec({});
      return;
    }
    void (async () => {
      try {
        setLoading(true);
        const comm = await getAdminCommunication(businessId, communicationId);
        setTitle(comm.title);
        setBody(comm.body ?? '');
        setSummary(comm.summary ?? '');
        setCommunicationType(comm.communicationType);
        setPriority(comm.priority);
        setRequiresAck(comm.requiresAck);
        setShowOnFrontPage(comm.showOnFrontPage);
        setShowInHubFeed(comm.showInHubFeed);
        setExpiresAt(comm.expiresAt ? comm.expiresAt.slice(0, 16) : '');
        setScheduledAt(comm.scheduledAt ? comm.scheduledAt.slice(0, 16) : '');
        setAudienceType(comm.audience?.audienceType ?? 'BUSINESS');
        setAudienceSpec((comm.audience?.audienceSpec as WorkforceAudienceSpec) ?? {});
        setSavedId(comm.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load communication');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, businessId, communicationId]);

  const buildInput = (): CreateCommunicationInput => ({
    title: title.trim(),
    body: body.trim(),
    summary: summary.trim() || undefined,
    communicationType,
    priority,
    requiresAck,
    showOnFrontPage,
    showInHubFeed,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    audienceType,
    audienceSpec,
  });

  const saveDraft = async (): Promise<string> => {
    if (!title.trim() || !body.trim()) {
      throw new Error('Title and body are required');
    }
    const input = buildInput();
    if (savedId) {
      const updated = await updateCommunicationDraft(businessId, savedId, input);
      await setCommunicationAudience(businessId, savedId, audienceType, audienceSpec);
      return updated.id;
    }
    const created = await createCommunicationDraft(businessId, input);
    await setCommunicationAudience(businessId, created.id, audienceType, audienceSpec);
    setSavedId(created.id);
    return created.id;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await saveDraft();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);
      const id = await saveDraft();
      await publishCommunication(businessId, id);
      setConfirmPublish(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      setError('Scheduled date is required');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const id = await saveDraft();
      await scheduleCommunication(businessId, id, new Date(scheduledAt).toISOString());
      setConfirmSchedule(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={communicationId ? 'Edit communication' : 'Compose communication'} size="large">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input className="w-full mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Summary</label>
            <Textarea className="w-full mt-1" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Body</label>
            <Textarea className="w-full mt-1" value={body} onChange={(e) => setBody(e.target.value)} rows={8} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm dark:bg-slate-800"
                value={communicationType}
                onChange={(e) => setCommunicationType(e.target.value as WorkforceCommunicationType)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm dark:bg-slate-800"
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkforcePriority)}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requiresAck} onChange={(e) => setRequiresAck(e.target.checked)} />
              Requires acknowledgement
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showOnFrontPage} onChange={(e) => setShowOnFrontPage(e.target.checked)} />
              Show on front page
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showInHubFeed} onChange={(e) => setShowInHubFeed(e.target.checked)} />
              Show in hub feed
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Expires at</label>
              <input
                type="datetime-local"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm dark:bg-slate-800"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Schedule for</label>
              <input
                type="datetime-local"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm dark:bg-slate-800"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>
          <AudiencePicker
            businessId={businessId}
            communicationId={savedId ?? undefined}
            audienceType={audienceType}
            audienceSpec={audienceSpec}
            onAudienceTypeChange={setAudienceType}
            onAudienceSpecChange={setAudienceSpec}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="secondary" onClick={handleSave} disabled={loading}>Save draft</Button>
          <Button variant="secondary" onClick={() => setConfirmSchedule(true)} disabled={loading}>Schedule</Button>
          <Button onClick={() => setConfirmPublish(true)} disabled={loading}>Publish now</Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublish}
        title="Publish communication?"
        description="This will deliver the communication to the selected audience immediately."
        confirmLabel="Publish"
        loading={loading}
      />

      <ConfirmModal
        open={confirmSchedule}
        onClose={() => setConfirmSchedule(false)}
        onConfirm={handleSchedule}
        title="Schedule communication?"
        description="The communication will publish automatically at the scheduled time."
        confirmLabel="Schedule"
        loading={loading}
      />
    </>
  );
}
