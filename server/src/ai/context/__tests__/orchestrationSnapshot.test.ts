import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ProviderSelectionDiagnostic } from '../../../../../shared/src/types/ai-context-provider-contract';
import {
  appendOrchestrationSnapshot,
  buildOrchestrationSnapshot,
  deriveOrchestrationTraceTags,
  emitOrchestrationSnapshot,
  ORCHESTRATOR_VERSION,
  HIGH_LATENCY_THRESHOLD_MS,
  redactQueryPreview,
  shouldEmitOrchestrationSnapshot,
  MAX_ORCHESTRATION_SNAPSHOTS_PER_REQUEST,
} from '../orchestrationSnapshot';
import type { OrchestrationSnapshotBuildInput } from '../orchestrationSnapshot';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function minimalBuildInput(
  overrides?: Partial<OrchestrationSnapshotBuildInput>
): OrchestrationSnapshotBuildInput {
  const diagnostics: ProviderSelectionDiagnostic[] = [
    {
      providerId: 'drive.recent_files',
      moduleId: 'drive',
      providerName: 'recent_files',
      phase: 'selected',
      retrievalCost: 'low',
    },
    {
      providerId: 'chat.unread',
      moduleId: 'chat',
      providerName: 'unread',
      phase: 'skipped',
      reason: 'intent_mismatch',
    },
  ];

  return {
    contextGenerationId: 'gen-1',
    userId: 'user-1',
    query: 'show my files near me',
    detectedIntents: ['local_discovery'],
    passKind: 'module_context',
    requiredSourceIds: ['location'],
    optionalSourceIds: ['vssyl_place'],
    groundingSourceToProvider: [
      {
        sourceId: 'drive_files',
        providerId: 'drive.recent_files',
        moduleId: 'drive',
        providerName: 'recent_files',
      },
    ],
    providerSelectionDiagnostics: diagnostics,
    providerFetchAudit: [
      {
        moduleId: 'drive',
        providerName: 'recent_files',
        providerId: 'drive.recent_files',
        status: 'succeeded',
        resultStatus: 'hit',
        freshness: 'fresh',
        latencyMs: 42,
      },
    ],
    requiredSourceFailures: [],
    staleContextWarnings: [],
    groundingFailure: false,
    enforcement: {
      enforcementEnabled: false,
      enforcementMode: 'off',
    },
    timing: {
      startedAt: '2026-05-26T10:00:00.000Z',
      completedAt: '2026-05-26T10:00:00.150Z',
    },
    ...overrides,
  };
}

describe('orchestrationSnapshot', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envBackup };
  });

  afterEach(() => {
    process.env = envBackup;
  });

  it('redactQueryPreview truncates and redacts sensitive patterns', () => {
    const email = 'contact@example.com';
    const preview = redactQueryPreview(
      `Please email ${email} my api key sk-abcdefghijklmnopqrstuvwxyz and ${'x'.repeat(200)}`
    );
    expect(preview).toContain('[email]');
    expect(preview).toContain('[api_key]');
    expect(preview.length).toBeLessThanOrEqual(120);
    expect(preview.endsWith('…')).toBe(true);
  });

  it('buildOrchestrationSnapshot produces stable metadata shape', () => {
    const snapshot = buildOrchestrationSnapshot(minimalBuildInput());
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.orchestratorVersion).toBe(ORCHESTRATOR_VERSION);
    expect(snapshot.contextGenerationId).toBe('gen-1');
    expect(snapshot.passKind).toBe('module_context');
    expect(snapshot.selectedProviders).toHaveLength(1);
    expect(snapshot.skippedProviders).toHaveLength(1);
    expect(snapshot.groundingSources.required).toContain('location');
    expect(snapshot.timing.totalLatencyMs).toBe(150);
    expect(snapshot.outcome.selectedCount).toBe(1);
    expect(JSON.stringify(snapshot)).not.toMatch(/"data"\s*:/);
    expect(JSON.stringify(snapshot)).not.toMatch(/contextBlocks/);
  });

  it('deriveOrchestrationTraceTags is deterministic with no duplicates', () => {
    const input = {
      groundingFailure: true,
      requiredSourceFailures: ['drive_files'],
      staleContextWarnings: ['drive stale'],
      passKind: 'grounding_module_sources' as const,
      snapshotForce: true,
      totalLatencyMs: HIGH_LATENCY_THRESHOLD_MS + 100,
      selectedProviders: [
        {
          providerId: 'drive.storage_overview',
          moduleId: 'drive',
          providerName: 'storage_overview',
        },
      ],
      skippedProviders: [],
    };
    const first = deriveOrchestrationTraceTags(input);
    const second = deriveOrchestrationTraceTags(input);
    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(first.length);
    expect(first).toEqual(
      expect.arrayContaining([
        'grounding_failure',
        'required_source_failure',
        'stale_context',
        'admin_debug',
        'grounding_boost',
        'high_latency',
        'fallback_provider',
      ])
    );
    for (const tag of first) {
      expect(tag).toMatch(/^[a-z_]+$/);
      expect(JSON.stringify(minimalBuildInput().query)).not.toContain(tag);
    }
  });

  it('emitOrchestrationSnapshot adds sampled_snapshot in production when sampled', () => {
    process.env.AI_ORCHESTRATION_SNAPSHOT_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    process.env.AI_ORCHESTRATION_SNAPSHOT_SAMPLE_RATE = '1';

    const snapshot = buildOrchestrationSnapshot(minimalBuildInput());
    const emitted = emitOrchestrationSnapshot(snapshot);
    expect(emitted?.traceTags).toContain('sampled_snapshot');
    expect(new Set(emitted?.traceTags ?? []).size).toBe(emitted?.traceTags?.length);
  });

  it('shouldEmitOrchestrationSnapshot respects master flag and force', () => {
    delete process.env.AI_ORCHESTRATION_SNAPSHOT_ENABLED;
    expect(shouldEmitOrchestrationSnapshot()).toBe(false);
    expect(shouldEmitOrchestrationSnapshot({ force: true })).toBe(true);

    process.env.AI_ORCHESTRATION_SNAPSHOT_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    process.env.AI_ORCHESTRATION_SNAPSHOT_SAMPLE_RATE = '0';
    expect(shouldEmitOrchestrationSnapshot()).toBe(false);

    process.env.NODE_ENV = 'development';
    expect(shouldEmitOrchestrationSnapshot()).toBe(true);
  });

  it('emitOrchestrationSnapshot returns undefined when disabled', () => {
    delete process.env.AI_ORCHESTRATION_SNAPSHOT_ENABLED;
    const snapshot = buildOrchestrationSnapshot(minimalBuildInput());
    expect(emitOrchestrationSnapshot(snapshot)).toBeUndefined();
  });

  it('appendOrchestrationSnapshot caps at two per request', () => {
    const ctx: Record<string, unknown> = {};
    const base = buildOrchestrationSnapshot(minimalBuildInput());
    for (let i = 0; i < MAX_ORCHESTRATION_SNAPSHOTS_PER_REQUEST + 1; i += 1) {
      appendOrchestrationSnapshot(ctx, {
        ...base,
        snapshotId: `snap-${i}`,
        contextGenerationId: `gen-${i}`,
      });
    }
    const snaps = ctx.orchestrationSnapshots as Array<{ snapshotId: string }>;
    expect(snaps).toHaveLength(2);
    expect(snaps[0]?.snapshotId).toBe('snap-1');
    expect(snaps[1]?.snapshotId).toBe('snap-2');
  });
});
