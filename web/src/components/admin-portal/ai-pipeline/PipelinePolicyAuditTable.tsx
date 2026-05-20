'use client';

import React, { useEffect, useState } from 'react';
import { Spinner, Alert } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
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
    return <p className="text-gray-600 dark:text-gray-400">No policy changes recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg">
      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
        <thead className="bg-gray-50 dark:bg-slate-900">
          <tr>
            <th className="px-4 py-2 text-left">When</th>
            <th className="px-4 py-2 text-left">Admin</th>
            <th className="px-4 py-2 text-left">Entity</th>
            <th className="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {entry.adminEmail ?? entry.adminUserId}
              </td>
              <td className="px-4 py-2 font-mono text-indigo-700 dark:text-indigo-300">
                {entry.entityType}/{entry.entityId}
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{entry.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
