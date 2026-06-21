'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from 'shared/components';
import { Megaphone, PenLine, CheckCircle2 } from 'lucide-react';
import type { PendingAckItem, WorkforceCampaign, WorkforceCommunicationListItem } from '@/api/workforceComms';
import { isWorkforceAdmin } from './workforceCommsUtils';
import WorkforceCommsAiContextPanel from './WorkforceCommsAiContextPanel';

interface WorkforceCommsWorkspaceLandingProps {
  businessId: string;
  userRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  canManage?: boolean;
  recentFeed: WorkforceCommunicationListItem[];
  pendingAcks: PendingAckItem[];
  campaigns: WorkforceCampaign[];
  onCompose: () => void;
  onViewChange: (view: string) => void;
}

export default function WorkforceCommsWorkspaceLanding({
  businessId,
  userRole,
  canManage,
  recentFeed,
  pendingAcks,
  campaigns,
  onCompose,
  onViewChange,
}: WorkforceCommsWorkspaceLandingProps) {
  const router = useRouter();
  const isAdmin = isWorkforceAdmin(userRole, canManage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-v-text-primary flex items-center gap-2">
            <Megaphone className="w-7 h-7" />
            Workforce Communications
          </h1>
          <p className="text-v-text-secondary mt-1">
            Company broadcasts, acknowledgements, and front-page announcements.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={onCompose}>
            <PenLine className="w-4 h-4 mr-2" />
            Compose
          </Button>
        )}
      </div>

      {pendingAcks.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{pendingAcks.length} acknowledgement(s) pending</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onViewChange('pending-acks')}>
              Review
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Recent communications</h2>
          {recentFeed.length === 0 ? (
            <p className="text-sm text-v-text-muted">No published communications yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentFeed.slice(0, 5).map((comm) => (
                <li key={comm.id}>
                  <button
                    type="button"
                    className="text-sm text-left text-blue-700 hover:underline w-full"
                    onClick={() =>
                      router.push(
                        `/business/${businessId}/workspace/workforce-comms/communications/${comm.id}`
                      )
                    }
                  >
                    {comm.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button className="mt-4" size="sm" variant="secondary" onClick={() => onViewChange('feed')}>
            View feed
          </Button>
        </Card>

        {isAdmin && (
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Active campaigns</h2>
            {campaigns.filter((c) => c.status === 'ACTIVE').length === 0 ? (
              <p className="text-sm text-v-text-muted">No active campaigns.</p>
            ) : (
              <ul className="space-y-2">
                {campaigns
                  .filter((c) => c.status === 'ACTIVE')
                  .slice(0, 5)
                  .map((campaign) => (
                    <li key={campaign.id} className="text-sm text-v-text-secondary">
                      {campaign.name}
                    </li>
                  ))}
              </ul>
            )}
            <Button className="mt-4" size="sm" variant="secondary" onClick={() => onViewChange('campaigns')}>
              Manage campaigns
            </Button>
          </Card>
        )}
      </div>

      {isAdmin && <WorkforceCommsAiContextPanel businessId={businessId} />}
    </div>
  );
}
