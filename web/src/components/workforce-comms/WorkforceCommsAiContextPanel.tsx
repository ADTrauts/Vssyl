'use client';

import React from 'react';
import { Card, Spinner } from 'shared/components';
import { useWorkforceAiOverview, useWorkforceAiReach } from '@/hooks/useWorkforceComms';

interface WorkforceCommsAiContextPanelProps {
  businessId: string;
  communicationId?: string | null;
}

export default function WorkforceCommsAiContextPanel({
  businessId,
  communicationId,
}: WorkforceCommsAiContextPanelProps) {
  const { overview, loading: overviewLoading } = useWorkforceAiOverview(businessId, !communicationId);
  const { reach, loading: reachLoading } = useWorkforceAiReach(
    businessId,
    communicationId ?? null,
    !!communicationId
  );

  if (communicationId) {
    if (reachLoading) {
      return <Card className="p-4"><Spinner size={20} /></Card>;
    }
    if (!reach) return null;
    return (
      <Card className="p-4">
        <h3 className="font-medium mb-3">Reach summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Resolved audience: <strong>{reach.resolutionCount}</strong></div>
          <div>Read: <strong>{reach.readCount}</strong> ({Math.round(reach.readRate * 100)}%)</div>
          {reach.requiresAck && (
            <div>Acknowledged: <strong>{reach.ackCount}</strong> ({Math.round(reach.ackRate * 100)}%)</div>
          )}
          <div>Status: <strong>{reach.status}</strong></div>
        </div>
      </Card>
    );
  }

  if (overviewLoading) {
    return <Card className="p-4"><Spinner size={20} /></Card>;
  }
  if (!overview) return null;

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3">Communication overview</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>Published: <strong>{overview.publishedCount}</strong></div>
        <div>Drafts: <strong>{overview.draftCount}</strong></div>
        <div>Your pending acks: <strong>{overview.pendingAckCount}</strong></div>
      </div>
      {overview.recentPublished.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-v-text-secondary">
          {overview.recentPublished.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
