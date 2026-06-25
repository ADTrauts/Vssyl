import { describe, expect, it } from 'vitest';
import { ACTIVITY_INGEST_CONTRACT_VERSION } from 'vssyl-shared/types/activity-ingest';
import { parseActivityIngestFromManifest } from '../activityIngestManifest';
import {
  clearPartnerActivityIngestRegistry,
  loadActivityIngestFromPublishedVersion,
  registerPartnerActivityIngest,
  getPartnerActivityIngest,
} from '../activityIngestRegistry';

describe('activityIngestRegistry', () => {
  it('loads registration from valid manifest', () => {
    clearPartnerActivityIngestRegistry();
    process.env.PARTNER_ACTIVITY_INGEST_ENABLED = 'true';

    const manifest = {
      moduleScope: 'business',
      supportedContexts: ['business'],
      capabilities: { activity: true },
      entities: [{ type: 'asset', displayName: 'Asset', supportsActivity: true }],
      activityIngest: {
        contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
        supportedContexts: ['business'],
        entityTypes: ['asset'],
        actionTypes: ['create', 'update'],
      },
    };

    const result = loadActivityIngestFromPublishedVersion({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
      moduleStatus: 'APPROVED',
      manifestSnapshot: manifest,
      moduleVersionId: 'mv-1',
      semver: '1.0.0',
      sandboxCertified: true,
    });

    expect(result.loaded).toBe(true);
    expect(getPartnerActivityIngest('vssyl-pilot-assets')?.actionTypes).toContain('create');
  });

  it('parseActivityIngestFromManifest fails without block', () => {
    const { ingest, errors } = parseActivityIngestFromManifest({
      capabilities: { activity: true },
    });
    expect(ingest).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('registers sandbox pilot actions', () => {
    clearPartnerActivityIngestRegistry();
    registerPartnerActivityIngest({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
      moduleVersionId: 'sandbox',
      semver: '1.0.0',
      contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
      supportedContexts: ['business'],
      entityTypes: ['asset'],
      actionTypes: ['create', 'update', 'checked_out', 'maintenance_scheduled'],
      maxMetadataBytes: 4096,
      idempotencyRequired: true,
      registeredAt: new Date().toISOString(),
      sandboxCertified: true,
    });
    expect(getPartnerActivityIngest('vssyl-pilot-assets')?.actionTypes).toContain('checked_out');
  });
});
