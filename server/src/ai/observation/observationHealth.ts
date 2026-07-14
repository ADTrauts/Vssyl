/**
 * Phase 5B — in-process observation health counters.
 */
import type { AIObservationHealthSnapshot, AIObservationHealthStatus } from 'vssyl-shared';
import { AI_OBSERVATION_DELIVERY_GUARANTEE_LABEL } from 'vssyl-shared';

let observationEnabledFlag = process.env.AI_RUNTIME_OBSERVATION_ENABLED !== 'false';

export function setObservationEnabledFlag(enabled: boolean): void {
  observationEnabledFlag = enabled;
}

export function getObservationEnabledFlag(): boolean {
  return observationEnabledFlag;
}

const counters = {
  emitted: 0,
  persisted: 0,
  dropped: 0,
  duplicates: 0,
  redactionFailures: 0,
  persistenceFailures: 0,
  persistenceTimeouts: 0,
  timelineRebuildFailures: 0,
  retentionBacklog: 0,
  collectorLatencyTotalMs: 0,
  collectorLatencySamples: 0,
  flushLatencyTotalMs: 0,
  flushLatencySamples: 0,
};

let queueDepth = 0;
let executionsMissingTerminal = 0;

export function resetObservationHealthForTests(): void {
  for (const k of Object.keys(counters) as (keyof typeof counters)[]) {
    counters[k] = 0;
  }
  queueDepth = 0;
  executionsMissingTerminal = 0;
}

export function incrEmitted(): void {
  counters.emitted += 1;
}
export function incrPersisted(): void {
  counters.persisted += 1;
}
export function incrDropped(): void {
  counters.dropped += 1;
}
export function incrDuplicates(): void {
  counters.duplicates += 1;
}
export function incrRedactionFailures(): void {
  counters.redactionFailures += 1;
}
export function incrPersistenceFailures(): void {
  counters.persistenceFailures += 1;
}
export function incrPersistenceTimeouts(): void {
  counters.persistenceTimeouts += 1;
}
export function incrTimelineRebuildFailures(): void {
  counters.timelineRebuildFailures += 1;
}
export function setRetentionBacklog(n: number): void {
  counters.retentionBacklog = n;
}
export function setQueueDepth(n: number): void {
  queueDepth = Math.max(0, n);
}
export function bumpQueueDepth(delta: number): void {
  queueDepth = Math.max(0, queueDepth + delta);
}
export function setExecutionsMissingTerminal(n: number): void {
  executionsMissingTerminal = n;
}
export function recordCollectorLatency(ms: number): void {
  counters.collectorLatencyTotalMs += ms;
  counters.collectorLatencySamples += 1;
}
export function recordFlushLatency(ms: number): void {
  counters.flushLatencyTotalMs += ms;
  counters.flushLatencySamples += 1;
}

function avg(total: number, samples: number): number {
  return samples === 0 ? 0 : Math.round((total / samples) * 100) / 100;
}

export function deriveObservationHealthStatus(
  enabled: boolean,
  snap: Omit<AIObservationHealthSnapshot, 'status' | 'enabled' | 'deliveryGuarantee' | 'redactionEnabled'>
): AIObservationHealthStatus {
  if (!enabled) return 'DISABLED';
  const failRate =
    snap.emitted === 0 ? 0 : snap.persistenceFailures / Math.max(snap.emitted, 1);
  if (failRate > 0.25 || snap.persistenceFailures > 50) return 'UNHEALTHY';
  if (
    failRate > 0.05 ||
    snap.persistenceTimeouts > 10 ||
    snap.executionsMissingTerminal > 5 ||
    snap.queueDepth > 500
  ) {
    return 'DEGRADED';
  }
  return 'HEALTHY';
}

export function getObservationHealthSnapshot(redactionEnabled: boolean): AIObservationHealthSnapshot {
  const enabled = getObservationEnabledFlag();
  const base = {
    emitted: counters.emitted,
    persisted: counters.persisted,
    dropped: counters.dropped,
    duplicates: counters.duplicates,
    redactionFailures: counters.redactionFailures,
    persistenceFailures: counters.persistenceFailures,
    persistenceTimeouts: counters.persistenceTimeouts,
    queueDepth,
    bufferedRequestCount: queueDepth,
    avgCollectorLatencyMs: avg(counters.collectorLatencyTotalMs, counters.collectorLatencySamples),
    avgFlushLatencyMs: avg(counters.flushLatencyTotalMs, counters.flushLatencySamples),
    executionsMissingTerminal,
    timelineRebuildFailures: counters.timelineRebuildFailures,
    retentionBacklog: counters.retentionBacklog,
  };
  return {
    status: deriveObservationHealthStatus(enabled, base),
    enabled,
    deliveryGuarantee: AI_OBSERVATION_DELIVERY_GUARANTEE_LABEL,
    redactionEnabled,
    ...base,
  };
}
