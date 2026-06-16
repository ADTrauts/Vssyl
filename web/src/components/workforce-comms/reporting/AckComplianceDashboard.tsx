'use client';

import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert, Badge } from 'shared/components';
import {
  getWorkforceAcknowledgementsReport,
  type WorkforceAcknowledgementsReport,
} from '@/api/workforceComms';
import { toast } from 'react-hot-toast';

interface AckComplianceDashboardProps {
  businessId: string;
}

export default function AckComplianceDashboard({ businessId }: AckComplianceDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<WorkforceAcknowledgementsReport | null>(null);

  useEffect(() => {
    void loadData();
  }, [businessId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkforceAcknowledgementsReport(businessId, { limit: 50 });
      setReport(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load acknowledgement report';
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

  if (error || !report) {
    return <Alert type="error">{error ?? 'No acknowledgement data available'}</Alert>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Acknowledgement compliance</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Communications requiring ack</p>
          <p className="text-2xl font-semibold">{report.overview.communicationCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Overall ack rate</p>
          <p className="text-2xl font-semibold">
            {(report.overview.overallAckRate * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completion</p>
          <p className="text-2xl font-semibold">
            {report.overview.overallCompletionPercentage.toFixed(1)}%
          </p>
        </Card>
      </div>

      {report.items.length === 0 ? (
        <p className="text-gray-500">No acknowledgement-required communications published yet.</p>
      ) : (
        <div className="space-y-3">
          {report.items.map((item) => (
            <Card key={item.communicationId} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <Badge color={item.pendingCount > 0 ? 'yellow' : 'green'} size="sm">
                  {item.pendingCount} pending
                </Badge>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${Math.min(item.completionPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {item.ackCount} / {item.resolutionCount} acknowledged (
                  {item.completionPercentage.toFixed(1)}%)
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
