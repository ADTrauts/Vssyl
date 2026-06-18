'use client';

import React, { useEffect, useState } from 'react';
import { Spinner, Alert } from 'shared/components';
import { FileText } from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';
import { AdminPortalEmptyState } from '../AdminPortalEmptyState';
import type { PipelinePolicyAuditEntry } from '../../../types/adminAiPipeline';

export default function PipelinePolicyAuditTable() {
  const [entries, setEntries] = useState<PipelinePolicyAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await adminApiService.getAiPipelinePolicyAudit({ limit: 100 });
      if (cancelled) return;
      if (res.error || !res.data) {
        setError(res.error ?? 'Failed to load audit log');
        setEntries([]);
      } else {
        setEntries(res.data.entries);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert>{error}</Alert>;
  }

  if (entries.length === 0) {
    return (
      <AdminPortalEmptyState
        icon={<FileText className="w-12 h-12" />}
        title="No policy changes recorded yet"
        description=""
      />
    );
  }

  return (
    <div className="overflow-x-auto border border-v-border rounded-lg">
      <table className="min-w-full text-sm divide-y divide-v-border">
        <thead className="bg-v-surface-muted">
          <tr>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Admin</th>
            <th className="px-4 py-2 text-left">Entity</th>
            <th className="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="bg-v-surface divide-y divide-v-border">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-2 text-v-text-secondary whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-v-text-secondary">
                {entry.adminEmail ?? entry.adminUserId}
              </td>
              <td className="px-4 py-2 font-mono text-indigo-700 dark:text-indigo-300">
                {entry.entityType}/{entry.entityId}
              </td>
              <td className="px-4 py-2 text-v-text-secondary">{entry.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
