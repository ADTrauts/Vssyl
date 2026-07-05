'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from 'shared/components';
import { Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { adminApiService } from '../../lib/adminApiService';

interface TimelineEntry {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  detail?: string;
  href?: string;
}

interface TimelineGroup {
  category: string;
  label: string;
  count: number;
  entries: TimelineEntry[];
}

const CATEGORY_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800',
  security: 'bg-red-100 text-red-800',
  platform: 'bg-green-100 text-green-800',
  billing: 'bg-yellow-100 text-yellow-800',
  businesses: 'bg-emerald-100 text-emerald-800',
  module: 'bg-purple-100 text-purple-800',
  email: 'bg-orange-100 text-orange-800',
  ai: 'bg-indigo-100 text-indigo-800',
  search: 'bg-cyan-100 text-cyan-800',
  deployments: 'bg-slate-100 text-slate-800',
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

function EntryRow({ entry }: { entry: TimelineEntry }) {
  return (
    <li className="flex items-start gap-3 py-2 border-b border-v-border last:border-0">
      <span className="text-xs text-v-text-muted whitespace-nowrap mt-0.5 w-28 shrink-0">
        {formatTime(entry.timestamp)}
      </span>
      <div className="flex-1 min-w-0">
        {entry.href ? (
          <Link href={entry.href} className="text-sm font-medium text-blue-600 hover:underline capitalize">
            {entry.title}
          </Link>
        ) : (
          <span className="text-sm font-medium text-v-text-primary capitalize">{entry.title}</span>
        )}
        {entry.detail ? <p className="text-xs text-v-text-muted mt-0.5 truncate">{entry.detail}</p> : null}
      </div>
    </li>
  );
}

export function OperatorTimeline({ limit = 12, grouped = true }: { limit?: number; grouped?: boolean }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApiService.getOperatorTimeline(limit, grouped);
      if (!res.error && res.data) {
        const payload = res.data as TimelineEntry[] | { grouped: boolean; groups: TimelineGroup[] };
        if (Array.isArray(payload)) {
          setEntries(payload);
          setGroups([]);
        } else if (payload.groups) {
          setGroups(payload.groups);
          setEntries([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [limit, grouped]);

  const toggle = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-v-text-muted" />
          <h2 className="text-lg font-semibold text-v-text-primary">Operations Timeline</h2>
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
        Grouped platform events — billing, businesses, AI, security, email, and deployments.
      </p>

      {loading && entries.length === 0 && groups.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : grouped && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.category} className="border border-v-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(group.category)}
                className="w-full flex items-center justify-between px-4 py-2 bg-v-surface-muted hover:bg-v-surface transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsed[group.category] ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <Badge className={CATEGORY_COLORS[group.category] ?? 'bg-gray-100 text-gray-800'}>
                    {group.label}
                  </Badge>
                  <span className="text-sm text-v-text-muted">{group.count} event{group.count !== 1 ? 's' : ''}</span>
                </div>
              </button>
              {!collapsed[group.category] && (
                <ul className="px-4 py-2">
                  {group.entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-v-text-muted py-4">No recent events.</p>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </Card>
  );
}
