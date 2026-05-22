'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from 'shared/components';
import { getBusiness } from '../../../../api/business';
import WebhookSubscriptionsShell from '../../../../components/business/WebhookSubscriptionsShell';

export default function BusinessWebhookSettingsPage() {
  const params = useParams();
  const businessId = typeof params?.id === 'string' ? params.id : '';
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !businessId) return;
    void getBusiness(businessId, token)
      .then((res) => {
        const business = res.data;
        const userId = session?.user?.id;
        const member = business.members?.find((m) => m.userId === userId);
        setCanManage(member?.role === 'ADMIN' && Boolean(member?.canManage ?? true));
      })
      .finally(() => setLoading(false));
  }, [token, businessId, session?.user?.id]);

  if (loading || !token) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Webhook subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Outbound signed events for integrations (MVP shell).
        </p>
      </header>
      <WebhookSubscriptionsShell businessId={businessId} token={token} canManage={canManage} />
    </div>
  );
}
