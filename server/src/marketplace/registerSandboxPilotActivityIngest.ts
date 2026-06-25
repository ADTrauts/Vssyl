import { ACTIVITY_INGEST_CONTRACT_VERSION } from 'vssyl-shared/types/activity-ingest';
import { SANDBOX_PILOT_ASSETS_MODULE_ID } from 'vssyl-shared/types/search-delegate';
import { registerPartnerActivityIngest } from './activityIngestRegistry.js';
import {
  isModuleAllowedForActivityIngest,
  isPartnerActivityIngestEnabled,
} from './activityIngestConfig.js';

const SANDBOX_PILOT_ACTIVITY_MANIFEST = {
  name: 'Vssyl Pilot Assets',
  version: '1.0.0',
  moduleScope: 'business',
  supportedContexts: ['business'],
  capabilities: { activity: true },
  entities: [
    {
      type: 'asset',
      displayName: 'Asset',
      supportsActivity: true,
    },
  ],
  activityIngest: {
    contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
    supportedContexts: ['business'],
    entityTypes: ['asset'],
    actionTypes: ['create', 'update', 'checked_out', 'maintenance_scheduled'],
    maxMetadataBytes: 4096,
    idempotencyRequired: true,
  },
};

export function registerSandboxPilotActivityIngestOnStartup(): void {
  if (!isPartnerActivityIngestEnabled()) {
    return;
  }
  if (!isModuleAllowedForActivityIngest(SANDBOX_PILOT_ASSETS_MODULE_ID)) {
    return;
  }

  registerPartnerActivityIngest({
    moduleId: SANDBOX_PILOT_ASSETS_MODULE_ID,
    moduleName: 'Vssyl Pilot Assets',
    moduleVersionId: 'sandbox-pilot-activity-v1',
    semver: '1.0.0',
    contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
    entityTypes: ['asset'],
    actionTypes: ['create', 'update', 'checked_out', 'maintenance_scheduled'],
    supportedContexts: ['business'],
    maxMetadataBytes: 4096,
    idempotencyRequired: true,
    registeredAt: new Date().toISOString(),
    sandboxCertified: true,
  });
}

export function getSandboxPilotActivityManifestSnapshot(): Record<string, unknown> {
  return { ...SANDBOX_PILOT_ACTIVITY_MANIFEST };
}

export function getSandboxPilotActivitySampleEvents(): Array<{
  action: string;
  targetId: string;
  metadata: Record<string, unknown>;
}> {
  return [
    { action: 'create', targetId: 'asset-sandbox-1', metadata: { label: 'Forklift A' } },
    { action: 'update', targetId: 'asset-sandbox-1', metadata: { status: 'active' } },
    { action: 'checked_out', targetId: 'asset-sandbox-2', metadata: { assignee: 'tech-1' } },
    {
      action: 'maintenance_scheduled',
      targetId: 'asset-sandbox-3',
      metadata: { scheduledAt: new Date().toISOString() },
    },
  ];
}
