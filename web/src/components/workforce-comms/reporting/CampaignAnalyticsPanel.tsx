'use client';

import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert, Badge } from 'shared/components';
import {
  getWorkforceCampaignsReport,
  type WorkforceCampaignReportItem,
} from '@/api/workforceComms';
import { toast } from 'react-hot-toast';

interface CampaignAnalyticsPanelProps {
  businessId: string;
}

export default function CampaignAnalyticsPanel({ businessId }: CampaignAnalyticsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<WorkforceCampaignReportItem[]>([]);

  useEffect(() => {
    void loadData();
  }, [businessId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkforceCampaignsReport(businessId, 50);
      setCampaigns(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load campaign analytics';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Campaign analytics</h2>
      {campaigns.length === 0 ? (
        <p className="text-gray-500">No campaigns to report on yet.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {campaign.publishedCommunicationCount} published / {campaign.communicationCount}{' '}
                    total communications
                  </p>
                </div>
                <Badge color="blue" size="sm">
                  {campaign.status}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Reach</p>
                  <p className="font-semibold">{campaign.reach}</p>
                </div>
                <div>
                  <p className="text-gray-500">Read rate</p>
                  <p className="font-semibold">{(campaign.readRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Ack rate</p>
                  <p className="font-semibold">{(campaign.ackRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Completion</p>
                  <p className="font-semibold">{campaign.completionPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
