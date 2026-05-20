'use client';

import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type { AIPipelineTrace, TestLabResult } from '../../../types/adminAiPipeline';
import PipelineTraceDetail from './PipelineTraceDetail';

export default function AITestLabPanel() {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestLabResult | null>(null);
  const [trace, setTrace] = useState<AIPipelineTrace | null>(null);

  const runTest = async () => {
    if (!query.trim()) {
      setError('Enter a prompt to run the pipeline.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setTrace(null);
    try {
      const res = await adminApiService.runAiPipelineTestLab({
        query: query.trim(),
        ...(userId.trim() ? { userId: userId.trim() } : {}),
      });
      if (res.error || !res.data) {
        setError(res.error ?? 'Test lab run failed');
        return;
      }
      setResult(res.data);
      setTrace(res.data.pipelineTrace ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Test lab run failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            User prompt
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            placeholder="e.g. Any yoga clubs or workshops near me?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target user ID (optional)
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-gray-100"
            placeholder="Defaults to your admin user"
          />
        </div>
        <Button onClick={runTest} disabled={loading}>
          {loading ? 'Running…' : 'Run test (dry-run)'}
        </Button>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Dry-run: no history write, no learning side-effects. Uses live twin pipeline.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {result && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Response preview</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.response}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Confidence: {Math.round((result.confidence ?? 0) * 100)}%
            {result.metadata?.provider ? ` · Provider: ${result.metadata.provider}` : ''}
          </p>
        </div>
      )}

      {trace && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pipeline diagnostics
          </h2>
          <PipelineTraceDetail trace={trace} evidenceBundle={trace.evidenceBundle ?? null} />
        </div>
      )}
    </div>
  );
}
