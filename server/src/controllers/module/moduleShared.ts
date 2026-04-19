/**
 * Shared helpers for module HTTP handlers (manifest, upload error classification, categories).
 */

export function asRecordJson(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function getManifestEntryUrl(manifest: Record<string, unknown>): string | null {
  const frontend = asRecordJson(manifest.frontend);
  const value = frontend.entryUrl;
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

export function isValidHttpsEntryUrl(value: string | null): boolean {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Must match `ModuleCategory` in prisma schema */
export const VALID_MODULE_CATEGORIES = new Set([
  'PRODUCTIVITY',
  'COMMUNICATION',
  'ANALYTICS',
  'DEVELOPMENT',
  'ENTERTAINMENT',
  'EDUCATION',
  'FINANCE',
  'HEALTH',
  'OTHER',
]);

/** Safe hints for production clients when artifact upload init fails (GCS signing vs DB). */
export function classifyArtifactUploadInitError(err: Error): { errorCode: string; hint: string } {
  const msg = err.message;
  const lower = msg.toLowerCase();
  if (/does not exist|relation .* does not exist|table .* does not exist/i.test(msg)) {
    return {
      errorCode: 'DB_SCHEMA_MISSING',
      hint: 'Run prisma migrate deploy on the production database.',
    };
  }
  if (
    /sign|signblob|iamcredentials|token creator|does not have permission to sign|cannot sign/i.test(msg) ||
    (lower.includes('pem') && lower.includes('invalid'))
  ) {
    return {
      errorCode: 'GCS_SIGNING_FAILED',
      hint:
        'Cloud Run needs permission to create GCS V4 signed URLs: grant the runtime service account Storage access on the bucket and signing capability (e.g. roles/storage.objectAdmin on the bucket; roles/iam.serviceAccountTokenCreator on the service account for signBlob).',
    };
  }
  if (/bucket|does not exist|not found|404|no such/i.test(lower) && /storage|gcs|bucket/i.test(lower)) {
    return {
      errorCode: 'GCS_BUCKET_OR_OBJECT',
      hint: 'Verify GOOGLE_CLOUD_STORAGE_BUCKET and GOOGLE_CLOUD_PROJECT_ID point to an existing bucket.',
    };
  }
  if (/permission|denied|forbidden|403|access denied/i.test(lower)) {
    return {
      errorCode: 'GCS_PERMISSION_DENIED',
      hint: 'Grant the Cloud Run runtime service account roles/storage.objectAdmin (or equivalent) on the bucket.',
    };
  }
  if (/default credentials|metadata|application default credentials|could not refresh/i.test(lower)) {
    return {
      errorCode: 'GCP_CREDENTIALS',
      hint: 'Ensure Cloud Run uses a service account with Storage access (ADC on Cloud Run).',
    };
  }
  return {
    errorCode: 'UPLOAD_INIT_FAILED',
    hint: 'Check server logs for operation module_artifact_upload_init.',
  };
}
