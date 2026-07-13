/**
 * Deterministic argument hashing and idempotency helpers for AI actions (Phase 1).
 */

import { createHash } from 'node:crypto';

/** Stable JSON stringify with sorted object keys. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function hashToolArguments(args: Record<string, unknown>): string {
  return createHash('sha256').update(stableStringify(args)).digest('hex');
}

/**
 * Stale EXECUTING recovery window (Phase 1B).
 * Records older than this may be retried by policy; documented in open limitations.
 */
export const STALE_EXECUTING_MS = 15 * 60 * 1000;

export function buildDefaultIdempotencyKey(input: {
  userId: string;
  businessId?: string | null;
  actionName: string;
  argsHash: string;
  approvalId?: string | null;
}): string {
  const biz = input.businessId?.trim() || 'personal';
  const approval = input.approvalId?.trim() || 'none';
  return `ai-action:${input.userId}:${biz}:${input.actionName}:${input.argsHash}:${approval}`;
}
