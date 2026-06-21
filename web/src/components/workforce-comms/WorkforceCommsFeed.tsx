'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Spinner } from 'shared/components';
import { CheckCircle2, Megaphone } from 'lucide-react';
import { BusinessOperationsEmptyState } from '@/components/business-operations/BusinessOperationsEmptyState';
import type { WorkforceCommunicationListItem } from '@/api/workforceComms';
import { formatWorkforceDate, priorityBadgeClass, priorityLabel } from './workforceCommsUtils';

interface WorkforceCommsFeedProps {
  businessId: string;
  communications: WorkforceCommunicationListItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  filter?: 'all' | 'pending-ack' | 'read-history';
  pendingAckIds?: Set<string>;
}

export default function WorkforceCommsFeed({
  businessId,
  communications,
  loading,
  error,
  onRefresh,
  filter = 'all',
  pendingAckIds,
}: WorkforceCommsFeedProps) {
  const router = useRouter();

  const filtered = communications.filter((comm) => {
    if (filter === 'pending-ack') {
      return comm.requiresAck && pendingAckIds?.has(comm.id);
    }
    if (filter === 'read-history') {
      return (comm._count?.readReceipts ?? 0) > 0;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-800">{error}</p>
          <Button className="mt-3" size="sm" onClick={onRefresh}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-6">
        <BusinessOperationsEmptyState
          icon={<Megaphone className="h-12 w-12" />}
          title="No communications to show"
          description="Published workforce communications will appear here."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {filtered.map((comm) => (
        <div
          key={comm.id}
          role="button"
          tabIndex={0}
          className="cursor-pointer"
          onClick={() =>
            router.push(
              `/business/${businessId}/workspace/workforce-comms/communications/${comm.id}`
            )
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              router.push(
                `/business/${businessId}/workspace/workforce-comms/communications/${comm.id}`
              );
            }
          }}
        >
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-v-text-primary">{comm.title}</h3>
                <span className={`px-2 py-0.5 text-xs rounded ${priorityBadgeClass(comm.priority)}`}>
                  {priorityLabel(comm.priority)}
                </span>
                {comm.requiresAck && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Ack required
                  </span>
                )}
              </div>
              {comm.summary && (
                <p className="text-sm text-v-text-secondary mt-1 line-clamp-2">
                  {comm.summary}
                </p>
              )}
              <p className="text-xs text-v-text-muted mt-2">
                Published {formatWorkforceDate(comm.publishedAt)}
              </p>
            </div>
          </div>
        </Card>
        </div>
      ))}
    </div>
  );
}
