'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from 'shared/components';
import { Clock, RefreshCw } from 'lucide-react';
import { adminApiService } from '../../lib/adminApiService';

interface TimelineEntry {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  detail?: string;
  href?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800',
  security: 'bg-red-100 text-red-800',
  platform: 'bg-green-100 text-green-800',
  billing: 'bg-yellow-100 text-yellow-800',
  module: 'bg-purple-100 text-purple-800',
  email: 'bg-orange-100 text-orange-800',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OperatorTimeline({ limit = 12 }: { limit?: number }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApiService.getOperatorTimeline(limit);
      if (!res.error && res.data) {
        setEntries(res.data as TimelineEntry[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [limit]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-v-text-muted" />
          <h2 className="text-lg font-semibold text-v-text-primary">System Timeline</h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="p-2 text-v-text-muted hover:text-v-text-primary transition-colors"
          aria-label="Refresh timeline"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-sm text-v-text-secondary mb-4">
        Recent platform events from audit logs, security events, and business activity.
      </p>

      {loading && entries.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-v-text-muted py-4">No recent events.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 py-2 border-b border-v-border last:border-0"
            >
              <span className="text-xs text-v-text-muted whitespace-nowrap mt-0.5 w-28 shrink-0">
                {formatTime(entry.timestamp)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={CATEGORY_COLORS[entry.category] ?? 'bg-gray-100 text-gray-800'}>
                    {entry.category}
                  </Badge>
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      className="text-sm font-medium text-blue-600 hover:underline capitalize"
                    >
                      {entry.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-v-text-primary capitalize">
                      {entry.title}
                    </span>
                  )}
                </div>
                {entry.detail ? (
                  <p className="text-xs text-v-text-muted mt-0.5 truncate">{entry.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
