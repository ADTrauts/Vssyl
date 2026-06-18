'use client';

import { Card } from 'shared/components';

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-v-surface dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-v-text-primary">{value}</div>
      <div className="text-v-text-muted text-sm mt-1">{label}</div>
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
        <h2 className="text-xl font-semibold text-v-text-primary mb-6">Business Analytics</h2>
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