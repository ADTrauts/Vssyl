'use client';

import CampaignDetailPage from '@/components/workforce-comms/CampaignDetailPage';
import { useParams } from 'next/navigation';

export default function WorkforceCampaignDetailRoute() {
  const params = useParams();
  const businessId = params?.id as string;
  const campaignId = params?.campaignId as string;

  if (!businessId || !campaignId) {
    return <div className="p-6 text-red-700">Missing business or campaign id.</div>;
  }

  return <CampaignDetailPage businessId={businessId} campaignId={campaignId} />;
}
