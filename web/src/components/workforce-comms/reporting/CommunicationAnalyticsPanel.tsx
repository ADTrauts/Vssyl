'use client';

import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert, Badge } from 'shared/components';
import {
  getWorkforceCommunicationsReport,
  type WorkforceCommunicationReportItem,
} from '@/api/workforceComms';
import { toast } from 'react-hot-toast';
import { BusinessOperationsEmptyState } from '@/components/business-operations/BusinessOperationsEmptyState';
import { BarChart3 } from 'lucide-react';

interface CommunicationAnalyticsPanelProps {
  businessId: string;
}

export default function CommunicationAnalyticsPanel({
  businessId,
}: CommunicationAnalyticsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WorkforceCommunicationReportItem[]>([]);

  useEffect(() => {
    void loadData();
  }, [businessId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const communications = await getWorkforceCommunicationsReport(businessId, { limit: 50 });
      setItems(communications);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load communication analytics';
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
      <h2 className="text-xl font-semibold">Communication analytics</h2>
      {items.length === 0 ? (
        <BusinessOperationsEmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="No published communications"
          description="Publish communications to see reach and read-rate analytics."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-v-text-primary">{item.title}</p>
                  <p className="text-xs text-v-text-muted">
                    {item.communicationType} ·{' '}
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <Badge color={item.requiresAck ? 'yellow' : 'blue'} size="sm">
                  {item.requiresAck ? 'Ack required' : 'Read only'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-v-text-muted">Reach</p>
                  <p className="font-semibold">{item.reach}</p>
                </div>
                <div>
                  <p className="text-v-text-muted">Read rate</p>
                  <p className="font-semibold">{(item.readRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-v-text-muted">Ack rate</p>
                  <p className="font-semibold">{(item.ackRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-v-text-muted">Completion</p>
                  <p className="font-semibold">{item.completionPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
