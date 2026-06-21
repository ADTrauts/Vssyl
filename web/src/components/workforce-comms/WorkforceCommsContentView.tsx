'use client';

import React, { useMemo, useState } from 'react';
import { useGlobalTrash } from '@/contexts/GlobalTrashContext';
import {
  useWorkforceAdminCommunications,
  useWorkforceCampaigns,
  useWorkforceCommsFeed,
  useWorkforcePendingAcks,
} from '@/hooks/useWorkforceComms';
import { isWorkforceAdmin } from './workforceCommsUtils';
import WorkforceCommsWorkspaceLanding from './WorkforceCommsWorkspaceLanding';
import WorkforceCommsFeed from './WorkforceCommsFeed';
import CommunicationList from './CommunicationList';
import CampaignManager from './CampaignManager';
import CommunicationComposer from './CommunicationComposer';
import WorkforceReportingDashboard from './reporting/WorkforceReportingDashboard';
import CommunicationAnalyticsPanel from './reporting/CommunicationAnalyticsPanel';
import CampaignAnalyticsPanel from './reporting/CampaignAnalyticsPanel';
import AckComplianceDashboard from './reporting/AckComplianceDashboard';

interface WorkforceCommsContentViewProps {
  view: string;
  businessId: string;
  userRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  canManage?: boolean;
  onViewChange: (view: string) => void;
}

export default function WorkforceCommsContentView({
  view,
  businessId,
  userRole,
  canManage,
  onViewChange,
}: WorkforceCommsContentViewProps) {
  const isAdmin = isWorkforceAdmin(userRole, canManage);
  const [composerOpen, setComposerOpen] = useState(false);
  const { refreshTrash } = useGlobalTrash();

  const feed = useWorkforceCommsFeed(businessId, { limit: 50 });
  const pending = useWorkforcePendingAcks(businessId);
  const adminComms = useWorkforceAdminCommunications(businessId, undefined, isAdmin);
  const drafts = useWorkforceAdminCommunications(businessId, { status: 'DRAFT' }, isAdmin);
  const scheduled = useWorkforceAdminCommunications(businessId, { status: 'SCHEDULED' }, isAdmin);
  const campaigns = useWorkforceCampaigns(businessId, isAdmin);

  const pendingAckIds = useMemo(
    () => new Set(pending.pending.map((item) => item.id)),
    [pending.pending]
  );

  const currentView = view || 'dashboard';

  if (currentView === 'dashboard') {
    return (
      <>
        <WorkforceCommsWorkspaceLanding
          businessId={businessId}
          userRole={userRole}
          canManage={canManage}
          recentFeed={feed.communications}
          pendingAcks={pending.pending}
          campaigns={campaigns.campaigns}
          onCompose={() => setComposerOpen(true)}
          onViewChange={onViewChange}
        />
        <CommunicationComposer
          open={composerOpen}
          businessId={businessId}
          onClose={() => setComposerOpen(false)}
          onSaved={() => {
            setComposerOpen(false);
            feed.refresh();
            adminComms.refresh();
            drafts.refresh();
          }}
        />
      </>
    );
  }

  if (currentView === 'feed') {
    return (
      <WorkforceCommsFeed
        businessId={businessId}
        communications={feed.communications}
        loading={feed.loading}
        error={feed.error}
        onRefresh={feed.refresh}
        filter="all"
      />
    );
  }

  if (currentView === 'pending-acks') {
    return (
      <WorkforceCommsFeed
        businessId={businessId}
        communications={feed.communications}
        loading={feed.loading || pending.loading}
        error={feed.error ?? pending.error}
        onRefresh={() => {
          feed.refresh();
          pending.refresh();
        }}
        filter="pending-ack"
        pendingAckIds={pendingAckIds}
      />
    );
  }

  if (currentView === 'read-history') {
    return (
      <WorkforceCommsFeed
        businessId={businessId}
        communications={feed.communications}
        loading={feed.loading}
        error={feed.error}
        onRefresh={feed.refresh}
        filter="read-history"
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-v-text-muted">
        You do not have permission to access admin sections.
      </div>
    );
  }

  if (currentView === 'reporting') {
    return (
      <WorkforceReportingDashboard
        businessId={businessId}
        onNavigate={(section) => onViewChange(`reporting-${section}`)}
      />
    );
  }

  if (currentView === 'reporting-communications') {
    return <CommunicationAnalyticsPanel businessId={businessId} />;
  }

  if (currentView === 'reporting-campaigns') {
    return <CampaignAnalyticsPanel businessId={businessId} />;
  }

  if (currentView === 'reporting-acknowledgements') {
    return <AckComplianceDashboard businessId={businessId} />;
  }

  if (currentView === 'communications') {
    return (
      <CommunicationList
        businessId={businessId}
        communications={adminComms.communications}
        loading={adminComms.loading}
        error={adminComms.error}
        onRefresh={adminComms.refresh}
      />
    );
  }

  if (currentView === 'drafts') {
    return (
      <CommunicationList
        businessId={businessId}
        communications={drafts.communications}
        loading={drafts.loading}
        error={drafts.error}
        onRefresh={drafts.refresh}
        statusFilter="DRAFT"
        title="Drafts"
      />
    );
  }

  if (currentView === 'scheduled') {
    return (
      <CommunicationList
        businessId={businessId}
        communications={scheduled.communications}
        loading={scheduled.loading}
        error={scheduled.error}
        onRefresh={scheduled.refresh}
        statusFilter="SCHEDULED"
        title="Scheduled"
      />
    );
  }

  if (currentView === 'campaigns') {
    return (
      <CampaignManager
        businessId={businessId}
        campaigns={campaigns.campaigns}
        loading={campaigns.loading}
        error={campaigns.error}
        onRefresh={campaigns.refresh}
      />
    );
  }

  if (currentView === 'trash') {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Archived / Trash</h2>
        <p className="text-v-text-secondary mb-4">
          Trashed communications and campaigns appear in the platform Global Trash bin.
          Restore or permanently delete them from there.
        </p>
        <button
          type="button"
          className="text-blue-700 hover:underline text-sm"
          onClick={() => void refreshTrash()}
        >
          Refresh Global Trash
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-v-text-muted">
      Unknown view: {currentView}
    </div>
  );
}
