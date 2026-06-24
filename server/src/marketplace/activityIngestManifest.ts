import {
  ACTIVITY_INGEST_CONTRACT_VERSION,
  type ActivityIngestManifestCapability,
} from 'shared/types/activity-ingest';
import type { SearchTenantContext } from 'shared/types/search';
import { ACTIVITY_INGEST_DEFAULT_MAX_METADATA_BYTES } from './activityIngestConfig.js';

const MODULE_ID_PATTERN = /^[a-z][a-z0-9-]{1,62}$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function declaresActivityCapability(manifest: Record<string, unknown>): boolean {
  const caps = asRecord(manifest.capabilities);
  if (caps?.activity === true) return true;
  if (Array.isArray(manifest.capabilities)) {
    return manifest.capabilities.some(
      (c) => typeof c === 'string' && c.toLowerCase() === 'activity'
    );
  }
  return false;
}

export function isValidMarketplaceModuleIdForActivity(moduleId: string): boolean {
  return MODULE_ID_PATTERN.test(moduleId);
}

export function parseActivityIngestFromManifest(
  manifest: Record<string, unknown>
): { ingest: ActivityIngestManifestCapability | null; errors: string[] } {
  const errors: string[] = [];

  if (!declaresActivityCapability(manifest)) {
    return { ingest: null, errors: [] };
  }

  const raw = asRecord(manifest.activityIngest);
  if (!raw) {
    errors.push('capabilities.activity requires activityIngest block');
    return { ingest: null, errors };
  }

  if (raw.contractVersion !== ACTIVITY_INGEST_CONTRACT_VERSION) {
    errors.push(`activityIngest.contractVersion must be "${ACTIVITY_INGEST_CONTRACT_VERSION}"`);
  }

  const supportedContexts = asStringArray(raw.supportedContexts).filter(
    (c): c is SearchTenantContext =>
      c === 'personal' || c === 'business' || c === 'household'
  );
  if (supportedContexts.length === 0) {
    errors.push(
      'activityIngest.supportedContexts must include personal, business, and/or household'
    );
  }

  const entityTypes = asStringArray(raw.entityTypes);
  if (entityTypes.length === 0) {
    errors.push('activityIngest.entityTypes must be a non-empty array');
  }

  const actionTypes = asStringArray(raw.actionTypes);
  if (actionTypes.length === 0) {
    errors.push('activityIngest.actionTypes must be a non-empty array');
  }

  const manifestEntities = asStringArray(
    Array.isArray(manifest.entities)
      ? (manifest.entities as unknown[])
          .map((e) => {
            const rec = asRecord(e);
            if (!rec || rec.supportsActivity !== true) return null;
            return typeof rec.type === 'string' ? rec.type : null;
          })
          .filter((t): t is string => typeof t === 'string')
      : []
  );

  for (const et of entityTypes) {
    if (manifestEntities.length > 0 && !manifestEntities.includes(et)) {
      errors.push(
        `activityIngest.entityTypes "${et}" must match an entities[].type with supportsActivity: true`
      );
    }
  }

  let maxMetadataBytes = ACTIVITY_INGEST_DEFAULT_MAX_METADATA_BYTES;
  if (typeof raw.maxMetadataBytes === 'number' && Number.isFinite(raw.maxMetadataBytes)) {
    maxMetadataBytes = Math.min(8192, Math.max(256, Math.floor(raw.maxMetadataBytes)));
  }

  if (errors.length > 0) {
    return { ingest: null, errors };
  }

  return {
    ingest: {
      contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
      supportedContexts,
      entityTypes,
      actionTypes,
      maxMetadataBytes,
      idempotencyRequired: raw.idempotencyRequired !== false,
    },
    errors: [],
  };
}
