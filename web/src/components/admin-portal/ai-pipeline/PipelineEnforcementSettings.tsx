'use client';

import React, { useState } from 'react';
import { Button, Alert } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type { PipelineEnforcementSettings } from '../../../types/adminAiPipeline';

interface PipelineEnforcementSettingsEditorProps {
  enforcement: PipelineEnforcementSettings;
  onSaved: () => void;
}

export default function PipelineEnforcementSettingsEditor({
  enforcement,
  onSaved,
}: PipelineEnforcementSettingsEditorProps) {
  const [enabled, setEnabled] = useState(enforcement.enforcementEnabled);
  const [mode, setMode] = useState(enforcement.enforcementMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await adminApiService.updateAiPipelineSettings({
      enforcementEnabled: enabled,
      enforcementMode: mode,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setMessage('Enforcement settings saved');
    onSaved();
  };

  return (
    <section className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Grounding enforcement</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          Phase 4: block or disclose when grounding is required but retrieval did not run. Regenerate mode
          runs a Place/location retrieval pass before the model call.
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enforcement enabled
      </label>
      <label className="block text-sm max-w-md">
        <span className="text-gray-700 dark:text-gray-300">Mode</span>
        <select
          className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as PipelineEnforcementSettings['enforcementMode'])
          }
          disabled={!enabled}
        >
          <option value="off">Off (diagnostics only)</option>
          <option value="disclose">Disclose (append warning)</option>
          <option value="block">Block (replace response)</option>
          <option value="regenerate">Regenerate (retrieval prepass + block if still ungrounded)</option>
        </select>
      </label>
      <Button onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save enforcement'}
      </Button>
    </section>
  );
}
