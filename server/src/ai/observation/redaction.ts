/**
 * Phase 5B — Redaction before observation persistence (hardened).
 * Fail-closed: on redaction errors, drop metadata rather than persist unsafe payloads.
 */
import { incrRedactionFailures } from './observationHealth';

const SECRET_KEY_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|api[_-]?key|token|access[_-]?token|refresh[_-]?token|password|secret|jwt|bearer|oauth|client[_-]?secret)$/i;

const SECRET_VALUE_PATTERN =
  /\b(Bearer\s+[A-Za-z0-9._~+/=-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sk-[A-Za-z0-9]{10,}|xox[baprs]-[A-Za-z0-9-]+|ya29\.[A-Za-z0-9._-]+)\b/gi;

const SIGNED_URL_PATTERN =
  /(https?:\/\/[^\s]+[?&](X-Goog-Signature|X-Amz-Signature|Signature|sig|token)=[^\s]+)/gi;

const BASE64_IMAGE_PATTERN = /data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{40,}/g;

const BLOCKED_METADATA_KEYS = new Set([
  'providerReasoning',
  'privateReasoning',
  'chainOfThought',
  'rawProviderPayload',
  'authorization',
  'cookie',
  'cookies',
  'password',
  'secret',
  'jwt',
  'base64',
  'imageBase64',
  'fileContents',
  'rawOcr',
  'signedUrl',
  'signedURLs',
]);

/** Allowlisted top-level metadata keys preferred for operator telemetry */
export const OBSERVATION_METADATA_ALLOWLIST = new Set([
  'userQuery',
  'aiResponseSummary',
  'provider',
  'model',
  'requestedProvider',
  'requestedModel',
  'selectedProvider',
  'selectedModel',
  'selectionReason',
  'capabilityRequirements',
  'latencyMs',
  'costUsd',
  'tokensUsed',
  'inputTokens',
  'outputTokens',
  'retryCount',
  'rateLimited',
  'fallbackReason',
  'fallbackDestination',
  'conversationHistoryId',
  'pipelineDiagnosticId',
  'actionExecutionId',
  'actionExecutionIds',
  'approvalId',
  'approvalIds',
  'tool',
  'tools',
  'riskCategory',
  'authorized',
  'approvalRequired',
  'idempotentReplay',
  'failureKind',
  'message',
  'errorSummary',
  'errorCode',
  'fileIssueCode',
  'fileIssueCodes',
  'fileCount',
  'visionPartCount',
  'usedVision',
  'pdfRenderFallback',
  'groundingRequired',
  'groundingStatus',
  'enforcementResult',
  'evidenceCount',
  'sourceAttributionCount',
  'contextProviders',
  'relevantModuleCount',
  'activityId',
  'partial',
]);

export interface RedactionConfig {
  enabled: boolean;
  redactProviderReasoning: boolean;
  maxStringLength: number;
  maxPayloadBytes: number;
  enforceAllowlist: boolean;
}

export const DEFAULT_REDACTION_CONFIG: RedactionConfig = {
  enabled: true,
  redactProviderReasoning: true,
  maxStringLength: 2000,
  maxPayloadBytes: 16_384,
  enforceAllowlist: false, // soft by default; unknown keys still recursively redacted
};

function redactString(value: string, config: RedactionConfig): string {
  let out = value
    .replace(SECRET_VALUE_PATTERN, '[REDACTED]')
    .replace(SIGNED_URL_PATTERN, '[REDACTED_SIGNED_URL]')
    .replace(BASE64_IMAGE_PATTERN, '[REDACTED_BASE64_IMAGE]');
  if (out.length > config.maxStringLength) {
    out = `${out.slice(0, config.maxStringLength)}…[truncated]`;
  }
  return out;
}

export function redactValue(
  value: unknown,
  config: RedactionConfig = DEFAULT_REDACTION_CONFIG,
  keyHint?: string,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (!config.enabled) return value;
  if (keyHint && (SECRET_KEY_PATTERN.test(keyHint) || BLOCKED_METADATA_KEYS.has(keyHint))) {
    return '[REDACTED]';
  }
  if (typeof value === 'string') return redactString(value, config);
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'symbol' || typeof value === 'function') return '[UNSERIALIZABLE]';
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    return value.slice(0, 100).map((item) => redactValue(item, config, keyHint, seen));
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[CIRCULAR]';
    seen.add(value as object);
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (BLOCKED_METADATA_KEYS.has(k) || SECRET_KEY_PATTERN.test(k)) {
        out[k] = '[REDACTED]';
        continue;
      }
      if (config.redactProviderReasoning && /reasoning|chainOfThought|cot/i.test(k)) {
        out[k] = '[REDACTED_PRIVATE_REASONING]';
        continue;
      }
      out[k] = redactValue(v, config, k, seen);
    }
    return out;
  }
  return '[UNSERIALIZABLE]';
}

function estimateBytes(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export function redactMetadata(
  metadata: Record<string, unknown> | undefined,
  config: RedactionConfig = DEFAULT_REDACTION_CONFIG
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  try {
    let source = metadata;
    if (config.enforceAllowlist) {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(metadata)) {
        if (OBSERVATION_METADATA_ALLOWLIST.has(k)) filtered[k] = v;
      }
      source = filtered;
    }
    const redacted = redactValue(source, config) as Record<string, unknown>;
    if (estimateBytes(redacted) > config.maxPayloadBytes) {
      return {
        _redaction: 'payload_too_large',
        truncatedKeys: Object.keys(redacted).slice(0, 30),
      };
    }
    return redacted;
  } catch {
    incrRedactionFailures();
    return { _redaction: 'fail_closed' };
  }
}
