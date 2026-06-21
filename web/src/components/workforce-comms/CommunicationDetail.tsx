'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Card, Spinner } from 'shared/components';
import { ArrowLeft, CheckCircle2, Link2 } from 'lucide-react';
import {
  getEmployeeCommunication,
  type WorkforceCommunicationDetail,
} from '@/api/workforceComms';
import {
  markCommunicationAcknowledged,
  markCommunicationRead,
} from '@/hooks/useWorkforceComms';
import { useVLinkDrag } from '@/contexts/VLinkDragContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { getVLinksForEntity, type EntityVLinkRef } from '@/api/vlinks';
import { VLinkIndicator } from '@/components/vlink/VLinkIndicator';
import { formatWorkforceDate, priorityBadgeClass, priorityLabel } from './workforceCommsUtils';
import WorkforceCommsAiContextPanel from './WorkforceCommsAiContextPanel';

interface CommunicationDetailProps {
  businessId: string;
  communicationId: string;
  isAdmin?: boolean;
}

export default function CommunicationDetail({
  businessId,
  communicationId,
  isAdmin = false,
}: CommunicationDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openConnectModal } = useVLinkDrag();
  const { currentDashboardId } = useDashboard();
  const [communication, setCommunication] = useState<WorkforceCommunicationDetail | null>(null);
  const [vlinks, setVlinks] = useState<EntityVLinkRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [acked, setAcked] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const comm = await getEmployeeCommunication(businessId, communicationId);
      setCommunication(comm);
      await markCommunicationRead(businessId, communicationId, 'HUB');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communication');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [businessId, communicationId]);

  useEffect(() => {
    if (!session?.accessToken) return;
    void getVLinksForEntity(session.accessToken, 'WORKFORCE_COMMUNICATION', communicationId)
      .then(setVlinks)
      .catch(() => setVlinks([]));
  }, [session?.accessToken, communicationId]);

  const handleAck = async () => {
    try {
      setAckLoading(true);
      await markCommunicationAcknowledged(businessId, communicationId);
      setAcked(true);
    } finally {
      setAckLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !communication) {
    return (
      <div className="p-6">
        <Card className="p-4 text-red-700">{error ?? 'Communication not found'}</Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push(`/business/${businessId}/workspace/workforce-comms?view=feed`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to feed
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-v-text-primary">{communication.title}</h1>
              <VLinkIndicator entityType="WORKFORCE_COMMUNICATION" entityId={communication.id} />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded ${priorityBadgeClass(communication.priority)}`}>
                {priorityLabel(communication.priority)}
              </span>
              <span className="text-xs text-v-text-muted">
                Published {formatWorkforceDate(communication.publishedAt)}
              </span>
            </div>
          </div>
        </div>

        {communication.summary && (
          <p className="text-v-text-secondary mt-4">{communication.summary}</p>
        )}

        <div className="prose dark:prose-invert max-w-none mt-6 whitespace-pre-wrap text-v-text-primary">
          {communication.body}
        </div>

        {communication.requiresAck && (
          <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-900 mb-3">This communication requires your acknowledgement.</p>
            <Button onClick={handleAck} disabled={ackLoading || acked}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {acked ? 'Acknowledged' : 'Acknowledge'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-3">V-Links</h3>
        {vlinks.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {vlinks.map((link) => (
              <li key={link.id} className="text-sm text-v-text-secondary">
                {link.title} ({link.publicCode})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-v-text-muted mb-4">No V-Links yet.</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            openConnectModal({
              entityType: 'WORKFORCE_COMMUNICATION',
              entityId: communication.id,
              moduleId: 'workforce_comms',
              title: communication.title,
              dashboardId: currentDashboardId ?? undefined,
              businessId,
            })
          }
        >
          <Link2 className="w-4 h-4 mr-2" />
          Add to V_Link
        </Button>
      </Card>

      {isAdmin && (
        <WorkforceCommsAiContextPanel businessId={businessId} communicationId={communication.id} />
      )}
    </div>
  );
}
