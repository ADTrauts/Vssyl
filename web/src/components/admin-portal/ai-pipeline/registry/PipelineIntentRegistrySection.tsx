'use client';

import React, { useMemo, useState } from 'react';
import { Button, Alert, Badge, Modal } from 'shared/components';
import { useConfirm } from 'shared';
import { adminApiService } from '../../../../lib/adminApiService';
import { PipelineIntentEditor } from '../PipelinePolicyEditors';
import PipelineRegistryDependencyChips from './PipelineRegistryDependencyChips';
import PipelineRegistryPageShell from './PipelineRegistryPageShell';
import PipelineRegistryValidationPanel from './PipelineRegistryValidationPanel';
import { usePipelineRegistry } from './usePipelineRegistry';

const inputClass =
  'mt-1 w-full rounded border border-v-border px-3 py-2 bg-v-surface text-v-text-primary';
const labelClass = 'block text-sm text-v-text-secondary';

export default function PipelineIntentRegistrySection() {
  const { confirm, ConfirmDialog } = useConfirm();
  const {
    catalog,
    graph,
    loading,
    error,
    reload,
    validate,
    includeArchived,
    setIncludeArchived,
    filter,
    setFilter,
    search,
    setSearch,
    matchesFilter,
  } = usePipelineRegistry();

  const [creating, setCreating] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [validation, setValidation] = useState<Awaited<ReturnType<typeof validate>>>(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    triggerExamples: '',
    groundingRequired: true,
    createGroundingRule: true,
  });

  const filteredIntents = useMemo(
    () => (catalog?.intents ?? []).filter((i) => matchesFilter(i)),
    [catalog?.intents, matchesFilter]
  );

  const runValidate = async () => {
    const result = await validate({
      entityType: 'intent',
      action: 'create',
      entityId: form.id,
      payload: {
        id: form.id,
        name: form.name,
        triggerExamples: form.triggerExamples.split('\n').map((s) => s.trim()).filter(Boolean),
        groundingRequired: form.groundingRequired,
        createGroundingRule: form.createGroundingRule,
      },
    });
    setValidation(result);
    return result;
  };

  const createIntent = async () => {
    setCreateSaving(true);
    setCreateError(null);
    const v = await runValidate();
    if (v && !v.valid) {
      setCreateSaving(false);
      return;
    }
    const res = await adminApiService.createAiPipelineIntent({
      id: form.id.trim(),
      name: form.name,
      description: form.description,
      triggerExamples: form.triggerExamples.split('\n').map((s) => s.trim()).filter(Boolean),
      groundingRequired: form.groundingRequired,
      createGroundingRule: form.createGroundingRule,
    });
    setCreateSaving(false);
    if (res.error) {
      setCreateError(res.error);
      return;
    }
    setCreating(false);
    setValidation(res.data?.validation ?? null);
    void reload();
  };

  const duplicateIntent = async (id: string) => {
    const newId = `${id.replace(/_copy\d*$/, '')}_copy`;
    const res = await adminApiService.duplicateAiPipelineIntent(id, { newId });
    if (!res.error) void reload();
  };

  const archiveIntent = async (id: string) => {
    const v = await validate({ entityType: 'intent', action: 'archive', entityId: id, payload: { archived: true } });
    if (v && !v.valid) {
      setValidation(v);
      return;
    }
    const ok = await confirm({
      title: 'Archive intent?',
      description: `Archive intent "${id}"? Dependencies may be affected.`,
      variant: 'destructive',
      confirmLabel: 'Archive',
    });
    if (!ok) return;
    const res = await adminApiService.archiveAiPipelineIntent(id);
    if (!res.error) void reload();
  };

  return (
    <PipelineRegistryPageShell
      title="Intent catalog"
      description="System defaults and custom intents. Custom intents are policy metadata until catalog-driven inference (v2)."
      catalog={catalog}
      includeArchived={includeArchived}
      onIncludeArchivedChange={setIncludeArchived}
      filter={filter}
      onFilterChange={setFilter}
      search={search}
      onSearchChange={setSearch}
      onCreate={() => setCreating(true)}
      createLabel="Create intent"
    >
      {error && <Alert>{error}</Alert>}
      {loading && <p className="text-sm text-v-text-muted">Loading registry…</p>}
      {!loading && catalog && (
        <>
          <div className="overflow-x-auto border border-v-border rounded-lg mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-v-surface-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Intent</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-border">
                {filteredIntents.map((intent) => (
                  <tr key={intent.id}>
                    <td className="px-4 py-2">
                      <span className="font-mono text-indigo-700 dark:text-indigo-300">{intent.id}</span>
                      <PipelineRegistryDependencyChips graph={graph} entityId={intent.id} />
                      {!intent.isSystem && intent.capabilities?.inferable === false && (
                        <p className="text-xs text-amber-600 mt-1">Not inferable yet (v2)</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {intent.isSystem && <Badge className="bg-blue-100 text-blue-900 mr-1">System</Badge>}
                      {intent.archived && <Badge className="bg-v-surface-muted text-gray-800">Archived</Badge>}
                      {!intent.enabled && !intent.archived && (
                        <Badge className="bg-v-surface-muted text-gray-600">Disabled</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      {!intent.isSystem && !intent.archived && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => void duplicateIntent(intent.id)}>
                            Duplicate
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void archiveIntent(intent.id)}>
                            Archive
                          </Button>
                        </>
                      )}
                      {intent.archived && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void adminApiService.restoreAiPipelineIntent(intent.id).then(() => reload())}
                        >
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PipelineIntentEditor intents={filteredIntents.filter((i) => !i.archived)} onSaved={() => void reload()} />
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Create intent" size="large">
        <div className="space-y-4">
          {createError && <Alert>{createError}</Alert>}
          <PipelineRegistryValidationPanel validation={validation} />
          <label className={labelClass}>
            Id (snake_case)
            <input
              className={inputClass}
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              onBlur={() => void runValidate()}
            />
          </label>
          <label className={labelClass}>
            Name
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className={labelClass}>
            Description
            <textarea
              className={inputClass}
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className={labelClass}>
            Trigger examples (one per line)
            <textarea
              className={inputClass}
              rows={3}
              value={form.triggerExamples}
              onChange={(e) => setForm({ ...form, triggerExamples: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.groundingRequired}
              onChange={(e) =>
                setForm({
                  ...form,
                  groundingRequired: e.target.checked,
                  createGroundingRule: e.target.checked ? form.createGroundingRule : false,
                })
              }
            />
            Grounding required
          </label>
          {form.groundingRequired && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.createGroundingRule}
                onChange={(e) => setForm({ ...form, createGroundingRule: e.target.checked })}
              />
              Create grounding rule now
            </label>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-v-border">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createIntent()} disabled={createSaving}>
              {createSaving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog />
    </PipelineRegistryPageShell>
  );
}
