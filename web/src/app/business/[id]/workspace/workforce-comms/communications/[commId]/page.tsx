'use client';

import CommunicationDetail from '@/components/workforce-comms/CommunicationDetail';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { businessAPI } from '@/api/business';
import { isWorkforceAdmin } from '@/components/workforce-comms/workforceCommsUtils';

export default function WorkforceCommunicationDetailPage() {
  const params = useParams();
  const businessId = params?.id as string;
  const communicationId = params?.commId as string;
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!businessId || !session?.user?.id) return;
    void (async () => {
      const response = await businessAPI.getBusiness(businessId);
      if (response.success && response.data) {
        const members = (response.data as { members?: Array<{ user: { id: string }; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'; canManage?: boolean }> }).members ?? [];
        const membership = members.find((m) => m.user.id === session.user?.id);
        if (membership) {
          setIsAdmin(isWorkforceAdmin(membership.role, membership.canManage));
        }
      }
    })();
  }, [businessId, session?.user?.id]);

  if (!businessId || !communicationId) {
    return <div className="p-6 text-red-700">Missing business or communication id.</div>;
  }

  return (
    <CommunicationDetail
      businessId={businessId}
      communicationId={communicationId}
      isAdmin={isAdmin}
    />
  );
}
