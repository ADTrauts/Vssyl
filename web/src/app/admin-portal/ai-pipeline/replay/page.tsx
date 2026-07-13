'use client';

import { useState } from 'react';
import { Button, Input, Alert, Card } from 'shared/components';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';
import { aiOperationsApi } from '../../../../lib/aiOperationsApi';
import type { AIReplayPreparationPreview } from 'shared/types';

export default function AiOperationsReplayPage() {
  const [executionId, setExecutionId] = useState('');
  const [preview, setPreview] = useState<AIReplayPreparationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prepare = async () => {
    if (!executionId.trim()) return;
    setError(null);
    const res = await aiOperationsApi.prepareReplay(executionId.trim(), {
      mode: 'DIFFERENT_PROVIDER',
      providerOverride: 'openai',
    });
    if (res.error) setError(res.error);
    else setPreview(res.data ?? null);
  };

  return (
    <PipelineSubpageShell
      title="Replay preparation"
      description="Build replay configuration and preview differences. Execution is disabled in Phase 4."
    >
      <div className="flex gap-v-3 max-w-xl mb-v-4">
        <Input
          placeholder="Execution record ID"
          value={executionId}
          onChange={(e) => setExecutionId(e.target.value)}
        />
        <Button onClick={() => void prepare()}>Prepare preview</Button>
      </div>
      {error ? <Alert type="error">{error}</Alert> : null}
      {preview ? (
        <div className="grid md:grid-cols-2 gap-v-4">
          <Card className="p-v-4">
            <h3 className="font-semibold">Current</h3>
            <pre className="text-xs mt-v-2 overflow-auto">{JSON.stringify(preview.current, null, 2)}</pre>
          </Card>
          <Card className="p-v-4">
            <h3 className="font-semibold">Proposed</h3>
            <pre className="text-xs mt-v-2 overflow-auto">{JSON.stringify(preview.proposed, null, 2)}</pre>
          </Card>
          <Card className="p-v-4 md:col-span-2">
            <h3 className="font-semibold">Differences</h3>
            <ul className="list-disc pl-v-4 text-sm mt-v-2">
              {preview.differences.map((d) => <li key={d}>{d}</li>)}
            </ul>
            <p className="text-sm text-v-text-muted mt-v-3">{preview.message}</p>
          </Card>
        </div>
      ) : null}
    </PipelineSubpageShell>
  );
}
