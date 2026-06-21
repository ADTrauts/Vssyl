'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Link2 } from 'lucide-react';
import { Button, Card, Spinner } from 'shared/components';
import { getCampaign } from '@/api/workforceComms';
import { useVLinkDrag } from '@/contexts/VLinkDragContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { getVLinksForEntity, type EntityVLinkRef } from '@/api/vlinks';

interface CampaignDetailPageProps {
  businessId: string;
  campaignId: string;
}

export default function CampaignDetailPage({ businessId, campaignId }: CampaignDetailPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openConnectModal } = useVLinkDrag();
  const { currentDashboardId } = useDashboard();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vlinks, setVlinks] = useState<EntityVLinkRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const campaign = await getCampaign(businessId, campaignId);
        setName(campaign.name);
        setDescription(campaign.description ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    })();
  }, [businessId, campaignId]);

  useEffect(() => {
    if (!session?.accessToken) return;
    void getVLinksForEntity(session.accessToken, 'WORKFORCE_CAMPAIGN', campaignId)
      .then(setVlinks)
      .catch(() => setVlinks([]));
  }, [session?.accessToken, campaignId]);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size={32} /></div>;
  }

  if (error) {
    return <Card className="p-4 m-6 text-red-700">{error}</Card>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push(`/business/${businessId}/workspace/workforce-comms?view=campaigns`)}
      >
        Back to campaigns
      </Button>
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{name}</h1>
        {description && <p className="text-v-text-secondary mt-2">{description}</p>}
      </Card>
      <Card className="p-4">
        <h3 className="font-medium mb-3">V-Links</h3>
        {vlinks.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {vlinks.map((link) => (
              <li key={link.id} className="text-sm">{link.title} ({link.publicCode})</li>
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
              entityType: 'WORKFORCE_CAMPAIGN',
              entityId: campaignId,
              moduleId: 'workforce_comms',
              title: name,
              dashboardId: currentDashboardId ?? undefined,
              businessId,
            })
          }
        >
          <Link2 className="w-4 h-4 mr-2" />
          Add to V_Link
        </Button>
      </Card>
    </div>
  );
}
