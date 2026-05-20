'use client';

import React, { useState } from 'react';
import { Button, Alert, Badge } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import type {
  PipelineContextSourceDefinition,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineToolPolicy,
} from '../../../types/adminAiPipeline';

interface SaveState {
  saving: boolean;
  message: string | null;
  error: string | null;
}

function useSaveFeedback() {
  const [state, setState] = useState<SaveState>({ saving: false, message: null, error: null });
  const run = async (fn: () => Promise<{ error?: string }>) => {
    setState({ saving: true, message: null, error: null });
    const res = await fn();
    if (res.error) {
      setState({ saving: false, message: null, error: res.error });
      return false;
    }
    setState({ saving: false, message: 'Saved', error: null });
    return true;
  };
  return { ...state, run };
}

interface IntentEditorProps {
  intents: PipelineIntentDefinition[];
  onSaved: () => void;
}

export function PipelineIntentEditor({ intents, onSaved }: IntentEditorProps) {
  const [editing, setEditing] = useState<PipelineIntentDefinition | null>(null);
  const { saving, message, error, run } = useSaveFeedback();

  const save = async () => {
    if (!editing) return;
    const ok = await run(() =>
      adminApiService.updateAiPipelineIntentPolicy(editing.id, {
        name: editing.name,
        description: editing.description,
        triggerExamples: editing.triggerExamples,
        groundingRequired: editing.groundingRequired,
        enabled: editing.enabled,
      })
    );
    if (ok) {
      setEditing(null);
      onSaved();
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-600">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-2 text-left">Intent</th>
              <th className="px-4 py-2 text-left">Grounding</th>
              <th className="px-4 py-2 text-left">Enabled</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
            {intents.map((intent) => (
              <tr key={intent.id}>
                <td className="px-4 py-2 font-mono text-indigo-700 dark:text-indigo-300">{intent.id}</td>
                <td className="px-4 py-2">
                  {intent.groundingRequired ? (
                    <Badge className="bg-amber-100 text-amber-900">Required</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700">Optional</Badge>
                  )}
                </td>
                <td className="px-4 py-2">{intent.enabled ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="secondary" onClick={() => setEditing({ ...intent })}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 space-y-3 bg-indigo-50/50 dark:bg-indigo-950/30">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edit {editing.id}</h3>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Name</span>
            <input
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Description</span>
            <textarea
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              rows={3}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.groundingRequired}
              onChange={(e) => setEditing({ ...editing, groundingRequired: e.target.checked })}
            />
            Grounding required
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.enabled}
              onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GroundingEditorProps {
  rules: PipelineGroundingRule[];
  onSaved: () => void;
}

export function PipelineGroundingEditor({ rules, onSaved }: GroundingEditorProps) {
  const [editing, setEditing] = useState<PipelineGroundingRule | null>(null);
  const { saving, message, error, run } = useSaveFeedback();

  const save = async () => {
    if (!editing) return;
    const ok = await run(() =>
      adminApiService.updateAiPipelineGroundingPolicy(editing.intentId, {
        requiredSources: editing.requiredSources,
        optionalSources: editing.optionalSources,
        requirementSummary: editing.requirementSummary,
      })
    );
    if (ok) {
      setEditing(null);
      onSaved();
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li
            key={rule.intentId}
            className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900 flex justify-between gap-4"
          >
            <div>
              <p className="font-mono text-indigo-700 dark:text-indigo-300">{rule.intentId}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{rule.requirementSummary}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Required: {rule.requiredSources.join(', ') || '—'} · Optional:{' '}
                {rule.optionalSources.join(', ') || '—'}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing({ ...rule })}>
              Edit
            </Button>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 space-y-3">
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Requirement summary</span>
            <input
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              value={editing.requirementSummary}
              onChange={(e) => setEditing({ ...editing, requirementSummary: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Required sources (comma-separated)</span>
            <input
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              value={editing.requiredSources.join(', ')}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  requiredSources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Optional sources (comma-separated)</span>
            <input
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              value={editing.optionalSources.join(', ')}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  optionalSources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SourceEditorProps {
  sources: PipelineContextSourceDefinition[];
  onSaved: () => void;
}

export function PipelineContextSourceEditor({ sources, onSaved }: SourceEditorProps) {
  const [editing, setEditing] = useState<PipelineContextSourceDefinition | null>(null);
  const { saving, message, error, run } = useSaveFeedback();

  const save = async () => {
    if (!editing) return;
    const ok = await run(() =>
      adminApiService.updateAiPipelineContextSourcePolicy(editing.id, {
        label: editing.label,
        description: editing.description,
        enabled: editing.enabled,
        wiredInTwin: editing.wiredInTwin,
      })
    );
    if (ok) {
      setEditing(null);
      onSaved();
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map((src) => (
          <div
            key={src.id}
            className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{src.label}</span>
              <Button size="sm" variant="secondary" onClick={() => setEditing({ ...src })}>
                Edit
              </Button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{src.description}</p>
            <p className="text-xs text-gray-500 mt-2 font-mono">{src.id}</p>
          </div>
        ))}
      </div>

      {editing && (
        <div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 space-y-3">
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Label</span>
            <input
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Description</span>
            <textarea
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              rows={2}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.enabled}
              onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.wiredInTwin}
              onChange={(e) => setEditing({ ...editing, wiredInTwin: e.target.checked })}
            />
            Wired in twin
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolEditorProps {
  policies: PipelineToolPolicy[];
  onSaved: () => void;
}

export function PipelineToolPolicyEditor({ policies, onSaved }: ToolEditorProps) {
  const [editing, setEditing] = useState<PipelineToolPolicy | null>(null);
  const { saving, message, error, run } = useSaveFeedback();

  const save = async () => {
    if (!editing) return;
    const ok = await run(() =>
      adminApiService.updateAiPipelineToolPolicy(editing.toolId, {
        purpose: editing.purpose,
        requiredIntents: editing.requiredIntents,
        optionalIntents: editing.optionalIntents,
        requiredPermissions: editing.requiredPermissions,
        fallbackBehavior: editing.fallbackBehavior,
        enabled: editing.enabled,
      })
    );
    if (ok) {
      setEditing(null);
      onSaved();
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      <div className="space-y-3">
        {policies.map((policy) => (
          <div
            key={policy.toolId}
            className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-900 flex justify-between gap-4"
          >
            <div>
              <span className="font-mono text-indigo-700 dark:text-indigo-300">{policy.toolId}</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{policy.purpose}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing({ ...policy })}>
              Edit
            </Button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 space-y-3">
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Purpose</span>
            <textarea
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              rows={2}
              value={editing.purpose}
              onChange={(e) => setEditing({ ...editing, purpose: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 dark:text-gray-300">Fallback behavior</span>
            <input
              className="mt-1 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900"
              value={editing.fallbackBehavior}
              onChange={(e) => setEditing({ ...editing, fallbackBehavior: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.enabled}
              onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PhrasesEditorProps {
  phrases: string[];
  onSaved: () => void;
}

export function PipelineWeakPhrasesEditor({ phrases, onSaved }: PhrasesEditorProps) {
  const [text, setText] = useState(phrases.join('\n'));
  const { saving, message, error, run } = useSaveFeedback();

  const save = async () => {
    const weakGenericPhrases = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const ok = await run(() => adminApiService.updateAiPipelineSettings({ weakGenericPhrases }));
    if (ok) onSaved();
  };

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
      <p className="text-sm text-gray-600 dark:text-gray-400">One phrase per line.</p>
      <textarea
        className="w-full min-h-[200px] rounded border border-gray-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-900 font-mono text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save phrases'}
      </Button>
    </div>
  );
}
