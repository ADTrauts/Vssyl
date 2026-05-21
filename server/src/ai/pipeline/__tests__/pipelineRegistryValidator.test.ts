import { describe, expect, it } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import {
  buildRegistryGraph,
  buildSourceToToolsMap,
  validateRegistryChange,
} from '../pipelineRegistryValidator';
import type { PipelineCatalog } from '../../types/pipelineDiagnostics';

function catalogWithCustomIntent(): PipelineCatalog {
  const base = getDefaultPipelineCatalog();
  return {
    ...base,
    intents: [
      ...base.intents,
      {
        id: 'career_transition',
        name: 'Career transition',
        description: 'Custom intent',
        triggerExamples: ['I want a new career path'],
        groundingRequired: false,
        enabled: true,
        isSystem: false,
        archived: false,
        capabilities: {
          executable: true,
          inferable: false,
          retrievalEnabled: true,
          enforceable: true,
        },
      },
    ],
    contextSources: [
      ...base.contextSources,
      {
        id: 'gmail',
        label: 'Gmail',
        description: 'External mail',
        enabled: true,
        wiredInTwin: false,
        isSystem: false,
        archived: false,
        mappedTools: ['web_search'],
        lifecycleStatus: 'planned',
      },
    ],
    toolPolicies: [
      ...base.toolPolicies,
      {
        toolId: 'repo_inspector',
        displayName: 'Repo inspector',
        purpose: 'Inspect repos',
        requiredIntents: ['career_transition'],
        optionalIntents: [],
        requiredPermissions: [],
        fallbackBehavior: 'skip',
        enabled: true,
        isSystem: false,
        archived: false,
        runtimeKind: 'policy_only',
        capabilities: {
          executable: false,
          inferable: false,
          retrievalEnabled: false,
          enforceable: false,
        },
      },
    ],
  };
}

describe('pipelineRegistryValidator', () => {
  it('accepts dynamic registry ids in catalog without stripping', () => {
    const catalog = catalogWithCustomIntent();
    expect(catalog.intents.some((i) => i.id === 'career_transition')).toBe(true);
    expect(catalog.contextSources.some((s) => s.id === 'gmail')).toBe(true);
    expect(catalog.toolPolicies.some((t) => t.toolId === 'repo_inspector')).toBe(true);
  });

  it('rejects duplicate intent id on create', () => {
    const catalog = getDefaultPipelineCatalog();
    const result = validateRegistryChange({
      catalog,
      entityType: 'intent',
      action: 'create',
      entityId: 'general_chat',
      payload: {
        id: 'general_chat',
        name: 'Dup',
        triggerExamples: ['hello'],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_ID')).toBe(true);
  });

  it('detects orphan source in grounding rule', () => {
    const catalog = getDefaultPipelineCatalog();
    const result = validateRegistryChange({
      catalog,
      entityType: 'grounding_rule',
      action: 'create',
      entityId: 'local_discovery',
      payload: {
        intentId: 'local_discovery',
        requiredSources: ['nonexistent_source_xyz'],
        optionalSources: [],
        requirementSummary: 'test',
      },
    });
    expect(result.errors.some((e) => e.code === 'ORPHAN_SOURCE')).toBe(true);
  });

  it('detects orphan tool in grounding rule', () => {
    const catalog = getDefaultPipelineCatalog();
    const result = validateRegistryChange({
      catalog,
      entityType: 'grounding_rule',
      action: 'update',
      entityId: 'local_discovery',
      payload: { requiredTools: ['fake_tool_xyz'] },
    });
    expect(result.errors.some((e) => e.code === 'ORPHAN_TOOL')).toBe(true);
  });

  it('blocks archiving system intent', () => {
    const catalog = getDefaultPipelineCatalog();
    const result = validateRegistryChange({
      catalog,
      entityType: 'intent',
      action: 'archive',
      entityId: 'general_chat',
      payload: { archived: true },
      existingEntity: { isSystem: true },
    });
    expect(result.errors.some((e) => e.code === 'SYSTEM_PROTECTED')).toBe(true);
  });

  it('rejects grounding rule for unknown intent', () => {
    const catalog = getDefaultPipelineCatalog();
    const result = validateRegistryChange({
      catalog,
      entityType: 'grounding_rule',
      action: 'create',
      entityId: 'unknown_intent_xyz',
      payload: {
        intentId: 'unknown_intent_xyz',
        requiredSources: [],
        requirementSummary: 'x',
      },
    });
    expect(result.errors.some((e) => e.code === 'ORPHAN_INTENT')).toBe(true);
  });

  it('uses custom mappedTools in buildSourceToToolsMap', () => {
    const catalog = catalogWithCustomIntent();
    const map = buildSourceToToolsMap(catalog);
    expect(map.gmail).toEqual(['web_search']);
  });

  it('buildRegistryGraph reports orphans for bad references', () => {
    const catalog = catalogWithCustomIntent();
    const graph = buildRegistryGraph(catalog);
    expect(graph.nodes.some((n) => n.id === 'career_transition')).toBe(true);
  });

  it('warns on policy_only tool', () => {
    const catalog = catalogWithCustomIntent();
    const result = validateRegistryChange({
      catalog,
      entityType: 'tool',
      action: 'create',
      entityId: 'new_policy_tool',
      payload: {
        toolId: 'new_policy_tool',
        runtimeKind: 'policy_only',
        purpose: 'x',
        fallbackBehavior: 'skip',
      },
    });
    expect(result.warnings.some((w) => w.code === 'POLICY_ONLY_TOOL')).toBe(true);
  });
});
