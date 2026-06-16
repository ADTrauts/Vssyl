'use client';

import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert } from 'shared/components';
import { BarChart3, Megaphone, Users, CheckCircle2 } from 'lucide-react';
import {
  getWorkforceSummaryReport,
  type WorkforceSummaryReport,
} from '@/api/workforceComms';
import { toast } from 'react-hot-toast';

interface WorkforceReportingDashboardProps {
  businessId: string;
  onNavigate?: (section: 'communications' | 'campaigns' | 'acknowledgements') => void;
}

export default function WorkforceReportingDashboard({
  businessId,
  onNavigate,
}: WorkforceReportingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<WorkforceSummaryReport | null>(null);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y'>('90d');

  useEffect(() => {
    void loadReport();
  }, [businessId, dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      const data = await getWorkforceSummaryReport(businessId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setReport(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reporting summary';
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
    return <Alert type="error">{error ?? 'No report data available'}</Alert>;
  }

  const maxTrend = Math.max(...report.publishTrends.map((item) => item.count), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Workforce Reporting
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reach, read rates, acknowledgement compliance, and publish trends
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value as '30d' | '90d' | '1y')}
          className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"
        >
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <p className="text-2xl font-semibold">{report.overview.publishedCount}</p>
            </div>
            <Megaphone className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Audience reach</p>
              <p className="text-2xl font-semibold">{report.engagement.audienceReach}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. read rate</p>
              <p className="text-2xl font-semibold">
                {(report.engagement.averageReadRate * 100).toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ack compliance</p>
              <p className="text-2xl font-semibold">
                {report.engagement.completionPercentage.toFixed(1)}%
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Publish trends</h3>
        <div className="flex items-end gap-1 h-32 overflow-x-auto">
          {report.publishTrends.map((bucket) => (
            <div key={bucket.date} className="flex flex-col items-center min-w-[12px]">
              <div
                className="w-3 bg-blue-500 rounded-t"
                style={{ height: `${Math.max((bucket.count / maxTrend) * 100, bucket.count > 0 ? 8 : 2)}%` }}
                title={`${bucket.date}: ${bucket.count}`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Activity events recorded: {report.activity.publishedEvents}
        </p>
      </Card>

      {onNavigate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('communications')}
            className="text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <p className="font-medium">Communication analytics</p>
            <p className="text-sm text-gray-500">Per-communication reach and read rates</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('campaigns')}
            className="text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <p className="font-medium">Campaign analytics</p>
            <p className="text-sm text-gray-500">Campaign-level engagement aggregates</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('acknowledgements')}
            className="text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <p className="font-medium">Ack compliance</p>
            <p className="text-sm text-gray-500">Required acknowledgement completion</p>
          </button>
        </div>
      )}
    </div>
  );
}
