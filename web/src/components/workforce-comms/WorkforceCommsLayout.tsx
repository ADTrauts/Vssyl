'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from 'shared/components';
import { businessAPI } from '@/api/business';
import {
  useWorkforceAdminCommunications,
  useWorkforcePendingAcks,
} from '@/hooks/useWorkforceComms';
import { isWorkforceAdmin } from './workforceCommsUtils';
import WorkforceCommsSidebar from './WorkforceCommsSidebar';
import WorkforceCommsContentView from './WorkforceCommsContentView';
import PendingAckBanner from './PendingAckBanner';

interface WorkforceCommsLayoutProps {
  businessId: string;
}

interface BusinessMember {
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  canManage?: boolean;
}

export default function WorkforceCommsLayout({ businessId }: WorkforceCommsLayoutProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentView = searchParams?.get('view') || 'dashboard';

  const [userRole, setUserRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE' | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  const pending = useWorkforcePendingAcks(businessId);
  const isAdmin = userRole ? isWorkforceAdmin(userRole, canManage) : false;
  const drafts = useWorkforceAdminCommunications(businessId, { status: 'DRAFT' }, isAdmin);
  const scheduled = useWorkforceAdminCommunications(businessId, { status: 'SCHEDULED' }, isAdmin);

  useEffect(() => {
    if (!businessId || !session?.user?.id) return;
    void (async () => {
      try {
        setLoading(true);
        const response = await businessAPI.getBusiness(businessId);
        if (response.success && response.data) {
          const members = (response.data as { members?: Array<{ user: { id: string }; role: BusinessMember['role']; canManage?: boolean }> }).members ?? [];
          const membership = members.find((m) => m.user.id === session.user?.id);
          if (membership) {
            setUserRole(membership.role);
            setCanManage(!!membership.canManage);
          } else {
            setUserRole('EMPLOYEE');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [businessId, session?.user?.id]);

  const handleViewChange = (view: string) => {
    router.push(`/business/${businessId}/workspace/workforce-comms?view=${view}`);
  };

  if (loading || !userRole) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PendingAckBanner
        businessId={businessId}
        count={pending.pending.length}
        onReview={() => handleViewChange('pending-acks')}
      />
      <div className="flex flex-1 overflow-hidden">
        <WorkforceCommsSidebar
          businessId={businessId}
          currentView={currentView}
          onViewChange={handleViewChange}
          userRole={userRole}
          canManage={canManage}
          stats={{
            pendingAcks: pending.pending.length,
            drafts: drafts.communications.length,
            scheduled: scheduled.communications.length,
          }}
        />
        <div className="flex-1 overflow-y-auto bg-v-surface-muted">
          <WorkforceCommsContentView
            view={currentView}
            businessId={businessId}
            userRole={userRole}
            canManage={canManage}
            onViewChange={handleViewChange}
          />
        </div>
      </div>
    </div>
  );
}
