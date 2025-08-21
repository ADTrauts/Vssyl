'use client';

import { Card } from 'shared/components';

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  );
}

interface BusinessAnalyticsProps {
  analytics: {
    memberCount: number;
    dashboardCount: number;
    fileCount: number;
  };
}

export function BusinessAnalytics({ analytics }: BusinessAnalyticsProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Members"
            value={analytics.memberCount}
            icon="👥"
          />
          <StatCard
            label="Dashboards"
            value={analytics.dashboardCount}
            icon="📊"
          />
          <StatCard
            label="Files"
            value={analytics.fileCount}
            icon="📁"
          />
        </div>
      </div>
    </Card>
  );
} 