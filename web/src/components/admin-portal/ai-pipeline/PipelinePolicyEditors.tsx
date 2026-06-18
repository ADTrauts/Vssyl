'use client';

import React, { useState } from 'react';
import { Button, Alert, Badge, Modal } from 'shared/components';
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

function PipelinePolicyEditModal({
  open,
  title,
  onClose,
  children,
  onSave,
  saving,
  saveLabel = 'Save',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  saveLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="large">
      <div className="space-y-4">{children}</div>
      <div className="flex flex-wrap gap-2 justify-end pt-4 mt-4 border-t border-v-border">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </div>
    </Modal>
  );
}

const inputClass =
  'mt-1 w-full rounded border border-v-border px-3 py-2 bg-v-surface text-v-text-primary';
const labelClass = 'block text-sm text-v-text-secondary';

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
      {message && !editing && (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      )}
      <div className="overflow-x-auto border border-v-border rounded-lg">
        <table className="min-w-full text-sm divide-y divide-v-border">
          <thead className="bg-v-surface-muted">
            <tr>
              <th className="px-4 py-2 text-left">Intent</th>
              <th className="px-4 py-2 text-left">Grounding</th>
              <th className="px-4 py-2 text-left">Enabled</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-v-surface divide-y divide-v-border">
            {intents.map((intent) => (
              <tr key={intent.id}>
                <td className="px-4 py-2 font-mono text-indigo-700 dark:text-indigo-300">{intent.id}</td>
                <td className="px-4 py-2">
                  {intent.groundingRequired ? (
                    <Badge className="bg-amber-100 text-amber-900">Required</Badge>
                  ) : (
                    <Badge className="bg-v-surface-muted text-gray-700">Optional</Badge>
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

      <PipelinePolicyEditModal
        open={editing != null}
        title={editing ? `Edit intent: ${editing.id}` : 'Edit intent'}
        onClose={() => setEditing(null)}
        onSave={() => void save()}
        saving={saving}
      >
        {error && <Alert>{error}</Alert>}
        {message && editing && (
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        )}
        {editing && (
          <>
            <label className={labelClass}>
              Name
              <input
                className={inputClass}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Description
              <textarea
                className={inputClass}
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-v-text-secondary">
              <input
                type="checkbox"
                checked={editing.groundingRequired}
                onChange={(e) => setEditing({ ...editing, groundingRequired: e.target.checked })}
              />
              Grounding required
            </label>
            <label className="flex items-center gap-2 text-sm text-v-text-secondary">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
              Enabled
            </label>
          </>
        )}
      </PipelinePolicyEditModal>
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
      {message && !editing && (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      )}
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li
            key={rule.intentId}
            className="border border-v-border rounded-lg p-4 bg-v-surface flex justify-between gap-4"
          >
            <div>
              <p className="font-mono text-indigo-700 dark:text-indigo-300">{rule.intentId}</p>
              <p className="text-v-text-secondary mt-1">{rule.requirementSummary}</p>
              <p className="text-xs text-v-text-muted mt-2">
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

      <PipelinePolicyEditModal
        open={editing != null}
        title={editing ? `Edit grounding: ${editing.intentId}` : 'Edit grounding rule'}
        onClose={() => setEditing(null)}
        onSave={() => void save()}
        saving={saving}
      >
        {error && <Alert>{error}</Alert>}
        {message && editing && (
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        )}
        {editing && (
          <>
            <label className={labelClass}>
              Requirement summary
              <input
                className={inputClass}
                value={editing.requirementSummary}
                onChange={(e) => setEditing({ ...editing, requirementSummary: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Required sources (comma-separated)
              <input
                className={inputClass}
                value={editing.requiredSources.join(', ')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    requiredSources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </label>
            <label className={labelClass}>
              Optional sources (comma-separated)
              <input
                className={inputClass}
                value={editing.optionalSources.join(', ')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    optionalSources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </label>
          </>
        )}
      </PipelinePolicyEditModal>
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
      {message && !editing && (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map((src) => (
          <div
            key={src.id}
            className="border border-v-border rounded-lg p-3 bg-v-surface"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-v-text-primary">{src.label}</span>
              <Button size="sm" variant="secondary" onClick={() => setEditing({ ...src })}>
                Edit
              </Button>
            </div>
            <p className="text-sm text-v-text-secondary mt-1">{src.description}</p>
            <p className="text-xs text-v-text-muted mt-2 font-mono">{src.id}</p>
          </div>
        ))}
      </div>

      <PipelinePolicyEditModal
        open={editing != null}
        title={editing ? `Edit context source: ${editing.id}` : 'Edit context source'}
        onClose={() => setEditing(null)}
        onSave={() => void save()}
        saving={saving}
      >
        {error && <Alert>{error}</Alert>}
        {message && editing && (
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        )}
        {editing && (
          <>
            <label className={labelClass}>
              Label
              <input
                className={inputClass}
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Description
              <textarea
                className={inputClass}
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-v-text-secondary">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-v-text-secondary">
              <input
                type="checkbox"
                checked={editing.wiredInTwin}
                onChange={(e) => setEditing({ ...editing, wiredInTwin: e.target.checked })}
              />
              Wired in twin
            </label>
          </>
        )}
      </PipelinePolicyEditModal>
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
      {message && !editing && (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      )}
      <div className="space-y-3">
        {policies.map((policy) => (
          <div
            key={policy.toolId}
            className="border border-v-border rounded-lg p-4 bg-v-surface flex justify-between gap-4"
          >
            <div>
              <span className="font-mono text-indigo-700 dark:text-indigo-300">{policy.toolId}</span>
              <p className="text-v-text-secondary mt-1">{policy.purpose}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing({ ...policy })}>
              Edit
            </Button>
          </div>
        ))}
      </div>

      <PipelinePolicyEditModal
        open={editing != null}
        title={editing ? `Edit tool policy: ${editing.toolId}` : 'Edit tool policy'}
        onClose={() => setEditing(null)}
        onSave={() => void save()}
        saving={saving}
      >
        {error && <Alert>{error}</Alert>}
        {message && editing && (
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        )}
        {editing && (
          <>
            <label className={labelClass}>
              Purpose
              <textarea
                className={inputClass}
                rows={2}
                value={editing.purpose}
                onChange={(e) => setEditing({ ...editing, purpose: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Fallback behavior
              <input
                className={inputClass}
                value={editing.fallbackBehavior}
                onChange={(e) => setEditing({ ...editing, fallbackBehavior: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-v-text-secondary">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
              Enabled
            </label>
          </>
        )}
      </PipelinePolicyEditModal>
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
      <p className="text-sm text-v-text-muted">One phrase per line.</p>
      <textarea
        className="w-full min-h-[200px] rounded border border-v-border px-3 py-2 bg-v-surface font-mono text-sm text-v-text-primary"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save phrases'}
      </Button>
    </div>
  );
}
